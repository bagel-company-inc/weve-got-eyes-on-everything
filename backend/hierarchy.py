from enum import Enum, auto
from typing import Any, NamedTuple, Self

from geopandas import GeoDataFrame


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


class HierarchyOutput(NamedTuple):
    hierarchy_level: HierarchyLevel
    values: list[str]


def get_hierarchy(
    connectivity: GeoDataFrame, hierarchy_input: HierarchyInput
) -> HierarchyOutput | None:
    hierarchy_level: HierarchyLevel = HierarchyLevel.GXP
    values: list[str] = []
    if (
        hierarchy_input.gxp_code
        and hierarchy_input.substation_name
        and hierarchy_input.hv_feeder_code
        and hierarchy_input.dtx_code
    ):
        hierarchy_level = HierarchyLevel.LV
        df = connectivity[
            (connectivity.gxp_code == hierarchy_input.gxp_code)
            & (connectivity.substation_name == hierarchy_input.substation_name)
            & (connectivity.hv_feeder_code == hierarchy_input.hv_feeder_code)
            & (connectivity.dtx_code == hierarchy_input.dtx_code)
            & (~connectivity.lv_circuit_code.isna())
        ]
        values = df.lv_circuit_code.unique().tolist()
    elif (
        hierarchy_input.gxp_code
        and hierarchy_input.substation_name
        and hierarchy_input.hv_feeder_code
    ):
        hierarchy_level = HierarchyLevel.DTX
        df = connectivity[
            (connectivity.gxp_code == hierarchy_input.gxp_code)
            & (connectivity.substation_name == hierarchy_input.substation_name)
            & (connectivity.hv_feeder_code == hierarchy_input.hv_feeder_code)
            & (~connectivity.dtx_code.isna())
        ]
        values = df.dtx_code.unique().tolist()
    elif hierarchy_input.gxp_code and hierarchy_input.substation_name:
        hierarchy_level = HierarchyLevel.HV
        df = connectivity[
            (connectivity.gxp_code == hierarchy_input.gxp_code)
            & (connectivity.substation_name == hierarchy_input.substation_name)
            & (~connectivity.hv_feeder_code.isna())
        ]
        values = df.hv_feeder_code.unique().tolist()
    elif hierarchy_input.gxp_code:
        hierarchy_level = HierarchyLevel.SUBSTATION
        df = connectivity[
            (connectivity.gxp_code == hierarchy_input.gxp_code)
            & (~connectivity.substation_name.isna())
        ]
        values = df.substation_name.unique().tolist()
    else:
        hierarchy_level = HierarchyLevel.GXP
        df = connectivity[~connectivity.gxp_code.isna()]
        values = df.gxp_code.unique().tolist()

    if len(values) == 0:
        return None

    return HierarchyOutput(hierarchy_level, values)


def to_hierarchy_json(hierarchy_output: HierarchyOutput) -> dict[str, Any]:
    return {
        "level": hierarchy_output.hierarchy_level.name,
        "level_display_name": hierarchy_display_name(hierarchy_output.hierarchy_level),
        "count": len(hierarchy_output.values),
        "values": sorted(hierarchy_output.values),
    }


def get_hierarchy_json(
    connectivity: GeoDataFrame,
    gxp_code: str | None = None,
    substation_name: str | None = None,
    hv_feeder_code: str | None = None,
    dtx_code: str | None = None,
    lv_circuit_code: str | None = None,
) -> dict[str, Any] | None:
    hierarchy_input: HierarchyInput = HierarchyInput.new(
        gxp_code=gxp_code,
        substation_name=substation_name,
        hv_feeder_code=hv_feeder_code,
        dtx_code=dtx_code,
        lv_circuit_code=lv_circuit_code,
    )
    hierarchy_output: HierarchyOutput | None = get_hierarchy(connectivity, hierarchy_input)
    if hierarchy_output is None:
        return None
    return to_hierarchy_json(hierarchy_output)
