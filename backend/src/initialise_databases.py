import os
import sqlite3
from pathlib import Path

from geopandas import GeoDataFrame

from src.common_model import get_common_model
from src.database import load_spatialite, create_all_tables, level_of_detail_table, LevelOfDetail
from src.graph import ConnectivityGraph, connectivity_to_graph, write_connectivity_graph
from src.hierarchy import HierarchyInput


def create_graph_files(connection: sqlite3.Connection, path: Path) -> None:
    sql: str = f"""
    SELECT DISTINCT gxp_code
    FROM {level_of_detail_table(LevelOfDetail.GXP)}
    """
    cursor: sqlite3.Cursor = connection.cursor()
    cursor.execute(sql)
    rows = cursor.fetchall()
    cursor.close()

    for row in rows:
        gxp_code: str = row[0]
        print(f"Creating networkx graph for GXP `{gxp_code}`")
        connectivity_graph: ConnectivityGraph = connectivity_to_graph(
            connection, HierarchyInput.new(gxp_code=gxp_code)
        )
        graph_path: Path = path / gxp_code
        os.makedirs(graph_path, exist_ok=True)
        write_connectivity_graph(connectivity_graph, graph_path)


def create_or_replace_databases(
    db_path: Path, graph_path: Path, connectivity_path: Path | None = None
) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    if os.path.exists(db_path):
        os.remove(db_path)

    common_model: GeoDataFrame = get_common_model(csv_path=connectivity_path)

    connection = sqlite3.connect(db_path)
    load_spatialite(connection)

    create_all_tables(connection, common_model)

    create_graph_files(connection, graph_path)

    return connection
