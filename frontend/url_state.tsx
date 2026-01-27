import { HierarchyView } from "./components/hierarchy";

export interface AppState {
  latitude: number;
  longitude: number;
  zoom: number;
  hierarchyView: HierarchyView | null;
  levelOfDetail: string | null;
  colouringCategory: string;
}

// Default values
export const DEFAULT_STATE: AppState = {
  latitude: -39.059,
  longitude: 174.07,
  zoom: 14,
  hierarchyView: null,
  levelOfDetail: null,
  colouringCategory: "",
};

// Read state from URL query parameters
export function readStateFromURL(): Partial<AppState> {
  const params = new URLSearchParams(window.location.search);
  const state: Partial<AppState> = {};

  // Read map position
  const lat = params.get("lat");
  const lng = params.get("lng");
  const zoom = params.get("zoom");

  if (lat !== null) {
    const latNum = parseFloat(lat);
    if (!isNaN(latNum)) state.latitude = latNum;
  }
  if (lng !== null) {
    const lngNum = parseFloat(lng);
    if (!isNaN(lngNum)) state.longitude = lngNum;
  }
  if (zoom !== null) {
    const zoomNum = parseFloat(zoom);
    if (!isNaN(zoomNum)) state.zoom = zoomNum;
  }

  // Read hierarchy view
  const gxp = params.get("gxp");
  const substation = params.get("substation");
  const hv = params.get("hv");
  const dtx = params.get("dtx");

  if (gxp || substation || hv || dtx) {
    state.hierarchyView = {
      gxp_code: gxp || "",
      substation_name: substation || null,
      hv_feeder_code: hv || null,
      dtx_code: dtx || null,
    };
  }

  // Read level of detail
  const detail = params.get("detail");
  if (detail !== null) {
    state.levelOfDetail = detail;
  }

  // Read colouring category (just the column name, not the mapping)
  const colorCategory = params.get("color");
  if (colorCategory !== null) {
    state.colouringCategory = colorCategory;
  }

  return state;
}

// Write state to URL query parameters
export function writeStateToURL(state: Partial<AppState>): void {
  const params = new URLSearchParams(window.location.search);

  // Write map position
  if (state.latitude !== undefined) {
    params.set("lat", state.latitude.toFixed(6));
  }
  if (state.longitude !== undefined) {
    params.set("lng", state.longitude.toFixed(6));
  }
  if (state.zoom !== undefined) {
    params.set("zoom", state.zoom.toFixed(2));
  }

  // Write hierarchy view
  if (state.hierarchyView !== undefined) {
    if (state.hierarchyView === null) {
      // Clear hierarchy parameters
      params.delete("gxp");
      params.delete("substation");
      params.delete("hv");
      params.delete("dtx");
    } else {
      if (state.hierarchyView.gxp_code) {
        params.set("gxp", state.hierarchyView.gxp_code);
      } else {
        params.delete("gxp");
      }
      if (state.hierarchyView.substation_name) {
        params.set("substation", state.hierarchyView.substation_name);
      } else {
        params.delete("substation");
      }
      if (state.hierarchyView.hv_feeder_code) {
        params.set("hv", state.hierarchyView.hv_feeder_code);
      } else {
        params.delete("hv");
      }
      if (state.hierarchyView.dtx_code) {
        params.set("dtx", state.hierarchyView.dtx_code);
      } else {
        params.delete("dtx");
      }
    }
  }

  // Write level of detail
  if (state.levelOfDetail !== undefined) {
    if (state.levelOfDetail === null) {
      params.delete("detail");
    } else {
      params.set("detail", state.levelOfDetail);
    }
  }

  // Write colouring category (just the column name)
  if (state.colouringCategory !== undefined) {
    if (state.colouringCategory === "" || state.colouringCategory === null) {
      params.delete("color");
    } else {
      params.set("color", state.colouringCategory);
    }
  }

  // Update URL without reloading the page
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newURL);
}
