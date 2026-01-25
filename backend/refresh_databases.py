#!/usr/bin/env python3
from argparse import ArgumentParser
from pathlib import Path

from src.initialise_databases import create_or_replace_databases


DATA_PATH: Path = Path(__file__).parent / "data"

DEFAULT_DATABASE_PATH: Path = DATA_PATH / "common_model.db"
DEFAULT_GRAPH_PATH: Path = DATA_PATH / "graphs"


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

    db_path: Path = Path(args.db_path)
    graph_path: Path = DEFAULT_GRAPH_PATH
    connectivity_path: Path | None = (
        Path(args.connectivity_path) if args.connectivity_path is not None else None
    )

    print(f"Database path: `{db_path}`")
    print(f"Graph path `{graph_path}`")
    print(f"Connectivity CSV: `{connectivity_path}`")

    create_or_replace_databases(
        db_path=db_path, graph_path=graph_path, connectivity_path=connectivity_path
    )

    print("Database initialized successfully.")


if __name__ == "__main__":
    main()
