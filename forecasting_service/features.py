"""
Feature Engineering Pipeline for KostKu Web POS Demand & Sales Forecasting.

Implements:
1. Censored-demand correction (`is_stockout == 1` masked out of lags/rolling means
   and excluded from ML training so stockouts are never mistaken for zero demand).
2. Internal lag/rolling/velocity features:
   lag_1, lag_7, lag_14, lag_28, rolling_mean_7d, rolling_mean_28d,
   rolling_std_7d, velocity_trend, effective_price, discount_flag.
3. Calendar & local weather context:
   day_of_week, is_weekend, is_payday_window (dates 25..5), is_holiday,
   days_to_next_holiday, is_ramadan, rain_mm, temp_c.
4. Regional UMK & Macro/Market features with anti-overfitting clamp:
   - UMK tier / monthly purchasing power across regions (not daily signals).
   - Retail 30-day sentiment & macro inflation clamped to max +/-10% for H+30 only.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd


UMK_TIER_MAP: Dict[str, int] = {
    "TIER_A_METRO": 3,
    "TIER_B_MADYA": 2,
    "TIER_C_DAERAH": 1,
}

BASE_FEATURE_COLUMNS: List[str] = [
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_28",
    "rolling_mean_7d",
    "rolling_mean_28d",
    "rolling_std_7d",
    "velocity_trend",
    "effective_price_log",
    "discount_flag",
    "day_of_week",
    "is_weekend",
    "is_payday_window",
    "is_holiday",
    "days_to_next_holiday",
    "is_ramadan",
    "rain_mm",
    "temp_c",
    "umk_tier_code",
    "umk_log_idr",
    "food_inflation_yoy_pct",
    "policy_rate_pct",
    "commodity_index",
    "category_code",
]


def is_payday_day(day_of_month: int) -> int:
    """Payday window covers dates 25 through 31 and 1 through 5."""
    return 1 if (day_of_month >= 25 or day_of_month <= 5) else 0


def clamp_macro_retail_adjustment_pct(
    retail_index_30d_return_pct: float,
    food_inflation_yoy_pct: float,
    commodity_index: float,
    horizon_days: int,
) -> float:
    """
    Computes macro/market multiplier adjustment (%) strictly for the 30-day horizon.
    - For H+1 and H+7, market index return is NOT applied (0.0%) to avoid noise on 1-6m POS data.
    - For H+30, net sentiment/inflation effect is clamped strictly to [-10.0%, +10.0%].
    """
    if horizon_days < 30:
        return 0.0

    retail_ret = float(retail_index_30d_return_pct or 0.0)
    inflation = float(food_inflation_yoy_pct or 3.2)
    commodity = float(commodity_index or 100.0)

    # Dampened blend: 45% weight on 30d retail sector trend, gentle inflation pressure offset,
    # slight commodity cost pass-through sensitivity; total strictly bounded to [-10%, +10%].
    retail_component = 0.45 * retail_ret
    inflation_drag = -0.25 * max(-4.0, min(6.0, inflation - 3.0))
    commodity_drag = -0.10 * max(-10.0, min(10.0, (commodity - 100.0)))

    raw_pct = retail_component + inflation_drag + commodity_drag
    return round(float(np.clip(raw_pct, -10.0, 10.0)), 2)


def prepare_training_and_feature_frame(
    sales_df: pd.DataFrame,
    calendar_df: pd.DataFrame,
    macro_df: pd.DataFrame,
) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """
    Builds uncensored time-series features per (store_id, product_id, sale_date).

    CRITICAL STOCKOUT HANDLING:
    - Any day with `is_stockout == 1` has `qty_uncensored = NaN`.
    - Backward-looking lags and rolling windows use shifted `qty_uncensored` forward-filled
      only for lag estimation OR skip NaNs in rolling mean, so a stockout day never pulls
      the rolling mean toward zero.
    """
    if sales_df.empty:
        return pd.DataFrame(), {}

    df = sales_df.copy()
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df = df.sort_values(["store_id", "product_id", "sale_date"]).reset_index(drop=True)

    def _col(frame: pd.DataFrame, col_name: str, default_val: Any) -> pd.Series:
        if col_name in frame.columns:
            return frame[col_name]
        return pd.Series([default_val] * len(frame), index=frame.index)

    # Normalize required columns & numeric flags safely
    def _first_present(*names: str, default_val: Any = None) -> pd.Series:
        for nm in names:
            if nm in df.columns:
                return df[nm]
        return pd.Series([default_val] * len(df), index=df.index)

    df["city"] = _first_present("city", default_val="Semarang").fillna("Semarang").astype(str)
    df["category_name"] = _first_present("category_name", "category", default_val="Makanan").fillna("Makanan").astype(str)
    df["qty_sold"] = pd.to_numeric(_col(df, "qty_sold", 0.0), errors="coerce").fillna(0.0).clip(lower=0.0)
    df["gross_sales_idr"] = pd.to_numeric(_first_present("gross_sales_idr", "gross_sales", default_val=0.0), errors="coerce").fillna(0.0)
    df["effective_price_idr"] = pd.to_numeric(_first_present("effective_price_idr", "effective_price", default_val=0.0), errors="coerce").fillna(0.0)
    df["discount_flag"] = pd.to_numeric(_col(df, "discount_flag", 0), errors="coerce").fillna(0).astype(int)
    df["is_stockout"] = pd.to_numeric(_col(df, "is_stockout", 0), errors="coerce").fillna(0).astype(int)

    # Mask censored stockout observations BEFORE lag & rolling calculation
    df["qty_uncensored"] = np.where(df["is_stockout"] == 1, np.nan, df["qty_sold"])

    # Peer group fallback mean (non-stockout mean per SKU) for imputing missing lags safely
    sku_peer_mean = (
        df.groupby(["store_id", "product_id"])["qty_uncensored"]
        .transform(lambda s: s.expanding().mean())
    )
    df["qty_for_lags"] = df["qty_uncensored"].fillna(sku_peer_mean).fillna(0.0)

    grp = df.groupby(["store_id", "product_id"], sort=False)

    # Past-only lags (shift >= 1 avoids target leakage)
    df["lag_1"] = grp["qty_for_lags"].shift(1)
    df["lag_7"] = grp["qty_for_lags"].shift(7)
    df["lag_14"] = grp["qty_for_lags"].shift(14)
    df["lag_28"] = grp["qty_for_lags"].shift(28)

    # Rolling statistics over uncensored history (ignoring NaN stockout days)
    shifted_uncensored = grp["qty_uncensored"].shift(1)
    df["rolling_mean_7d"] = (
        shifted_uncensored.groupby([df["store_id"], df["product_id"]])
        .transform(lambda s: s.rolling(window=7, min_periods=1).mean())
    )
    df["rolling_mean_28d"] = (
        shifted_uncensored.groupby([df["store_id"], df["product_id"]])
        .transform(lambda s: s.rolling(window=28, min_periods=1).mean())
    )
    df["rolling_std_7d"] = (
        shifted_uncensored.groupby([df["store_id"], df["product_id"]])
        .transform(lambda s: s.rolling(window=7, min_periods=2).std())
        .fillna(0.0)
    )

    # Safe fallback fill if earliest history rows were all stockouts
    for col in ["rolling_mean_7d", "rolling_mean_28d", "lag_1", "lag_7", "lag_14", "lag_28"]:
        df[col] = df[col].fillna(df["rolling_mean_28d"]).fillna(df["qty_for_lags"]).fillna(0.0)

    denom = np.maximum(df["rolling_mean_28d"].values, 0.5)
    df["velocity_trend"] = (df["rolling_mean_7d"].values - df["rolling_mean_28d"].values) / denom
    df["velocity_trend"] = np.clip(df["velocity_trend"], -2.0, 2.0)

    df["effective_price_log"] = np.log1p(np.maximum(df["effective_price_idr"].values, 0.0))

    # Merge external calendar & weather by (city, target_date)
    cal = calendar_df.copy()
    if not cal.empty:
        cal["target_date"] = pd.to_datetime(cal["target_date"])
        df = df.merge(
            cal[
                [
                    "city",
                    "target_date",
                    "day_of_week",
                    "is_weekend",
                    "is_payday_window",
                    "is_holiday",
                    "days_to_next_holiday",
                    "is_ramadan",
                    "rain_mm",
                    "temp_c",
                ]
            ],
            left_on=["city", "sale_date"],
            right_on=["city", "target_date"],
            how="left",
        )
        df.drop(columns=["target_date"], inplace=True, errors="ignore")

    # Derive calendar defaults for any dates missing in external calendar table
    df["day_of_week"] = pd.to_numeric(_col(df, "day_of_week", np.nan), errors="coerce").fillna(df["sale_date"].dt.dayofweek).astype(int)
    df["is_weekend"] = pd.to_numeric(_col(df, "is_weekend", np.nan), errors="coerce").fillna((df["day_of_week"] >= 5).astype(int)).astype(int)
    dom = df["sale_date"].dt.day
    derived_payday = ((dom >= 25) | (dom <= 5)).astype(int)
    df["is_payday_window"] = pd.to_numeric(_col(df, "is_payday_window", np.nan), errors="coerce").fillna(derived_payday).astype(int)
    df["is_holiday"] = pd.to_numeric(_col(df, "is_holiday", 0), errors="coerce").fillna(0).astype(int)
    df["days_to_next_holiday"] = pd.to_numeric(_col(df, "days_to_next_holiday", 14), errors="coerce").fillna(14).astype(int)
    df["is_ramadan"] = pd.to_numeric(_col(df, "is_ramadan", 0), errors="coerce").fillna(0).astype(int)
    df["rain_mm"] = pd.to_numeric(_col(df, "rain_mm", 0.0), errors="coerce").fillna(0.0)
    df["temp_c"] = pd.to_numeric(_col(df, "temp_c", 29.0), errors="coerce").fillna(29.0)

    # Merge Regional UMK & Monthly Macro by city + YYYY-MM
    df["period_month"] = pd.to_datetime(df["sale_date"].dt.strftime("%Y-%m-01"))
    mac = macro_df.copy()
    if not mac.empty:
        mac["city"] = mac["city"].fillna("Semarang").astype(str) if "city" in mac.columns else "Semarang"
        mac["period_month"] = pd.to_datetime(pd.to_datetime(mac["period_month"]).dt.strftime("%Y-%m-01"))
        alias_pairs = [
            ("umk_monthly_idr", "umk_idr", 3240000.0),
            ("food_inflation_yoy_pct", "food_inflation_yoy", 3.1),
            ("policy_rate_pct", "bi_rate_pct", 6.0),
            ("commodity_index", "staple_commodity_index", 101.5),
            ("retail_index_30d_return_pct", "retail_index_30d_trend", 0.0),
        ]
        for canon, alt, dflt in alias_pairs:
            if canon not in mac.columns:
                mac[canon] = mac[alt] if alt in mac.columns else dflt
        if "umk_tier" not in mac.columns:
            mac["umk_tier"] = "TIER_B_MADYA"
        df = df.merge(
            mac[
                [
                    "city",
                    "period_month",
                    "umk_monthly_idr",
                    "umk_tier",
                    "food_inflation_yoy_pct",
                    "policy_rate_pct",
                    "commodity_index",
                    "retail_index_30d_return_pct",
                ]
            ],
            on=["city", "period_month"],
            how="left",
        )

    df["umk_tier"] = _col(df, "umk_tier", "TIER_B_MADYA").fillna("TIER_B_MADYA").astype(str)
    df["umk_tier_code"] = df["umk_tier"].map(UMK_TIER_MAP).fillna(2).astype(int)
    df["umk_monthly_idr"] = pd.to_numeric(_col(df, "umk_monthly_idr", 3240000), errors="coerce").fillna(3240000.0)
    df["umk_log_idr"] = np.log1p(df["umk_monthly_idr"])
    df["food_inflation_yoy_pct"] = pd.to_numeric(_col(df, "food_inflation_yoy_pct", 3.1), errors="coerce").fillna(3.1)
    df["policy_rate_pct"] = pd.to_numeric(_col(df, "policy_rate_pct", 6.0), errors="coerce").fillna(6.0)
    df["commodity_index"] = pd.to_numeric(_col(df, "commodity_index", 101.5), errors="coerce").fillna(101.5)
    df["retail_index_30d_return_pct"] = pd.to_numeric(_col(df, "retail_index_30d_return_pct", 0.0), errors="coerce").fillna(0.0)

    categories = sorted(df["category_name"].fillna("Lainnya").astype(str).unique().tolist())
    cat_vocab = {c: idx for idx, c in enumerate(categories)}
    df["category_code"] = df["category_name"].fillna("Lainnya").astype(str).map(cat_vocab).fillna(0).astype(int)

    return df, cat_vocab
