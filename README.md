## Usage


Install [spatialite](https://docs.djangoproject.com/en/6.0/ref/contrib/gis/install/spatialite/).
 - [Windows](https://github.com/FAIMS/FAIMS2-Documentation/blob/master/docs/Installing+Spatialite+Tool+on+Windows.md)

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