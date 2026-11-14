"""
FastAPI Microservice for KostKu Demand & Sales Forecasting.
Separates heavy Python + LightGBM ML batch workloads from the Web POS main API.
"""

from __future__ import annotations

import os
import sys
from typing import Any, Dict, List, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from models import HAS_LIGHTGBM, run_forecast_batch

try:
    from fastapi import FastAPI, HTTPException, Query
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    FastAPI = None
    BaseModel = object


if HAS_FASTAPI:
    class BatchRequest(BaseModel):
        run_date: Optional[str] = None
        stores: List[Dict[str, Any]] = Field(default_factory=list)
        products: List[Dict[str, Any]] = Field(default_factory=list)
        daily_sku_sales: List[Dict[str, Any]] = Field(default_factory=list)
        external_calendar_weather: List[Dict[str, Any]] = Field(default_factory=list)
        regional_umk_macro: List[Dict[str, Any]] = Field(default_factory=list)

    app = FastAPI(
        title="KostKu Demand & Sales Forecasting Microservice",
        version="1.0.0",
        description="Tiered Routing (<14d Benchmark / 14-45d Baseline / 45-180d Global LightGBM Quantile) + WMAPE Safety Fallback",
    )

    _LATEST_BATCH_CACHE: Dict[str, Any] = {}

    @app.get("/health")
    def health_check() -> Dict[str, Any]:
        return {
            "status": "ok",
            "lightgbm_available": HAS_LIGHTGBM,
            "schedule_wib": "01:00-03:00 WIB",
        }

    @app.post("/v1/batch/run")
    def trigger_nightly_batch(req: BatchRequest) -> Dict[str, Any]:
        global _LATEST_BATCH_CACHE
        result = run_forecast_batch(req.model_dump())
        _LATEST_BATCH_CACHE = result
        return {
            "success": result["success"],
            "engine": result["engine"],
            "run_date": result["run_date"],
            "stores_processed": len(result["store_diagnostics"]),
            "forecast_rows_generated": len(result["forecasts"]),
            "store_diagnostics": result["store_diagnostics"],
        }

    @app.get("/v1/forecasts/{store_id}")
    def get_store_forecasts(
        store_id: str,
        horizon_code: str = Query(default="H1_TOMORROW"),
    ) -> Dict[str, Any]:
        if not _LATEST_BATCH_CACHE:
            raise HTTPException(status_code=404, detail="Batch forecast belum dijalankan.")

        rows = [
            r
            for r in _LATEST_BATCH_CACHE.get("forecasts", [])
            if str(r["store_id"]) == str(store_id) and r["horizon_code"] == horizon_code
        ]
        diag = next(
            (d for d in _LATEST_BATCH_CACHE.get("store_diagnostics", []) if str(d["store_id"]) == str(store_id)),
            None,
        )
        return {
            "success": True,
            "store_id": store_id,
            "horizon_code": horizon_code,
            "run_date": _LATEST_BATCH_CACHE.get("run_date"),
            "diagnostic": diag,
            "items": rows,
        }
else:
    app = None
