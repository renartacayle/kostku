#!/usr/bin/env python3
"""
Nightly Batch Job Runner (Scheduled 01:00–03:00 WIB) for KostKu Demand & Sales Forecasting.

Usage:
  python3 batch_runner.py --input payload.json --output forecasts.json
  cat payload.json | python3 batch_runner.py
"""

from __future__ import annotations

import argparse
import json
import os
import sys

# Ensure sibling imports work when invoked from any working directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from models import run_forecast_batch


def main() -> int:
    parser = argparse.ArgumentParser(description="Run KostKu Demand & Sales Forecast Nightly Batch")
    parser.add_argument("--input", "-i", help="Path ke input JSON (default: stdin)")
    parser.add_argument("--output", "-o", help="Path ke output JSON (default: stdout)")
    args = parser.parse_args()

    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            payload = json.load(f)
    else:
        raw = sys.stdin.read()
        if not raw.strip():
            print(json.dumps({"success": False, "error": "Empty batch payload"}))
            return 1
        payload = json.loads(raw)

    result = run_forecast_batch(payload)
    serialized = json.dumps(result, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(serialized)
    else:
        print(serialized)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
