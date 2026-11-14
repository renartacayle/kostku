"""
Tiered Modeling, Walk-Forward WMAPE Validation, Safety Fallback & Batch Inference
for KostKu Web POS Demand & Sales Forecasting.

Tier Routing by store history age (uncensored operational days):
- < 14 days  -> TIER_1_CATEGORY_BENCHMARK (City / UMK Tier + Category peer average)
- 14-45 days -> TIER_2_STATISTICAL_BASELINE (Exponentially weighted moving average
                over non-stockout days * DOW multiplier * Payday multiplier)
- 45-180 days-> TIER_3_LGBM_QUANTILE (Global LightGBM Quantile Regressor across all
                stores & SKUs with alpha=0.1, 0.5, 0.9 + clamped +/-10% macro layer
                for H30 + automatic WMAPE Walk-Forward Safety Fallback to Baseline).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
import math
import numpy as np
import pandas as pd

try:
    from lightgbm import LGBMRegressor
    HAS_LIGHTGBM = True
except Exception:
    LGBMRegressor = None
    HAS_LIGHTGBM = False

from features import (
    BASE_FEATURE_COLUMNS,
    UMK_TIER_MAP,
    clamp_macro_retail_adjustment_pct,
    is_payday_day,
    prepare_training_and_feature_frame,
)


QUANTILES: Tuple[float, float, float] = (0.1, 0.5, 0.9)
HORIZONS: List[Tuple[str, int, str]] = [
    ("H1_TOMORROW", 1, "Besok (H+1)"),
    ("H7_NEXT_WEEK", 7, "Minggu Depan (H+1 s.d. H+7)"),
    ("H30_NEXT_MONTH", 30, "Bulan Depan (H+1 s.d. H+30)"),
]


def compute_wmape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Weighted Mean Absolute Percentage Error (WMAPE).
    Safe for zero-sale transactions because denominator is total realized volume.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    total_actual = float(np.sum(np.abs(y_t)))
    if total_actual <= 1e-6:
        # Fallback scaled MAE if zero actual sales in validation slice
        return round(float(np.mean(np.abs(y_t - y_p))), 4)
    return round(float(np.sum(np.abs(y_t - y_p)) / total_actual), 4)


def enforce_quantile_order(p10: float, p50: float, p90: float) -> Tuple[float, float, float]:
    """Guarantees non-negative monotonic quantiles p10 <= p50 <= p90."""
    q10 = max(0.0, float(p10))
    q50 = max(q10, float(p50))
    q90 = max(q50, float(p90))
    return round(q10, 2), round(q50, 2), round(q90, 2)


def compute_statistical_baseline_day(
    sku_history: pd.DataFrame,
    target_dow: int,
    target_payday: int,
    cat_dow_factors: Dict[int, float],
    store_payday_boost: float = 1.12,
) -> Tuple[float, float, float]:
    """
    Tier 2 Statistical Baseline using uncensored (is_stockout == 0) observations only:
    Weighted Moving Average * DOW Multiplier * Payday Window Multiplier.
    """
    valid = sku_history[sku_history["is_stockout"] == 0].sort_values("sale_date")
    if valid.empty:
        valid = sku_history.sort_values("sale_date")
    if valid.empty:
        return 0.0, 0.0, 0.0

    qty_vals = valid["qty_sold"].values.astype(float)
    n = len(qty_vals)
    # Recency-weighted average (half-life ~10 days)
    weights = np.exp(np.linspace(-1.8, 0.0, n))
    w_mean = float(np.sum(weights * qty_vals) / np.sum(weights))

    # Day-of-week multiplier computed from SKU if >= 2 samples, shrunk toward category multiplier
    sku_dow = valid[valid["day_of_week"] == target_dow]["qty_sold"]
    cat_factor = float(cat_dow_factors.get(target_dow, 1.0))
    if len(sku_dow) >= 2 and w_mean > 0.1:
        raw_sku_factor = float(sku_dow.mean()) / w_mean
        raw_sku_factor = float(np.clip(raw_sku_factor, 0.55, 1.65))
        dow_factor = 0.6 * raw_sku_factor + 0.4 * cat_factor
    else:
        dow_factor = cat_factor

    payday_factor = store_payday_boost if target_payday == 1 else 1.0
    p50 = max(0.0, w_mean * dow_factor * payday_factor)

    std_est = float(np.std(qty_vals[-min(n, 28):], ddof=0)) if n > 1 else max(1.0, 0.25 * p50)
    spread = max(0.75, 1.28 * std_est)
    return enforce_quantile_order(p50 - 0.85 * spread, p50, p50 + spread)


@dataclass
class GlobalQuantileBundle:
    models: Dict[float, Any]
    cat_vocab: Dict[str, int]
    feature_columns: List[str]
    is_trained: bool = False


def train_global_lgbm_quantile_models(
    feat_df: pd.DataFrame,
    cat_vocab: Dict[str, int],
) -> GlobalQuantileBundle:
    """
    Trains 3 Global LightGBM Quantile Regressors (alpha = 0.1, 0.5, 0.9) jointly
    across all stores & SKUs for cross-learning on uncensored (is_stockout == 0) rows.
    """
    bundle = GlobalQuantileBundle(
        models={},
        cat_vocab=cat_vocab,
        feature_columns=list(BASE_FEATURE_COLUMNS),
        is_trained=False,
    )
    if not HAS_LIGHTGBM or feat_df.empty:
        return bundle

    # CRITICAL: Filter out censored stockout rows during training!
    train_df = feat_df[feat_df["is_stockout"] == 0].copy()
    if len(train_df) < 40:
        return bundle

    X = train_df[BASE_FEATURE_COLUMNS].astype(float)
    y = train_df["qty_sold"].astype(float)

    for alpha in QUANTILES:
        model = LGBMRegressor(
            objective="quantile",
            alpha=alpha,
            n_estimators=140,
            learning_rate=0.05,
            num_leaves=23,
            min_child_samples=12,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_alpha=0.5,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=1,
            verbosity=-1,
        )
        model.fit(X, y)
        bundle.models[alpha] = model

    bundle.is_trained = True
    return bundle


def walk_forward_backtest_store(
    store_df: pd.DataFrame,
    feat_all: pd.DataFrame,
    cat_vocab: Dict[str, int],
    cat_dow_factors: Dict[int, float],
    backtest_days: int = 10,
) -> Tuple[Optional[float], Optional[float], bool]:
    """
    Walk-forward validation on the most recent valid non-stockout days of a store:
    Fits LightGBM strictly before the validation cutoff window (no leakage) and compares
    WMAPE(ML) vs WMAPE(Statistical Baseline). If WMAPE(ML) > WMAPE(Baseline), sets
    fallback_triggered = True.
    """
    valid_store = store_df[store_df["is_stockout"] == 0].sort_values("sale_date")
    unique_dates = sorted(valid_store["sale_date"].unique())
    if len(unique_dates) < 35:
        return None, None, False

    eval_dates = unique_dates[-min(backtest_days, max(5, len(unique_dates) // 5)):]
    cutoff_date = pd.Timestamp(eval_dates[0])

    # Fit validation global ML strictly strictly BEFORE cutoff_date (walk-forward split)
    pre_cutoff = feat_all[(feat_all["sale_date"] < cutoff_date) & (feat_all["is_stockout"] == 0)]
    if not HAS_LIGHTGBM or len(pre_cutoff) < 40:
        return None, None, True

    val_model = LGBMRegressor(
        objective="quantile",
        alpha=0.5,
        n_estimators=100,
        learning_rate=0.05,
        num_leaves=23,
        min_child_samples=10,
        random_state=42,
        n_jobs=1,
        verbosity=-1,
    )
    val_model.fit(pre_cutoff[BASE_FEATURE_COLUMNS].astype(float), pre_cutoff["qty_sold"].astype(float))

    eval_rows = valid_store[valid_store["sale_date"] >= cutoff_date].copy()
    if eval_rows.empty:
        return None, None, False

    ml_preds = np.maximum(0.0, val_model.predict(eval_rows[BASE_FEATURE_COLUMNS].astype(float)))
    y_true = eval_rows["qty_sold"].values.astype(float)

    base_preds: List[float] = []
    for _, row in eval_rows.iterrows():
        sku_hist = valid_store[
            (valid_store["product_id"] == row["product_id"])
            & (valid_store["sale_date"] < row["sale_date"])
        ]
        _, p50_b, _ = compute_statistical_baseline_day(
            sku_history=sku_hist,
            target_dow=int(row["day_of_week"]),
            target_payday=int(row["is_payday_window"]),
            cat_dow_factors=cat_dow_factors,
        )
        base_preds.append(p50_b)

    wmape_ml = compute_wmape(y_true, ml_preds)
    wmape_base = compute_wmape(y_true, np.array(base_preds, dtype=float))
    fallback_triggered = bool(wmape_ml > wmape_base)
    return wmape_ml, wmape_base, fallback_triggered


def build_explainability_summary(
    product_name: str,
    horizon_code: str,
    model_tier: str,
    p50_qty: float,
    current_stock: float,
    stockout_days_28d: int,
    velocity_trend: float,
    future_slice: pd.DataFrame,
    macro_adj_pct: float,
    wmape_ml: Optional[float],
    wmape_base: Optional[float],
    fallback_triggered: bool,
) -> Tuple[str, List[Dict[str, Any]]]:
    """Generates short Indonesian explainability text & structured drivers."""
    reasons: List[str] = []
    drivers: List[Dict[str, Any]] = []

    if model_tier == "TIER_1_CATEGORY_BENCHMARK":
        reasons.append("Histori toko <14 hari (pakai benchmark kategori & tier UMK kota)")
        drivers.append({"factor": "Cold-Start Benchmark", "impact": "Base UMK/Kategori"})
    elif model_tier == "TIER_3_FALLBACK_BASELINE":
        reasons.append(
            f"Safety Fallback aktif ke Baseline (WMAPE ML {round((wmape_ml or 0)*100, 1)}% > Baseline {round((wmape_base or 0)*100, 1)}%)"
        )
        drivers.append({"factor": "Safety Fallback WMAPE", "impact": "Baseline Protected"})

    if stockout_days_28d > 0:
        reasons.append(f"{stockout_days_28d} hari stockout dikoreksi agar tidak bias nol")
        drivers.append({"factor": "Koreksi Stockout", "impact": f"+{stockout_days_28d}h terimputasi"})

    if velocity_trend >= 0.12:
        reasons.append(f"Tren 7h naik +{round(velocity_trend * 100)}% vs 28h")
        drivers.append({"factor": "Momentum 7h vs 28h", "impact": f"+{round(velocity_trend * 100)}%"})
    elif velocity_trend <= -0.12:
        reasons.append(f"Tren 7h melandai {round(velocity_trend * 100)}% vs 28h")
        drivers.append({"factor": "Momentum 7h vs 28h", "impact": f"{round(velocity_trend * 100)}%"})

    if not future_slice.empty:
        weekend_cnt = int(future_slice["is_weekend"].sum())
        payday_cnt = int(future_slice["is_payday_window"].sum())
        holiday_cnt = int(future_slice["is_holiday"].sum())
        heavy_rain_cnt = int((future_slice["rain_mm"] >= 10.0).sum())

        if payday_cnt > 0:
            reasons.append("Mencakup jendela tanggal gajian (tgl 25–5)")
            drivers.append({"factor": "Payday Window", "impact": "+Efek Gajian"})
        if weekend_cnt > 0:
            reasons.append("Termasuk lonjakan akhir pekan")
            drivers.append({"factor": "Akhir Pekan", "impact": f"{weekend_cnt} hari"})
        if holiday_cnt > 0:
            reasons.append("Ada hari libur/tanggal merah")
            drivers.append({"factor": "Hari Libur", "impact": f"{holiday_cnt} hari"})
        if heavy_rain_cnt > 0:
            reasons.append("Prakiraan hujan lokal mempengaruhi trafik")
            drivers.append({"factor": "Cuaca Hujan", "impact": f"{heavy_rain_cnt} hari hujan"})

    if horizon_code == "H30_NEXT_MONTH" and abs(macro_adj_pct) >= 0.5:
        sign = "+" if macro_adj_pct > 0 else ""
        reasons.append(f"Penyesuaian makro/indeks ritel H+30 ({sign}{macro_adj_pct}%, clamp +-10%)")
        drivers.append({"factor": "Konteks Makro H+30", "impact": f"{sign}{macro_adj_pct}%"})

    shortfall_p50 = max(0.0, p50_qty - current_stock)
    if shortfall_p50 > 0:
        reasons.append(f"Stok {int(round(current_stock))} kurang {int(math.ceil(shortfall_p50))} dari target P50")

    if not reasons:
        reasons.append("Permintaan stabil mengikuti rata-rata historis bebas stockout")

    summary = ". ".join(reasons[:3]) + "."
    return summary, drivers


def run_forecast_batch(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    End-to-end Nightly Batch Forecast execution:
    - Prepares features with is_stockout censoring.
    - Trains Global LightGBM Quantile (0.1, 0.5, 0.9) cross-learning model.
    - Applies Tiered Routing (<14d, 14-45d, 45-180d) + WMAPE Walk-Forward Safety Fallback.
    - Projects H1_TOMORROW, H7_NEXT_WEEK, H30_NEXT_MONTH with P10/P50/P90 & restock advice.
    """
    run_date_str = str(payload.get("run_date") or datetime.now().strftime("%Y-%m-%d"))
    run_date = pd.Timestamp(run_date_str)

    sales_rows = payload.get("daily_sku_sales") or []
    cal_rows = payload.get("external_calendar_weather") or []
    macro_rows = payload.get("regional_umk_macro") or []
    stores_meta = payload.get("stores") or []
    products_meta = payload.get("products") or []

    sales_df = pd.DataFrame(sales_rows)
    if not sales_df.empty and stores_meta:
        store_city_map = {str(s["store_id"]): str(s.get("city") or "Semarang") for s in stores_meta}
        if "city" not in sales_df.columns:
            sales_df["city"] = sales_df["store_id"].astype(str).map(store_city_map).fillna("Semarang")
        else:
            sales_df["city"] = sales_df["city"].fillna(sales_df["store_id"].astype(str).map(store_city_map)).fillna("Semarang")
    cal_df = pd.DataFrame(cal_rows)
    macro_df = pd.DataFrame(macro_rows)

    feat_df, cat_vocab = prepare_training_and_feature_frame(sales_df, cal_df, macro_df)
    bundle = train_global_lgbm_quantile_models(feat_df, cat_vocab)

    # Global Category x UMK Tier Benchmark lookup (for Tier 1 Cold-Start stores < 14 days)
    cat_city_benchmark: Dict[Tuple[str, str], float] = {}
    cat_global_benchmark: Dict[str, float] = {}
    cat_dow_map: Dict[str, Dict[int, float]] = {}

    if not feat_df.empty:
        uncens = feat_df[feat_df["is_stockout"] == 0]
        if uncens.empty:
            uncens = feat_df
        for cat, c_grp in uncens.groupby("category_name"):
            cat_mean = max(1.0, float(c_grp["qty_sold"].mean()))
            cat_global_benchmark[str(cat)] = cat_mean
            dow_means = c_grp.groupby("day_of_week")["qty_sold"].mean().to_dict()
            cat_dow_map[str(cat)] = {
                int(d): float(np.clip(float(dow_means.get(d, cat_mean)) / cat_mean, 0.65, 1.55))
                for d in range(7)
            }
            for tier, t_grp in c_grp.groupby("umk_tier"):
                cat_city_benchmark[(str(cat), str(tier))] = max(1.0, float(t_grp["qty_sold"].mean()))

    # Pre-index calendar & macro for future horizons (H+1 .. H+30)
    cal_lookup: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for row in cal_rows:
        cal_lookup[(str(row.get("city", "Semarang")), str(row.get("target_date"))[:10])] = row

    macro_by_city: Dict[str, Dict[str, Any]] = {}
    for row in macro_rows:
        macro_by_city[str(row.get("city", "Semarang"))] = row

    # Future 30-day date grid starting at run_date + 1 day (H+1 .. H+30)
    future_dates = [run_date + timedelta(days=i) for i in range(1, 31)]

    forecasts: List[Dict[str, Any]] = []
    store_diagnostics: List[Dict[str, Any]] = []

    store_map = {str(s["store_id"]): s for s in stores_meta}
    # Ensure stores from sales_df also exist in store_map
    if not feat_df.empty:
        for sid, s_grp in feat_df.groupby("store_id"):
            if str(sid) not in store_map:
                store_map[str(sid)] = {
                    "store_id": str(sid),
                    "store_name": str(sid),
                    "city": str(s_grp["city"].iloc[-1]),
                    "umk_tier": str(s_grp["umk_tier"].iloc[-1]),
                }

    for store_id, s_meta in store_map.items():
        city = str(s_meta.get("city") or "Semarang")
        mac = macro_by_city.get(city, {})
        umk_tier = str(mac.get("umk_tier") or s_meta.get("umk_tier") or "TIER_B_MADYA")
        umk_monthly = float(mac.get("umk_monthly_idr") or mac.get("umk_idr") or s_meta.get("umk_monthly_idr") or 3240000)
        food_inf = float(mac.get("food_inflation_yoy_pct") or mac.get("food_inflation_yoy") or 3.1)
        policy_rate = float(mac.get("policy_rate_pct") or mac.get("bi_rate_pct") or 6.0)
        commodity_idx = float(mac.get("commodity_index") or mac.get("staple_commodity_index") or 101.5)
        retail_ret_30d = float(mac.get("retail_index_30d_return_pct") or mac.get("retail_index_30d_trend") or 0.0)

        store_hist = feat_df[feat_df["store_id"] == store_id] if not feat_df.empty else pd.DataFrame()
        history_days = int(store_hist["sale_date"].nunique()) if not store_hist.empty else int(s_meta.get("history_days") or 0)

        wmape_ml: Optional[float] = None
        wmape_base: Optional[float] = None
        fallback_triggered = False

        if history_days < 14:
            resolved_tier = "TIER_1_CATEGORY_BENCHMARK"
            routing_reason = f"Histori toko baru {history_days} hari (<14h): memakai benchmark kategori & tier UMK {city}."
        elif history_days < 45:
            resolved_tier = "TIER_2_STATISTICAL_BASELINE"
            routing_reason = f"Histori toko {history_days} hari (14–45h): memakai Statistical Baseline (WMA x Hari x Gajian)."
        else:
            # Tier 3: Global LightGBM + Walk-Forward Backtest Safety Check
            store_cat = str(store_hist["category_name"].iloc[-1]) if not store_hist.empty else "Makanan"
            dow_factors = cat_dow_map.get(store_cat, {d: 1.0 for d in range(7)})
            wmape_ml, wmape_base, fallback_triggered = walk_forward_backtest_store(
                store_df=store_hist,
                feat_all=feat_df,
                cat_vocab=cat_vocab,
                cat_dow_factors=dow_factors,
            )
            if fallback_triggered or not bundle.is_trained:
                resolved_tier = "TIER_3_FALLBACK_BASELINE"
                fallback_triggered = True
                routing_reason = f"Safety Fallback aktif: WMAPE ML ({wmape_ml}) > Baseline ({wmape_base}); otomatis pakai Statistical Baseline."
            else:
                resolved_tier = "TIER_3_LGBM_QUANTILE"
                routing_reason = f"LightGBM Quantile lolos Walk-Forward Backtest (WMAPE ML {wmape_ml} <= Baseline {wmape_base})."

        store_products = [p for p in products_meta if str(p.get("store_id")) == store_id]
        if not store_products and not store_hist.empty:
            for pid, p_grp in store_hist.groupby("product_id"):
                store_products.append({
                    "store_id": store_id,
                    "product_id": str(pid),
                    "product_name": str(pid),
                    "category_name": str(p_grp["category_name"].iloc[-1]),
                    "price_idr": float(p_grp["effective_price_idr"].iloc[-1]),
                    "current_stock_qty": float(p_grp.get("closing_stock_qty", pd.Series([0])).iloc[-1] or 0),
                })

        store_diagnostics.append({
            "store_id": store_id,
            "store_name": s_meta.get("store_name") or store_id,
            "city": city,
            "umk_tier": umk_tier,
            "history_days": history_days,
            "store_history_days": history_days,
            "selected_tier": resolved_tier,
            "model_tier": resolved_tier,
            "routing_reason": routing_reason,
            "wmape_ml": wmape_ml,
            "wmape_baseline": wmape_base,
            "fallback_triggered": fallback_triggered,
            "sku_count": len(store_products),
        })

        for prod in store_products:
            pid = str(prod["product_id"])
            pname = str(prod.get("product_name") or pid)
            cat_name = str(prod.get("category_name") or prod.get("category") or "Makanan")
            price_idr = float(prod.get("price_idr") or prod.get("price") or 15000.0)
            raw_cur_stock = prod.get("current_stock_qty") if prod.get("current_stock_qty") is not None else prod.get("current_stock")
            current_stock = max(0.0, float(raw_cur_stock or 0.0))

            sku_hist = store_hist[store_hist["product_id"] == pid].sort_values("sale_date") if not store_hist.empty else pd.DataFrame()
            stockout_28d = int(sku_hist.tail(28)["is_stockout"].sum()) if not sku_hist.empty else 0
            dow_factors = cat_dow_map.get(cat_name, {d: (1.18 if d >= 5 else 0.95) for d in range(7)})

            last_row = sku_hist.iloc[-1] if not sku_hist.empty else None
            velocity_trend = float(last_row["velocity_trend"]) if last_row is not None else 0.0
            roll_7 = float(last_row["rolling_mean_7d"]) if last_row is not None else 0.0
            roll_28 = float(last_row["rolling_mean_28d"]) if last_row is not None else 0.0
            roll_std = float(last_row["rolling_std_7d"]) if last_row is not None else max(1.0, 0.25 * max(roll_7, 3.0))

            # Build 30 future daily predictions (d=1..30)
            daily_rows_for_explain: List[Dict[str, Any]] = []
            daily_p10: List[float] = []
            daily_p50: List[float] = []
            daily_p90: List[float] = []

            # Precompute non-stockout recent vector for iterative lag updates across H+1..H+30
            valid_tail = (
                sku_hist[sku_hist["is_stockout"] == 0]["qty_sold"].values.astype(float).tolist()
                if not sku_hist.empty
                else []
            )
            if not valid_tail and not sku_hist.empty:
                valid_tail = sku_hist["qty_sold"].values.astype(float).tolist()

            lag_buffer = list(valid_tail[-30:])

            for dt in future_dates:
                d_str = dt.strftime("%Y-%m-%d")
                cal_rec = cal_lookup.get((city, d_str), {})
                dow = int(cal_rec.get("day_of_week", dt.dayofweek))
                is_wknd = int(cal_rec.get("is_weekend", 1 if dow >= 5 else 0))
                is_payday = int(cal_rec.get("is_payday_window", is_payday_day(dt.day)))
                is_hol = int(cal_rec.get("is_holiday", 0))
                days_to_hol = int(cal_rec.get("days_to_next_holiday", 12))
                is_ram = int(cal_rec.get("is_ramadan", 0))
                rain_mm = float(cal_rec.get("rain_mm", 0.0))
                temp_c = float(cal_rec.get("temp_c", 29.0))

                daily_rows_for_explain.append({
                    "is_weekend": is_wknd,
                    "is_payday_window": is_payday,
                    "is_holiday": is_hol,
                    "rain_mm": rain_mm,
                    "temp_c": temp_c,
                })

                if resolved_tier == "TIER_1_CATEGORY_BENCHMARK":
                    base_bench = cat_city_benchmark.get(
                        (cat_name, umk_tier),
                        cat_global_benchmark.get(cat_name, 6.0),
                    )
                    # Gentle adjustment if product has a few uncensored days (<14d)
                    if lag_buffer:
                        base_bench = 0.5 * base_bench + 0.5 * float(np.mean(lag_buffer))
                    factor = float(dow_factors.get(dow, 1.0)) * (1.12 if is_payday else 1.0)
                    p50_d = max(0.5, base_bench * factor)
                    p10_d, p50_d, p90_d = enforce_quantile_order(p50_d * 0.65, p50_d, p50_d * 1.45)

                elif resolved_tier in ("TIER_2_STATISTICAL_BASELINE", "TIER_3_FALLBACK_BASELINE"):
                    p10_d, p50_d, p90_d = compute_statistical_baseline_day(
                        sku_history=sku_hist,
                        target_dow=dow,
                        target_payday=is_payday,
                        cat_dow_factors=dow_factors,
                    )

                else:
                    # TIER_3_LGBM_QUANTILE iterative multi-step prediction
                    l1 = lag_buffer[-1] if len(lag_buffer) >= 1 else roll_7
                    l7 = lag_buffer[-7] if len(lag_buffer) >= 7 else roll_7
                    l14 = lag_buffer[-14] if len(lag_buffer) >= 14 else roll_28
                    l28 = lag_buffer[-28] if len(lag_buffer) >= 28 else roll_28
                    r7 = float(np.mean(lag_buffer[-7:])) if lag_buffer else roll_7
                    r28 = float(np.mean(lag_buffer[-28:])) if lag_buffer else roll_28
                    rstd = float(np.std(lag_buffer[-7:])) if len(lag_buffer) >= 2 else roll_std
                    vel = float(np.clip((r7 - r28) / max(r28, 0.5), -2.0, 2.0))

                    x_row = pd.DataFrame([{
                        "lag_1": l1,
                        "lag_7": l7,
                        "lag_14": l14,
                        "lag_28": l28,
                        "rolling_mean_7d": r7,
                        "rolling_mean_28d": r28,
                        "rolling_std_7d": rstd,
                        "velocity_trend": vel,
                        "effective_price_log": math.log1p(max(0.0, price_idr)),
                        "discount_flag": 0,
                        "day_of_week": dow,
                        "is_weekend": is_wknd,
                        "is_payday_window": is_payday,
                        "is_holiday": is_hol,
                        "days_to_next_holiday": days_to_hol,
                        "is_ramadan": is_ram,
                        "rain_mm": rain_mm,
                        "temp_c": temp_c,
                        "umk_tier_code": UMK_TIER_MAP.get(umk_tier, 2),
                        "umk_log_idr": math.log1p(max(1.0, umk_monthly)),
                        "food_inflation_yoy_pct": food_inf,
                        "policy_rate_pct": policy_rate,
                        "commodity_index": commodity_idx,
                        "category_code": cat_vocab.get(cat_name, 0),
                    }])[bundle.feature_columns].astype(float)

                    raw10 = float(bundle.models[0.1].predict(x_row)[0])
                    raw50 = float(bundle.models[0.5].predict(x_row)[0])
                    raw90 = float(bundle.models[0.9].predict(x_row)[0])
                    p10_d, p50_d, p90_d = enforce_quantile_order(raw10, raw50, raw90)
                    lag_buffer.append(p50_d)

                daily_p10.append(p10_d)
                daily_p50.append(p50_d)
                daily_p90.append(p90_d)

            future_df = pd.DataFrame(daily_rows_for_explain)

            for h_code, h_days, h_label in HORIZONS:
                sum_p10 = float(np.sum(daily_p10[:h_days]))
                sum_p50 = float(np.sum(daily_p50[:h_days]))
                sum_p90 = float(np.sum(daily_p90[:h_days]))

                # Macro + Retail Index Sentiment ONLY applied on 30-day horizon, strictly clamped [-10%, +10%]
                macro_adj_pct = clamp_macro_retail_adjustment_pct(
                    retail_index_30d_return_pct=retail_ret_30d,
                    food_inflation_yoy_pct=food_inf,
                    commodity_index=commodity_idx,
                    horizon_days=h_days,
                )
                macro_mult = 1.0 + (macro_adj_pct / 100.0)
                q10, q50, q90 = enforce_quantile_order(
                    sum_p10 * macro_mult,
                    sum_p50 * macro_mult,
                    sum_p90 * macro_mult,
                )

                shortfall_p50 = round(max(0.0, q50 - current_stock), 2)
                shortfall_p90 = round(max(0.0, q90 - current_stock), 2)
                if shortfall_p50 > 0:
                    restock_status = "RESTOCK_SEGERA"
                elif shortfall_p90 > 0:
                    restock_status = "WASPADA_P90"
                else:
                    restock_status = "AMAN"

                summary, drivers = build_explainability_summary(
                    product_name=pname,
                    horizon_code=h_code,
                    model_tier=resolved_tier,
                    p50_qty=q50,
                    current_stock=current_stock,
                    stockout_days_28d=stockout_28d,
                    velocity_trend=velocity_trend,
                    future_slice=future_df.iloc[:h_days],
                    macro_adj_pct=macro_adj_pct,
                    wmape_ml=wmape_ml,
                    wmape_base=wmape_base,
                    fallback_triggered=fallback_triggered,
                )

                forecasts.append({
                    "store_id": store_id,
                    "product_id": pid,
                    "product_name": pname,
                    "category": cat_name,
                    "category_name": cat_name,
                    "unit_price_idr": int(round(price_idr)),
                    "run_date": run_date_str,
                    "horizon_code": h_code,
                    "horizon_days": h_days,
                    "horizon_label": h_label,
                    "p10_qty": q10,
                    "p50_qty": q50,
                    "p90_qty": q90,
                    "projected_revenue_p50_idr": int(round(q50 * price_idr)),
                    "current_stock": round(current_stock, 2),
                    "current_stock_qty": round(current_stock, 2),
                    "restock_shortfall_p50": shortfall_p50,
                    "restock_shortfall_p90": shortfall_p90,
                    "restock_status": restock_status,
                    "history_days": history_days,
                    "store_history_days": history_days,
                    "selected_tier": resolved_tier,
                    "model_tier": resolved_tier,
                    "stockout_days_corrected": stockout_28d,
                    "wmape_ml": wmape_ml,
                    "wmape_baseline": wmape_base,
                    "fallback_triggered": fallback_triggered,
                    "macro_adjustment_pct": macro_adj_pct,
                    "explainability_summary": summary,
                    "top_drivers": drivers,
                })

    return {
        "success": True,
        "engine": "LightGBM Quantile + Tiered Routing (Python)" if HAS_LIGHTGBM else "Statistical Tiered Fallback",
        "run_date": run_date_str,
        "batch_schedule_wib": "01:00–03:00 WIB",
        "store_diagnostics": store_diagnostics,
        "forecasts": forecasts,
    }
