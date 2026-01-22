import sqlite3
from typing import Any

from src.common_model import CONNECTIVITY_COLUMNS
from src.database import (
    LevelOfDetail,
    level_of_detail_table,
    INDEX_COLUMN,
    GEOMETRY_FIELD_NAME,
)
from src.hierarchy import HierarchyInput
from src.geometry import Bounds


def get_column_names(connection: sqlite3.Connection, fast: bool = True) -> list[str]:
    if fast:
        return list(CONNECTIVITY_COLUMNS.keys())
    sql: str = f"PRAGMA table_info({level_of_detail_table(LevelOfDetail.GXP)});"
    cursor = connection.cursor()
    cursor.execute(sql)
    rows = cursor.fetchall()

    column_names: list[str] = []

    for row in rows:
        name: str = row[1]
        if name in [INDEX_COLUMN, GEOMETRY_FIELD_NAME]:
            continue
        column_names.append(name)

    cursor.close()
    return column_names


def get_column_unique_values(
    connection: sqlite3.Connection, column: str, hierarchy_input: HierarchyInput
) -> list[Any]:
    where_statement, parameters = hierarchy_input.create_sql_where_clause()
    sql: str = f"""
    SELECT
        DISTINCT {column}
    FROM {level_of_detail_table(LevelOfDetail.ALL)}
    WHERE {where_statement.removeprefix("AND ")}
    ORDER BY {column};
    """

    cursor = connection.cursor()
    cursor.execute(sql, parameters)
    rows = cursor.fetchall()

    values: list[str] = []

    for row in rows:
        value: str = row[0]
        values.append(value)

    cursor.close()
    return values


def get_search_results(
    connection: sqlite3.Connection, typed_input: str, hierarchy_input: HierarchyInput
) -> list[str]:
    if not typed_input.strip():
        return []
    if len(typed_input) < 2:
        return []

    where_statement, parameters = hierarchy_input.create_sql_where_clause()
    sql: str = f"""
    SELECT
        DISTINCT name
    FROM {level_of_detail_table(LevelOfDetail.ALL)}
    WHERE name LIKE ? COLLATE NOCASE{where_statement}
    ORDER BY INSTR(LOWER(name), LOWER(?))
    LIMIT 200;
    """

    parameters.insert(0, f"%{typed_input}%")
    parameters.append(typed_input)

    cursor = connection.cursor()
    cursor.execute(sql, parameters)
    rows = cursor.fetchall()

    values: list[str] = []

    for row in rows:
        value: str = row[0]
        values.append(value)

    cursor.close()
    return values


def get_centroid_at_name(connection: sqlite3.Connection, name: str) -> tuple[float, float] | None:
    sql: str = f"""
    SELECT
        X(ST_Centroid(geom)) AS centroid_x,
        Y(ST_Centroid(geom)) AS centroid_y
    FROM {level_of_detail_table(LevelOfDetail.ALL)}
    WHERE name = ?;
    """

    cursor = connection.cursor()
    cursor.execute(sql, [name])
    row: tuple[float, float] | None = cursor.fetchone()
    return row


def get_attributes(
    connection: sqlite3.Connection, name: str, bounds: Bounds
) -> dict[str, Any] | None:
    bounds = bounds.overfit(percent_overfit=100)
    table_name: str = level_of_detail_table(LevelOfDetail.ALL)
    sql: str = f"""
    SELECT
        {", ".join(CONNECTIVITY_COLUMNS.keys())}
    FROM {table_name}
    JOIN idx_{table_name}_{GEOMETRY_FIELD_NAME} AS r
    ON id = r.pkid
    WHERE r.xmax >= ? AND r.xmin <= ? AND r.ymax >= ? AND r.ymin <= ?
    AND name = ?;
    """

    cursor = connection.cursor()
    cursor.execute(sql, [bounds.min_x, bounds.max_x, bounds.min_y, bounds.max_y, name])
    row = cursor.fetchone()

    if row is None:
        return None

    return dict(zip(CONNECTIVITY_COLUMNS.keys(), row))
