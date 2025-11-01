from json import dumps
from typing import Any, NamedTuple, Self

from flask import Flask, request, Response
from flask_cors import CORS, cross_origin

from pandas import read_csv
from geopandas import GeoDataFrame, GeoSeries


app = Flask(__name__)
CORS(app)


def load_csv_to_gdf(path: str) -> GeoDataFrame:
    df = read_csv(path, index_col=0)
    df["geometry"] = GeoSeries.from_wkt(df.geometry_4326, crs="EPSG:4326")
    gdf = GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")
    return gdf


GXP = load_csv_to_gdf("data/CSTPOS.csv")


class Bounds(NamedTuple):
    min_x: float
    min_y: float
    max_x: float
    max_y: float

    @classmethod
    def parse(cls, string: str) -> Self:
        min_x, min_y, max_x, max_y = map(float, string.split(","))
        return cls(min_x, min_y, max_x, max_y)


def find_geometry_within_bounds(gdf: GeoDataFrame, gbounds: Bounds) -> GeoDataFrame:
    found = gdf.sindex.intersection(gbounds)
    return gdf.loc[found]


def convert_geodataframe_row_to_geojson(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": row["geometry"].__geo_interface__,
        "properties": {
            k: v for k, v in row.items() if k not in ("geometry", "geometry_nztm", "geometry_4326")
        },
    }


@cross_origin(origins=["*"])
@app.route("/api/geojson", methods=["GET", "OPTIONS"])
def get_pipes() -> Response:
    bbox_param: str | None = request.args.get("bbox")
    if not bbox_param:
        return app.response_class("[]")
    bounds: Bounds = Bounds.parse(bbox_param)

    geometry: GeoDataFrame = find_geometry_within_bounds(GXP, bounds)

    raw_rows: list[dict[str, Any]] = geometry.to_dict(orient="records")  # type: ignore[assignment]
    features: list[dict[str, Any]] = [convert_geodataframe_row_to_geojson(row) for row in raw_rows]
    return app.response_class((dumps({"type": "FeatureCollection", "features": features}), "\n"))


if __name__ == "__main__":
    app.run(debug=True)
