import os
import msgspec
from typing import Any, NamedTuple, Self

from flask import Flask, request, Response
from flask_cors import CORS, cross_origin

import numpy as np
from numpy.typing import NDArray
from pandas import read_csv
from geopandas import GeoDataFrame, GeoSeries
from shapely import LineString, Point, get_coordinates


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
        dx: float = self.max_x - self.min_x
        dy: float = self.max_y - self.min_y
        return Bounds(
            self.min_x - dx * percent_overfit / 200,
            self.min_y - dy * percent_overfit / 200,
            self.max_x + dx * percent_overfit / 200,
            self.max_y + dy * percent_overfit / 200,
        )


def find_geometry_within_bounds(gdf: GeoDataFrame, gbounds: Bounds) -> GeoDataFrame:
    found = gdf.sindex.intersection(gbounds.overfit(40))
    return gdf.iloc[found]


def get_geo_interface(
    geometry: LineString | Point,
    coordinates: NDArray[np.float64],
) -> dict[str, Any]:
    if isinstance(geometry, Point):
        return {"type": "Point", "coordinates": coordinates.tolist()[0]}
    else:
        return {"type": "LineString", "coordinates": tuple(coordinates.tolist())}


def convert_geodataframe_row_to_geojson(
    row: dict[str, Any], coordinates: NDArray[np.float64]
) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": get_geo_interface(row["geometry"], coordinates),
        "properties": {
            "name": row["name"],
        },
    }


def dataframe_to_geojson_features(
    df: GeoDataFrame,
    coordinates: NDArray[np.float64],
    coordinate_indices: NDArray[np.int64],
    coordinate_lengths: NDArray[np.int64],
) -> list[dict[str, Any]]:
    columns_to_index: dict[str, int] = {column: i for i, column in enumerate(df.columns)}
    return [
        {
            "type": "Feature",
            "geometry": get_geo_interface(
                row[columns_to_index["geometry"]],
                coordinates[coordinate_indices[i] : coordinate_indices[i] + coordinate_lengths[i]],
            ),
            "properties": {
                "name": row[columns_to_index["name"]],
            },
        }
        for i, row in enumerate(df.itertuples(index=False, name=None))
    ]


def get_fast_coordinates(
    geometry: GeoSeries,
) -> tuple[NDArray[np.float64], NDArray[np.int64], NDArray[np.int64]]:
    coordinates, shapely_coordinate = get_coordinates(geometry.values, return_index=True)
    run_start = np.r_[True, shapely_coordinate[:-1] != shapely_coordinate[1:]]
    coordinate_lengths = np.diff(np.r_[np.nonzero(run_start)[0], len(shapely_coordinate)])
    coordinate_indices = np.r_[0, coordinate_lengths[:-1].cumsum()]
    return (coordinates, coordinate_indices, coordinate_lengths)


@cross_origin(origins=["*"])
@app.route("/api/geojson", methods=["GET", "OPTIONS"])
def get_pipes() -> Response:
    bbox_param: str | None = request.args.get("bbox")
    if not bbox_param:
        return app.response_class("[]")
    bounds: Bounds = Bounds.parse(bbox_param)

    geometry: GeoDataFrame = find_geometry_within_bounds(GXP, bounds)

    coordinates, coordinate_indices, coordinate_lengths = get_fast_coordinates(geometry.geometry)

    geojson_dict: list[dict[str, Any]] = dataframe_to_geojson_features(
        geometry, coordinates, coordinate_indices, coordinate_lengths
    )

    json_str: bytes = msgspec.json.encode({"type": "FeatureCollection", "features": geojson_dict})

    response = Response(json_str, status=200, mimetype="application/json")

    return response


if __name__ == "__main__":
    app.run(debug=True)
