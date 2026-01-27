import * as React from "react";

export interface ViewState {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface MapContextType {
  currentMapBounds: string | null;
  setCurrentMapBounds: (bounds: string | null) => void;
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  initialViewState: ViewState;
  levelOfDetail: string | null;
  setLevelOfDetail: (detail: string | null) => void;
}

const MapContext = React.createContext<MapContextType | undefined>(undefined);

export const DEFAULT_VIEW_STATE: ViewState = {
  latitude: -39.059,
  longitude: 174.07,
  zoom: 14,
};

interface MapProviderProps {
  children: React.ReactNode;
  initialViewState?: ViewState;
  initialLevelOfDetail?: string | null;
}

export function MapProvider({
  children,
  initialViewState = DEFAULT_VIEW_STATE,
  initialLevelOfDetail = null,
}: MapProviderProps) {
  const [currentMapBounds, setCurrentMapBounds] = React.useState<string | null>(null);
  const [viewState, setViewState] = React.useState<ViewState>(initialViewState);
  const [levelOfDetail, setLevelOfDetail] = React.useState<string | null>(initialLevelOfDetail);

  // Wrap setters in useCallback to prevent unnecessary re-renders
  const setCurrentMapBoundsCallback = React.useCallback((bounds: string | null) => {
    setCurrentMapBounds(bounds);
  }, []);

  const setViewStateCallback = React.useCallback((state: ViewState) => {
    setViewState(state);
  }, []);

  const setLevelOfDetailCallback = React.useCallback((detail: string | null) => {
    setLevelOfDetail(detail);
  }, []);

  const value = React.useMemo(
    () => ({
      currentMapBounds,
      setCurrentMapBounds: setCurrentMapBoundsCallback,
      viewState,
      setViewState: setViewStateCallback,
      initialViewState,
      levelOfDetail,
      setLevelOfDetail: setLevelOfDetailCallback,
    }),
    [currentMapBounds, viewState, initialViewState, levelOfDetail, setCurrentMapBoundsCallback, setViewStateCallback, setLevelOfDetailCallback],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap() {
  const context = React.useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}
