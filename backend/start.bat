python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt -q
python database\seed.py
uvicorn main:app --reload --port 8000
