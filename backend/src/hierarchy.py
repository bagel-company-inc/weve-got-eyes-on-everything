import sqlite3
from enum import Enum, auto
from typing import Any, Mapping, NamedTuple, Self

from src.database import LevelOfDetail, level_of_detail_table


class HierarchyLevel(Enum):
    GXP = auto()
    SUBSTATION = auto()
    HV = auto()

    DTX = auto()
    LV = auto()


def hierarchy_display_name(hierarchy_level: HierarchyLevel) -> str:
    match hierarchy_level:
        case HierarchyLevel.GXP:
            return "GXP"
        case HierarchyLevel.SUBSTATION:
            return "Substation"
        case HierarchyLevel.HV:
            return "HV Feeder"
        case HierarchyLevel.DTX:
            return "LV"
        case HierarchyLevel.LV:
            return "LV (Under LV Switch)"


class HierarchyInput(NamedTuple):
    gxp_code: str | None
    substation_name: str | None
    hv_feeder_code: str | None
    dtx_code: str | None
    lv_circuit_code: str | None

    @classmethod
    def new(
        cls,
        gxp_code: str | None = None,
        substation_name: str | None = None,
        hv_feeder_code: str | None = None,
        dtx_code: str | None = None,
        lv_circuit_code: str | None = None,
    ) -> Self:
        return cls(
            gxp_code=gxp_code,
            substation_name=substation_name,
            hv_feeder_code=hv_feeder_code,
            dtx_code=dtx_code,
            lv_circuit_code=lv_circuit_code,
        )

    @classmethod
    def parse_request_args(cls, args: Mapping[str, str]) -> Self:
        return cls(
            gxp_code=args.get("gxp"),
            substation_name=args.get("substation"),
            hv_feeder_code=args.get("hv"),
            dtx_code=args.get("dtx"),
            lv_circuit_code=args.get("lv"),
        )

    def create_sql_where_clause(self) -> tuple[str, list[str]]:
        sql: str = ""
        parameters: list[str] = []
        if self.gxp_code is not None:
            sql += " AND gxp_code = ?"
            parameters.append(self.gxp_code)
        if self.substation_name is not None:
            sql += " AND substation_name = ?"
            parameters.append(self.substation_name)
        if self.hv_feeder_code is not None:
            sql += " AND hv_feeder_code = ?"
            parameters.append(self.hv_feeder_code)
        if self.dtx_code is not None:
            sql += " AND dtx_code = ?"
            parameters.append(self.dtx_code)
        if self.lv_circuit_code is not None:
            sql += " AND lv_circuit_code = ?"
            parameters.append(self.lv_circuit_code)
        if len(sql) == 0:
            return "AND 1=1", []
        return sql, parameters


class HierarchyOutput(NamedTuple):
    hierarchy_level: HierarchyLevel
    values: list[str]


def get_hierarchy(
    connection: sqlite3.Connection, hierarchy_input: HierarchyInput
) -> HierarchyOutput:
    hierarchy_level: HierarchyLevel = HierarchyLevel.GXP
    sql: str = ""
    parameters: list[str] = []

    additional_where_clause, extra_parameters = hierarchy_input.create_sql_where_clause()
    column: str = "gxp_code"

    if (
        hierarchy_input.gxp_code
        and hierarchy_input.substation_name
        and hierarchy_input.hv_feeder_code
        and hierarchy_input.dtx_code
    ):
        hierarchy_level = HierarchyLevel.LV
        column = "lv_circuit_code"
    elif (
        hierarchy_input.gxp_code
        and hierarchy_input.substation_name
        and hierarchy_input.hv_feeder_code
    ):
        hierarchy_level = HierarchyLevel.DTX
        column = "dtx_code"
    elif hierarchy_input.gxp_code and hierarchy_input.substation_name:
        hierarchy_level = HierarchyLevel.HV
        column = "hv_feeder_code"
    elif hierarchy_input.gxp_code:
        hierarchy_level = HierarchyLevel.SUBSTATION
        column = "substation_name"
    else:
        hierarchy_level = HierarchyLevel.GXP
        column = "gxp_code"

    parameters.extend(extra_parameters)

    values: list[str] = []

    cursor = connection.cursor()
    sql = f"""
    SELECT
        DISTINCT {column}
    FROM {level_of_detail_table(LevelOfDetail.ALL)}
    WHERE out_of_order_indicator = 'INS'
    {additional_where_clause} AND {column} IS NOT NULL;
    """
    cursor.execute(sql, parameters)

    rows = cursor.fetchall()
    for row in rows:
        values.append(row[0])

    cursor.close()

    return HierarchyOutput(hierarchy_level, values)


def to_hierarchy_json(hierarchy_output: HierarchyOutput) -> dict[str, Any]:
    return {
        "level": hierarchy_output.hierarchy_level.name,
        "level_display_name": hierarchy_display_name(hierarchy_output.hierarchy_level),
        "count": len(hierarchy_output.values),
        "values": sorted(hierarchy_output.values),
    }


def get_hierarchy_json(
    connection: sqlite3.Connection, hierarchy_input: HierarchyInput
) -> dict[str, Any]:
    hierarchy_output: HierarchyOutput = get_hierarchy(connection, hierarchy_input)
    return to_hierarchy_json(hierarchy_output)
