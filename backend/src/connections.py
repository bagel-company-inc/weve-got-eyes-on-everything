import pyodbc  # type: ignore[import-not-found]
from pandas import DataFrame

from src.config import Config


class CNMConnection:
    def __init__(self) -> None:
        config: Config = Config()

        user_name: str = config.get_connection_arg("common_model", "user_name")
        server: str = config.get_connection_arg("common_model", "server")
        database: str = config.get_connection_arg("common_model", "database")

        self.cnm_connection = pyodbc.connect(
            "Driver={ODBC Driver 17 for SQL Server};"
            "Server="
            + server
            + ";Database="
            + database
            + ";UID="
            + user_name
            + ";Trusted_Connection=Yes;"
            "MultiSubnetFailover=Yes"
        )

    def read_sql(self, sql: str) -> DataFrame:
        cur = self.cnm_connection.cursor()
        cur.execute(sql)

        rows = cur.fetchall()
        columns = [col[0].strip().lower() for col in cur.description]

        if rows and len(rows[0]) != len(columns):
            cur.close()
            raise Exception("Column count does not match row field count. Cannot build DataFrame.")

        # Convert to DataFrame
        data = DataFrame([list(row) for row in rows], columns=columns)
        data = data.loc[:, ~data.columns.duplicated()]
        cur.close()
        return data

    def close(self) -> None:
        self.cnm_connection.close()
