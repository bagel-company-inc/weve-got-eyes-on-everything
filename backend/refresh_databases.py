#!/usr/bin/env python3
import os
from argparse import ArgumentParser

from database import create_connection
from app import DATA_PATH, DATABASE_PATH


def main():
    parser = ArgumentParser(
        description="Initialize the SQLite/SpatiaLite database from connectivity CSV."
    )

    parser.add_argument(
        "--db-path",
        type=str,
        default=DATABASE_PATH,
        help=f"Path to the SQLite database (default: {DATABASE_PATH})",
    )

    parser.add_argument(
        "--connectivity-path",
        type=str,
        default=os.path.join(DATA_PATH, "connectivity.csv"),
        help=f"Path to the connectivity CSV file (default: {os.path.join(DATA_PATH, 'connectivity.csv')})",
    )

    args = parser.parse_args()

    print(f"Database path: `{args.db_path}`")
    print(f"Connectivity CSV: `{args.connectivity_path}`")

    os.makedirs(os.path.dirname(args.db_path), exist_ok=True)

    # Call the function
    create_connection(
        db_path=args.db_path,
        connectivity_path=args.connectivity_path,
        refresh=True,
    )

    print("Database initialized successfully.")


if __name__ == "__main__":
    main()
