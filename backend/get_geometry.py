from typing import Any, NamedTuple, Self

import numpy as np
from numpy.typing import NDArray
from geopandas import GeoDataFrame, GeoSeries
from shapely import LineString, Point, get_coordinates

import warnings

warnings.filterwarnings("ignore", category=UserWarning)


def lerp(x_min: float, x_max: float, t: float) -> float:
    return (x_max - x_min) * t + x_min


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


def simplify_geometry(gdf: GeoDataFrame, bounds: Bounds, zoom_level: float) -> GeoDataFrame:
    # Hacky and very bespoke to the mapping system we are using
    # both in the zoom values, and in the projection
    # ASSUMES WGS 84 PROJECTION

    zoom_max: float = 16
    zoom_min: float = 11

    geom_length_max: float = 0.0005
    geom_length_min: float = 0.00002

    if zoom_level < zoom_max:
        gdf = gdf[gdf.geometry.geom_type != "Point"]

    if zoom_level < 15:
        zoom_percent: float = (zoom_level - zoom_max) / (zoom_min - zoom_max)
        length_threshold: float = lerp(geom_length_min, geom_length_max, zoom_percent)

        length_threshold = min(max(length_threshold, geom_length_min), geom_length_max)
        gdf = gdf[gdf.geometry.length > length_threshold]
        gdf.geometry = gdf.geometry.simplify(tolerance=length_threshold)
    return gdf


def find_geometry_within_bounds(
    gdf: GeoDataFrame, gbounds: Bounds, zoom_level: float
) -> GeoDataFrame:
    found = gdf.sindex.intersection(gbounds.overfit(100))
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
    columns: list[str],
) -> list[dict[str, Any]]:
    columns_to_index: dict[str, int] = {column: i for i, column in enumerate(df.columns)}
    columns = [column for column in columns if column in columns_to_index]
    return [
        {
            "type": "Feature",
            "geometry": get_geo_interface(
                row[columns_to_index["geometry"]],
                coordinates[coordinate_indices[i] : coordinate_indices[i] + coordinate_lengths[i]],  # noqa[E203]
            ),
            "properties": {column: row[columns_to_index[column]] for column in columns},
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


def get_geojson_from_gdf(geometry: GeoDataFrame, column: str | None = None) -> dict[str, Any]:
    coordinates, coordinate_indices, coordinate_lengths = get_fast_coordinates(geometry.geometry)

    columns: list[str] = ["name"]
    if column is not None:
        columns.append(column)

    geojson_dict: list[dict[str, Any]] = dataframe_to_geojson_features(
        geometry, coordinates, coordinate_indices, coordinate_lengths, columns=columns
    )

    return {"type": "FeatureCollection", "features": geojson_dict}


def get_geometry(
    base_gdf: GeoDataFrame, bounds: Bounds, zoom_level: float, column: str | None
) -> dict[str, Any]:
    gdf: GeoDataFrame = simplify_geometry(base_gdf, bounds, zoom_level)

    geometry: GeoDataFrame = find_geometry_within_bounds(gdf, bounds, zoom_level)

    return get_geojson_from_gdf(geometry, column)
