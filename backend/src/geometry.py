import sqlite3
from typing import Any, NamedTuple, Self

from src.common_model import CONNECTIVITY_COLUMNS
from src.database import (
    LevelOfDetail,
    level_of_detail_table,
    GEOMETRY_FIELD_NAME,
    create_connection,
)
from src.hierarchy import HierarchyInput


def level_of_detail_from_zoom(zoom_level: float) -> LevelOfDetail:
    if zoom_level > 15:
        return LevelOfDetail.ALL
    if zoom_level > 10:
        return LevelOfDetail.HV
    return LevelOfDetail.GXP


class Bounds(NamedTuple):
    min_x: float
    min_y: float
    max_x: float
    max_y: float

    @classmethod
    def parse(cls, string: str) -> Self:
        min_x, min_y, max_x, max_y = map(float, string.split(","))
        return cls(min_x, min_y, max_x, max_y)

    def overfit(self, percent_overfit: float = 40) -> "Bounds":
        dx: float = abs(self.max_x - self.min_x)
        dy: float = abs(self.max_y - self.min_y)
        return Bounds(
            self.min_x - dx * percent_overfit / 100,
            self.min_y - dy * percent_overfit / 100,
            self.max_x + dx * percent_overfit / 100,
            self.max_y + dy * percent_overfit / 100,
        )


def create_geoemtry_dict(geometry_wkt: str) -> dict[str, Any]:
    if geometry_wkt[0] == "P":
        coord_string: str = geometry_wkt[len("POINT(") : len(geometry_wkt) - 1]  # noqa[E203]
        coords: list[float] = [float(c) for c in coord_string.split(" ")]
        return {"type": "Point", "coordinates": coords}
    if geometry_wkt[0] == "L":
        coord_string = geometry_wkt[len("LINESTRING(") : len(geometry_wkt) - 1]  # noqa[E203]
        coord_pairs: list[list[float]] = [
            [float(c) for c in p.split(" ")] for p in coord_string.split(", ")
        ]
        return {"type": "LineString", "coordinates": coord_pairs}
    assert False, f"Geometry `{geometry_wkt[:10]}` not implemented"


def create_feature_dict(geometry_wkt: str, properties: dict[str, Any]) -> dict[str, Any]:
    geometry_dict: dict[str, Any] = create_geoemtry_dict(geometry_wkt)
    return {"type": "Feature", "geometry": geometry_dict, "properties": properties}


def get_geojson_from_bounds(
    connection: sqlite3.Connection,
    bounds: Bounds,
    zoom_level: float,
    attribute_column: str | None,
    hierarchy_input: HierarchyInput,
) -> dict[str, Any] | None:
    level_of_detail: LevelOfDetail = level_of_detail_from_zoom(zoom_level)
    table_name: str = level_of_detail_table(level_of_detail)
    cursor = connection.cursor()

    bounds = bounds.overfit(percent_overfit=50)

    parameters: list[str | float] = [bounds.min_x, bounds.max_x, bounds.min_y, bounds.max_y]

    if not attribute_column:
        attribute_column = "is_in_sub"

    if attribute_column not in CONNECTIVITY_COLUMNS:
        return None

    where_clause, extra_parameters = hierarchy_input.create_sql_where_clause()
    parameters.extend(extra_parameters)

    sql: str = f"""
    SELECT
        name,
        {attribute_column},
        AsText({GEOMETRY_FIELD_NAME})
    FROM {table_name}
    JOIN idx_{table_name}_{GEOMETRY_FIELD_NAME} AS r
    ON id = r.pkid
    WHERE r.xmax >= ? AND r.xmin <= ? AND r.ymax >= ? AND r.ymin <= ?
    {where_clause};
    """
    cursor.execute(sql, parameters)

    rows = cursor.fetchall()

    cursor.close()

    json_output: dict[str, Any] = {}
    json_output["type"] = "FeatureCollection"
    features: list[dict[str, Any]] = []
    for row in rows:
        name: str = row[0]
        attribute: Any = row[1]
        geometry_wkt: str = row[2]

        properties: dict[str, Any] = {"name": name, attribute_column: attribute}
        features.append(create_feature_dict(geometry_wkt, properties))
    json_output["features"] = features

    return json_output


if __name__ == "__main__":
    db_path: str = "data/common_model.db"
    connection: sqlite3.Connection = create_connection(db_path)

    cursor = connection.cursor()

    sql: str = f"""
    EXPLAIN QUERY PLAN
    SELECT {GEOMETRY_FIELD_NAME}
    FROM {level_of_detail_table(LevelOfDetail.ALL)} AS c
    """

    cursor.execute(
        sql, (174.06215044962556, -39.061543742539584, 174.0646099640607, -39.06094546107873)
    )

    row = cursor.fetchall()

    print(row[:10])

    connection.close()
