import os

from database import create_connection
from app import DATA_PATH, DATABASE_PATH

CONNECTIVITY_PATH = os.path.join(DATA_PATH, "connectivity.csv")

if __name__ == "__main__":
    create_connection(db_path=DATABASE_PATH, connectivity_path=CONNECTIVITY_PATH, refresh=True)
