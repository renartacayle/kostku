-- ============================================================================
-- KostKu Web POS — Demand & Sales Forecasting Schema (PostgreSQL 14+)
-- Supports 3 Horizons (H+1, H+1..H+7, H+1..H+30), P10-P50-P90 Quantiles,
-- Stockout Censoring Masking, Tiered Routing (<14d / 14-45d / 45-180d),
-- Walk-Forward WMAPE Audit & Safety Fallback.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Agregasi Harian Penjualan Internal POS (1–6 Bulan Terakhir per Toko & SKU)
CREATE TABLE IF NOT EXISTS daily_sku_sales (
    id                  BIGSERIAL PRIMARY KEY,
    store_id            VARCHAR(64)    NOT NULL,
    product_id          VARCHAR(64)    NOT NULL,
    category_name       VARCHAR(80)    NOT NULL,
    city                VARCHAR(80)    NOT NULL,
    sale_date           DATE           NOT NULL,

    -- Metrik Penjualan Harian
    qty_sold            NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (qty_sold >= 0),
    gross_sales_idr     BIGINT         NOT NULL DEFAULT 0 CHECK (gross_sales_idr >= 0),
    effective_price_idr BIGINT         NOT NULL DEFAULT 0 CHECK (effective_price_idr >= 0),
    discount_flag       BOOLEAN        NOT NULL DEFAULT FALSE,

    -- Wajib: Censoring Flag. Jika TRUE, hari tsb TIDAK dianggap demand = 0
    -- saat training ML maupun saat menghitung rolling mean / lag.
    is_stockout         BOOLEAN        NOT NULL DEFAULT FALSE,
    closing_stock_qty   NUMERIC(12, 2) NULL,

    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_daily_sku_sales_key UNIQUE (store_id, product_id, sale_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_sku_sales_store_date
    ON daily_sku_sales (store_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_sku_sales_cat_city_date
    ON daily_sku_sales (category_name, city, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_sku_sales_uncensored
    ON daily_sku_sales (store_id, product_id, sale_date)
    WHERE is_stockout = FALSE;

-- 2. Konteks Kalender Lokal & Prakiraan Cuaca per Kab/Kota Toko
CREATE TABLE IF NOT EXISTS external_calendar_weather (
    id                   BIGSERIAL PRIMARY KEY,
    city                 VARCHAR(80)   NOT NULL,
    target_date          DATE          NOT NULL,

    -- Fitur Kalender Indonesia
    day_of_week          SMALLINT      NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Senin..6=Minggu
    is_weekend           BOOLEAN       NOT NULL DEFAULT FALSE,
    is_payday_window     BOOLEAN       NOT NULL DEFAULT FALSE, -- TRUE untuk tanggal 25 s.d. 5
    is_holiday           BOOLEAN       NOT NULL DEFAULT FALSE,
    holiday_name         VARCHAR(120),
    days_to_next_holiday SMALLINT      NOT NULL DEFAULT 30 CHECK (days_to_next_holiday >= 0),
    is_ramadan           BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Konteks Cuaca Lokal
    rain_mm              NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (rain_mm >= 0),
    temp_c               NUMERIC(5, 2) NOT NULL DEFAULT 29.0,
    weather_source       VARCHAR(40)   NOT NULL DEFAULT 'BMKG_OR_OPEN_METEO',

    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ext_cal_weather_city_date UNIQUE (city, target_date)
);

CREATE INDEX IF NOT EXISTS idx_ext_cal_weather_lookup
    ON external_calendar_weather (city, target_date);

-- 3. Segmentasi UMK/UMR Lokal & Ekonomi Makro/Mikro Bulanan (Anti-Overfitting)
-- Catatan:
-- - UMK/UMR hanya berubah tahunan sebagai fitur daya beli lintas kota/tier.
-- - Indikator pasar ritel hanya dipakai di horizon H+30 dan dibatasi (clamped) maks +/-10%.
CREATE TABLE IF NOT EXISTS regional_umk_macro (
    id                          BIGSERIAL PRIMARY KEY,
    city                        VARCHAR(80)   NOT NULL,
    umk_year                    SMALLINT      NOT NULL,
    period_month                DATE          NOT NULL, -- Tanggal 1 bulan berjalan (YYYY-MM-01)
    umk_monthly_idr             BIGINT        NOT NULL CHECK (umk_monthly_idr > 0),
    umk_tier                    VARCHAR(24)   NOT NULL CHECK (umk_tier IN ('TIER_A_METRO', 'TIER_B_MADYA', 'TIER_C_DAERAH')),

    -- Indikator Ekonomi Makro & Mikro Bulanan
    food_inflation_yoy_pct      NUMERIC(6, 3) NOT NULL DEFAULT 3.200,
    policy_rate_pct             NUMERIC(6, 3) NOT NULL DEFAULT 6.000,
    commodity_index             NUMERIC(8, 2) NOT NULL DEFAULT 100.00, -- Indeks harga bahan pokok terkait F&B/ritel
    retail_index_30d_return_pct NUMERIC(6, 3) NOT NULL DEFAULT 0.000,  -- Akan di-clamp +/-10% di inference engine

    updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_regional_umk_macro_city_month UNIQUE (city, period_month)
);

CREATE INDEX IF NOT EXISTS idx_regional_umk_macro_city
    ON regional_umk_macro (city, period_month DESC);

-- 4. Output Nightly Batch Job (01:00–03:00 WIB) untuk Pembacaan Instan Web POS
CREATE TABLE IF NOT EXISTS sales_forecasts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id                VARCHAR(64)    NOT NULL,
    product_id              VARCHAR(64)    NOT NULL,
    product_name            VARCHAR(150)   NOT NULL,
    category_name           VARCHAR(80)    NOT NULL,

    run_date                DATE           NOT NULL, -- Tanggal eksekusi batch (WIB)
    horizon_code            VARCHAR(20)    NOT NULL CHECK (horizon_code IN ('H1_TOMORROW', 'H7_NEXT_WEEK', 'H30_NEXT_MONTH')),
    horizon_days            SMALLINT       NOT NULL CHECK (horizon_days IN (1, 7, 30)),

    -- Rentang Quantile Probabilistik (diperoleh P10 <= P50 <= P90)
    p10_qty                 NUMERIC(12, 2) NOT NULL CHECK (p10_qty >= 0),
    p50_qty                 NUMERIC(12, 2) NOT NULL CHECK (p50_qty >= 0),
    p90_qty                 NUMERIC(12, 2) NOT NULL CHECK (p90_qty >= 0),

    -- Inventori & Rekomendasi Restock
    current_stock_qty       NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock_qty >= 0),
    restock_shortfall_p50   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (restock_shortfall_p50 >= 0),
    restock_shortfall_p90   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (restock_shortfall_p90 >= 0),
    restock_status          VARCHAR(24)    NOT NULL CHECK (restock_status IN ('AMAN', 'WASPADA_P90', 'RESTOCK_SEGERA')),

    -- Metadata Tiered Routing, Walk-Forward WMAPE & Safety Fallback
    store_history_days      INTEGER        NOT NULL DEFAULT 0,
    model_tier              VARCHAR(32)    NOT NULL CHECK (
        model_tier IN (
            'TIER_1_CATEGORY_BENCHMARK',
            'TIER_2_STATISTICAL_BASELINE',
            'TIER_3_LGBM_QUANTILE',
            'TIER_3_FALLBACK_BASELINE'
        )
    ),
    wmape_ml                NUMERIC(8, 4)  NULL,
    wmape_baseline          NUMERIC(8, 4)  NULL,
    fallback_triggered      BOOLEAN        NOT NULL DEFAULT FALSE,
    macro_adjustment_pct    NUMERIC(6, 3)  NOT NULL DEFAULT 0.000 CHECK (macro_adjustment_pct BETWEEN -10.000 AND 10.000),

    -- Explainability untuk Kasir & Owner
    explainability_summary  TEXT           NOT NULL,
    top_drivers_json        JSONB          NOT NULL DEFAULT '[]'::JSONB,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_quantile_order CHECK (p10_qty <= p50_qty AND p50_qty <= p90_qty),
    CONSTRAINT uq_sales_forecast_run_sku_horizon UNIQUE (store_id, product_id, run_date, horizon_code)
);

CREATE INDEX IF NOT EXISTS idx_sales_forecasts_pos_read
    ON sales_forecasts (store_id, run_date DESC, horizon_code, restock_shortfall_p50 DESC);
