## Usage


Install [spatialite](https://docs.djangoproject.com/en/6.0/ref/contrib/gis/install/spatialite/).

```
cd backend
pip install -r requirements.txt
python3 refresh_databases.py
gunicorn app:app --workers 4 --worker-class sync
```

```
cd frontend
npm install
npm start
```