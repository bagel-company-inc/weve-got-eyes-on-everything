import os
from typing import Any

import msgspec
from flask import Flask, request, Response
from flask_cors import CORS, cross_origin

from pandas import DataFrame, read_csv
from geopandas import GeoDataFrame, GeoSeries
from shapely import Point

from get_geometry import Bounds, get_geometry

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(app.root_path, "data")


def load_csv_to_gdf(path: str) -> GeoDataFrame:
    df = read_csv(path, index_col=0)
    df["geometry"] = GeoSeries.from_wkt(df.geometry_4326, crs="EPSG:4326")
    gdf = GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")
    gdf = gdf.replace({float("nan"): None})
    return gdf


GXP = load_csv_to_gdf(os.path.join(DATA_PATH, "CSTPOS.csv"))


@cross_origin(origins=["*"])
@app.route("/api/column_names", methods=["GET", "OPTIONS"])
def get_column_names() -> Response:
    column_names: list[str] = GXP.columns.tolist()
    json_bytes: bytes = msgspec.json.encode(column_names)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/column_unique_values", methods=["GET", "OPTIONS"])
def get_column_unique_values() -> Response:
    column: str | None = request.args.get("column")
    if not column:
        return Response("[]", status=200, mimetype="application/json")
    if column not in GXP.columns:
        return Response("[]", status=200, mimetype="application/json")

    def custom_sort_key(x: Any) -> Any:
        if x is None:
            return ""
        return x

    unique_values: list[Any] = sorted(GXP[column].unique().tolist(), key=custom_sort_key)
    json_bytes: bytes = msgspec.json.encode(unique_values)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/search_complete", methods=["GET", "OPTIONS"])
def get_search_results() -> Response:
    typed_input: str | None = request.args.get("input")
    if not typed_input:
        return Response("[]", status=200, mimetype="application/json")
    if len(typed_input) < 2:
        return Response("[]", status=200, mimetype="application/json")
    results: list[str] = GXP[GXP.name.str.contains(typed_input)].name.unique().tolist()[:200]
    results.sort(key=len)
    json_bytes: bytes = msgspec.json.encode(results)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/centroid", methods=["GET", "OPTIONS"])
def get_centroid_at_name() -> Response:
    object_name: str | None = request.args.get("name")
    if not object_name:
        return Response("[]", status=200, mimetype="application/json")
    attributes: GeoDataFrame = GXP[GXP.name == object_name]
    if len(attributes) == 0:
        return Response("[]", status=200, mimetype="application/json")
    point: Point = attributes.geometry.values[0].centroid
    coordinates = tuple(point.coords[0])
    json_bytes: bytes = msgspec.json.encode(coordinates)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/attributes", methods=["GET", "OPTIONS"])
def get_attributes() -> Response:
    object_name: str | None = request.args.get("name")
    if not object_name:
        return Response("[]", status=200, mimetype="application/json")
    attributes: GeoDataFrame = GXP[GXP.name == object_name]
    if len(attributes) == 0:
        return Response("[]", status=200, mimetype="application/json")
    attribute_dict: dict[str, Any] = dict(zip(attributes.columns, attributes.values[0]))
    json_bytes: bytes = msgspec.json.encode(
        {
            column: value
            for column, value in attribute_dict.items()
            if not column.startswith("geometry")
        }
    )
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/geojson", methods=["GET", "OPTIONS"])
def get_geojson() -> Response:
    bbox_param: str | None = request.args.get("bbox")
    if not bbox_param:
        return app.response_class("[]")
    bounds: Bounds = Bounds.parse(bbox_param)
    zoom_level: float = float(request.args.get("zoom", "14"))
    column: str | None = request.args.get("column")

    geojson_dict: dict[str, Any] = get_geometry(GXP, bounds, zoom_level, column)

    json_bytes: bytes = msgspec.json.encode(geojson_dict)
    response = Response(json_bytes, status=200, mimetype="application/json")

    return response


if __name__ == "__main__":
    app.run(debug=True)
