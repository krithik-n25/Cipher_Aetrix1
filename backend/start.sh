#!/bin/bash
cd "$(dirname "$0")"
python -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip install -r requirements.txt -q
python database/seed.py
uvicorn main:app --reload --port 8000
