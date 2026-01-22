from geopandas import GeoDataFrame, GeoSeries
from pandas import DataFrame, read_csv

from src.connections import CNMConnection


CONNECTIVITY_COLUMNS: dict[str, str] = {
    "extract_id": "INTEGER",
    "object_type": "TEXT",
    "object_id": "INTEGER",
    "name": "TEXT",
    "node_1": "TEXT",
    "node_2": "TEXT",
    "node_1_voltage": "REAL",
    "node_2_voltage": "REAL",
    "feeder_code": "TEXT",
    "gxp_code": "TEXT",
    "substation_name": "TEXT",
    "hv_feeder_code": "TEXT",
    "dtx_code": "TEXT",
    "lv_circuit_code": "TEXT",
    "hierarchy_level": "TEXT",
    "substation_code_idf": "TEXT",
    "out_of_order_indicator": "TEXT",
    "is_in_sub": "INTEGER",
    "normal_position": "INTEGER",
    "feeder_hat": "INTEGER",
    "date_modified": "TEXT",
    "length_km": "REAL",
    "gxp_name": "TEXT",
    "delivery_point": "TEXT",
}


def df_to_gdf(df: DataFrame) -> GeoDataFrame:
    df["geometry"] = GeoSeries.from_wkt(df.geometry_4326, crs="EPSG:4326")
    gdf: GeoDataFrame = GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")
    gdf = gdf.replace({float("nan"): None})
    return gdf


def get_latest_extract_id(connection: CNMConnection) -> int:
    sql: str = """
    SELECT MAX(extract_id) AS extract_id, joke
    FROM cm_elec_run
    WHERE status = 'SUCCESS'
    """
    df: DataFrame = connection.read_sql(sql)
    extract_id: int = df["extract_id"].values[0]
    joke: str = df["joke"].values[0]
    print(f"Found latest extract_id: {extract_id}")
    print("Joke of the day:")
    print(joke)
    print()
    return extract_id


def get_common_model(csv_path: str | None = None) -> GeoDataFrame:
    if csv_path is not None:
        df: DataFrame = read_csv(csv_path, index_col=None)
        gdf: GeoDataFrame = df_to_gdf(df)
        return gdf

    connection = CNMConnection()

    latest_extract_id: int = get_latest_extract_id(connection)

    print("Reading connectivity")
    connectivity_columns: list[str] = list(CONNECTIVITY_COLUMNS.keys()) + ["geometry_4326"]
    sql: str = f"""
    SELECT
        {", ".join(connectivity_columns)}
    FROM cm_elec_connectivity
    WHERE extract_id = {latest_extract_id}
    """
    df = connection.read_sql(sql)
    connection.close()
    gdf = df_to_gdf(df)
    return gdf
