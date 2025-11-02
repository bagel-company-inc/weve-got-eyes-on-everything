import os
from typing import Any

import msgspec
from flask import Flask, request, Response
from flask_cors import CORS, cross_origin

from pandas import DataFrame, read_csv
from geopandas import GeoDataFrame, GeoSeries

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
    unique_values: list[Any] = GXP[column].unique().tolist()
    json_bytes: bytes = msgspec.json.encode(unique_values)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/attributes", methods=["GET", "OPTIONS"])
def get_attributes() -> Response:
    object_name: str | None = request.args.get("name")
    if not object_name:
        return Response("[]", status=200, mimetype="application/json")
    attributes: DataFrame = GXP[GXP.name == object_name]
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

    geojson_dict: dict[str, Any] = get_geometry(GXP, bounds, zoom_level)

    json_bytes: bytes = msgspec.json.encode(geojson_dict)
    response = Response(json_bytes, status=200, mimetype="application/json")

    return response


if __name__ == "__main__":
    app.run(debug=True)
