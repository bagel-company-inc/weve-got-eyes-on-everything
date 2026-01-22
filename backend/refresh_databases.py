#!/usr/bin/env python3
import os
from argparse import ArgumentParser

from src.database import create_connection


DEFAULT_DATABASE_PATH = os.path.join("data", "common_model.db")


def main() -> None:
    parser = ArgumentParser(
        description="Initialize the SQLite/SpatiaLite database from connectivity CSV."
    )

    parser.add_argument(
        "--db-path",
        type=str,
        default=DEFAULT_DATABASE_PATH,
        help=f"Path to the SQLite database (default: {DEFAULT_DATABASE_PATH})",
    )

    parser.add_argument(
        "--connectivity-path",
        type=str,
        default=None,
        help="Path to the connectivity CSV file (default read from common model database)",
    )

    args = parser.parse_args()

    print(f"Database path: `{args.db_path}`")
    print(f"Connectivity CSV: `{args.connectivity_path}`")

    # Call the function
    create_connection(
        db_path=args.db_path,
        connectivity_path=args.connectivity_path,
        refresh=True,
    )

    print("Database initialized successfully.")


if __name__ == "__main__":
    main()
