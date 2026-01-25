import sqlite3
from enum import Enum, auto
from pathlib import Path
from typing import Any

from geopandas import GeoDataFrame

from src.common_model import CONNECTIVITY_COLUMNS


EPSG: int = 4326


INDEX_COLUMN: str = "id"
GEOMETRY_FIELD_NAME: str = "geometry"


class LevelOfDetail(Enum):
    GXP = auto()
    HV = auto()
    ALL = auto()


def level_of_detail_table(level_of_detail: LevelOfDetail) -> str:
    match level_of_detail:
        case LevelOfDetail.GXP:
            return "connectivity_gxp"
        case LevelOfDetail.HV:
            return "connectivity_hv"
        case LevelOfDetail.ALL:
            return "connectivity_all"


def connectivity_create_level_of_detail(
    connectivity: GeoDataFrame, level_of_detail: LevelOfDetail
) -> GeoDataFrame:
    match level_of_detail:
        case LevelOfDetail.GXP:
            return connectivity[
                connectivity["substation_name"].isna()
                & (connectivity["out_of_order_indicator"] == "INS")
            ]
        case LevelOfDetail.HV:
            return connectivity[
                connectivity["dtx_code"].isna() & (connectivity["out_of_order_indicator"] == "INS")
            ]
        case LevelOfDetail.ALL:
            return connectivity


def load_spatialite(connection: sqlite3.Connection) -> None:
    if not hasattr(connection, "enable_load_extension"):
        print("""
        Python module `sqlite3` has not been compiled with `--enable-loadable-sqlite-extensions`

        https://stackoverflow.com/questions/58892028/sqlite3-connection-object-has-no-attribute-enable-load-extension/59963751

        If you are running MacOS and pyenv:

        `brew install sqlite`
        `LDFLAGS="-L$(brew --prefix sqlite)/lib" \
            CPPFLAGS="-I$(brew --prefix sqlite)/include" \
            PYTHON_CONFIGURE_OPTS="--enable-loadable-sqlite-extensions" \
            pyenv install -v 3.11.4`
        """)
        exit(1)
    connection.enable_load_extension(True)

    connection.load_extension("mod_spatialite")


def init_new_db_spatialite(connection: sqlite3.Connection) -> None:
    connection.execute("SELECT InitSpatialMetadata(1);")


def create_table(connection: sqlite3.Connection, table_name: str) -> None:
    print(f"Creating table `{table_name}`")
    sql: str = f"CREATE TABLE {table_name} (\n\t{INDEX_COLUMN} INTEGER PRIMARY KEY"
    for column_name, column_type in CONNECTIVITY_COLUMNS.items():
        sql += f",\n\t{column_name} {column_type}"
    sql += "\n);"

    cursor = connection.cursor()
    cursor.execute(sql)

    cursor.execute(f"""
    SELECT AddGeometryColumn(
        '{table_name}',
        '{GEOMETRY_FIELD_NAME}',
        {EPSG},
        'GEOMETRY',
        'XY'
    );
    """)

    cursor.close()


def insert_table(
    connection: sqlite3.Connection, connectivity: GeoDataFrame, table_name: str
) -> None:
    print(f"Inserting {len(connectivity)} rows into `{table_name}`")
    cursor = connection.cursor()

    connectivity_dict: list[dict[str, Any]]
    connectivity_dict = connectivity.to_dict("records")  # type: ignore[assignment]
    for i, row in enumerate(connectivity_dict):
        sql: str = f"INSERT INTO {table_name} ({INDEX_COLUMN}"
        for column_name in CONNECTIVITY_COLUMNS.keys():
            sql += f", {column_name}"
        sql += f", {GEOMETRY_FIELD_NAME}"
        sql += ")\n"
        sql += "VALUES (?"
        sql += ", ?" * len(CONNECTIVITY_COLUMNS.keys())
        sql += f", ST_GeomFromText(?, {EPSG})"
        sql += ");"

        parameters = [i] + [row[column_name] for column_name in CONNECTIVITY_COLUMNS.keys()]
        parameters.append(row["geometry"].wkt)

        cursor.execute(sql, parameters)

    connection.commit()
    cursor.close()


def create_spatial_index(connection: sqlite3.Connection, table_name: str) -> None:
    print(f"Creating spatial index for `{table_name}`")
    cursor = connection.cursor()
    cursor.execute(f"""
    SELECT CreateSpatialIndex(
        '{table_name}',
        '{GEOMETRY_FIELD_NAME}'
    );
    """)
    connection.commit()
    cursor.close()


def create_and_populate_table(
    connection: sqlite3.Connection, table_name: str, contents: GeoDataFrame
) -> None:
    create_table(connection, table_name)
    insert_table(connection, contents, table_name)
    create_spatial_index(connection, table_name)


def create_level_of_detail_table(
    connection: sqlite3.Connection, connectivity: GeoDataFrame, level_of_detail: LevelOfDetail
) -> None:
    print(f"Creating level of detail `{level_of_detail.name}`")
    table_name: str = level_of_detail_table(level_of_detail)
    level_of_detail_connectivity: GeoDataFrame = connectivity_create_level_of_detail(
        connectivity, level_of_detail
    )
    create_and_populate_table(connection, table_name, level_of_detail_connectivity)


def create_all_tables(connection: sqlite3.Connection, connectivity: GeoDataFrame) -> None:
    init_new_db_spatialite(connection)
    for level_of_detail in LevelOfDetail:
        create_level_of_detail_table(connection, connectivity, level_of_detail)


def create_connection(db_path: str | Path) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path)
    load_spatialite(connection)
    return connection
