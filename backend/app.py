import os
import sqlite3
from typing import Any

import msgspec
from flask import Flask, request, Response
from flask_cors import CORS, cross_origin

from attributes import (
    get_column_names,
    get_column_unique_values,
    get_attributes,
    get_search_results,
    get_centroid_at_name,
)
from database import create_connection
from hierarchy import HierarchyInput, get_hierarchy_json

# from graph import graph_shortest_path, graph_flood_fill
from geometry import Bounds, get_geojson_from_bounds

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(app.root_path, "data")

DATABASE_PATH = os.path.join(DATA_PATH, "common_model.db")

DB = create_connection(DATABASE_PATH)


@cross_origin(origins=["*"])
@app.route("/api/column_names", methods=["GET", "OPTIONS"])
def column_names() -> Response:
    connection: sqlite3.Connection = DB
    column_names: list[str] = get_column_names(connection)
    json_bytes: bytes = msgspec.json.encode(column_names)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/column_unique_values", methods=["GET", "OPTIONS"])
def column_unique_values() -> Response:
    column: str | None = request.args.get("column")
    hierarchy_input: HierarchyInput = HierarchyInput.new()

    if not column:
        return Response("[]", status=200, mimetype="application/json")

    connection: sqlite3.Connection = DB
    column_names: list[str] = get_column_names(connection)

    if column not in column_names:
        return Response("[]", status=200, mimetype="application/json")

    values: list[str] = get_column_unique_values(
        connection, column, hierarchy_input=hierarchy_input
    )
    json_bytes: bytes = msgspec.json.encode(values)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/search_complete", methods=["GET", "OPTIONS"])
def search_complete() -> Response:
    typed_input: str | None = request.args.get("input")
    hierarchy_input: HierarchyInput = HierarchyInput.new()

    if not typed_input:
        return Response("[]", status=200, mimetype="application/json")
    if len(typed_input) < 2:
        return Response("[]", status=200, mimetype="application/json")

    connection: sqlite3.Connection = DB
    results: list[str] = get_search_results(connection, typed_input, hierarchy_input)
    json_bytes: bytes = msgspec.json.encode(results)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/centroid", methods=["GET", "OPTIONS"])
def centroid_at_name() -> Response:
    object_name: str | None = request.args.get("name")
    if not object_name:
        return Response("[]", status=200, mimetype="application/json")

    connection: sqlite3.Connection = DB
    centroid: tuple[float, float] | None = get_centroid_at_name(connection, object_name)

    if centroid is None:
        return Response("[]", status=200, mimetype="application/json")

    json_bytes: bytes = msgspec.json.encode(centroid)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/attributes", methods=["GET", "OPTIONS"])
def attributes() -> Response:
    bbox_param: str | None = request.args.get("bbox")
    if not bbox_param:
        return Response("[]", status=200, mimetype="application/json")

    object_name: str | None = request.args.get("name")
    if not object_name:
        return Response("[]", status=200, mimetype="application/json")

    bounds: Bounds = Bounds.parse(bbox_param)
    connection: sqlite3.Connection = DB
    attributes: dict[str, Any] | None = get_attributes(connection, object_name, bounds)

    if attributes is None:
        return Response("[]", status=200, mimetype="application/json")

    json_bytes: bytes = msgspec.json.encode(attributes)
    return Response(json_bytes, status=200, mimetype="application/json")


@cross_origin(origins=["*"])
@app.route("/api/geojson", methods=["GET", "OPTIONS"])
def get_geojson() -> Response:
    bbox_param: str | None = request.args.get("bbox")
    if not bbox_param:
        return Response("[]", status=200, mimetype="application/json")

    hierarchy_input: HierarchyInput = HierarchyInput.parse_request_args(request.args)
    bounds: Bounds = Bounds.parse(bbox_param)
    zoom_level: float = float(request.args.get("zoom", "14"))
    column: str | None = request.args.get("column")

    connection: sqlite3.Connection = DB
    geojson_dict: dict[str, Any] | None = get_geojson_from_bounds(
        connection=connection,
        bounds=bounds,
        zoom_level=zoom_level,
        attribute_column=column,
        hierarchy_input=hierarchy_input,
    )

    if geojson_dict is None:
        return Response("[]", status=200, mimetype="application/json")

    json_bytes: bytes = msgspec.json.encode(geojson_dict)
    response = Response(json_bytes, status=200, mimetype="application/json")

    return response


@cross_origin(origins=["*"])
@app.route("/api/hierarchy", methods=["GET", "OPTIONS"])
def hierarchy_level() -> Response:
    hierarchy_input: HierarchyInput = HierarchyInput.parse_request_args(request.args)

    connection: sqlite3.Connection = DB
    json_values: dict[str, Any] = get_hierarchy_json(connection, hierarchy_input)
    json_bytes: bytes = msgspec.json.encode(json_values)
    response = Response(json_bytes, status=200, mimetype="application/json")
    return response


@cross_origin(origins=["*"])
@app.route("/api/shortest_path", methods=["GET", "OPTIONS"])
def shortest_path() -> Response:
    # node_a: str | None = request.args.get("a")
    # node_b: str | None = request.args.get("b")
    # if node_a is None or node_b is None:
    #     return app.response_class("[]")

    # exclude: str | None = request.args.get("exclude")
    # edges_to_exclude: list[str] = []
    # if exclude is not None:
    #     edges_to_exclude = exclude.split(",")

    return Response("Not implemented", status=400, mimetype="application/json")

    # json_values: list[str] = graph_shortest_path(node_a, node_b, GRAPH, edges_to_exclude)
    # json_bytes: bytes = msgspec.json.encode(json_values)
    # response = Response(json_bytes, status=200, mimetype="application/json")
    # return response


@cross_origin(origins=["*"])
@app.route("/api/flood_fill", methods=["GET", "OPTIONS"])
def flood_fill() -> Response:
    # node: str | None = request.args.get("node")
    # if node is None:
    #     return app.response_class("[]")

    # exclude: str | None = request.args.get("exclude")
    # edges_to_exclude: list[str] = []
    # if exclude is not None:
    #     edges_to_exclude = exclude.split(",")

    return Response("Not implemented", status=400, mimetype="application/json")

    # json_values: list[str] = graph_flood_fill(node, GRAPH, edges_to_exclude)
    # json_bytes: bytes = msgspec.json.encode(json_values)
    # response = Response(json_bytes, status=200, mimetype="application/json")
    # return response


if __name__ == "__main__":
    app.run(debug=True)
