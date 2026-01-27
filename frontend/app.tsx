import * as React from "react";
import { createRoot } from "react-dom/client";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";

import CommonModelMap from "./features/map/Map";
import Sidebar from "./features/sidebar/Sidebar";
import { MapProvider, useMap } from "./contexts/MapContext";
import { HierarchyProvider, useHierarchy } from "./contexts/HierarchyContext";
import { SelectionProvider } from "./contexts/SelectionContext";
import { ColouringProvider, useColouring } from "./contexts/ColouringContext";
import { ConnectivityProvider } from "./contexts/ConnectivityContext";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { readStateFromURL, writeStateToURL, useUrlSync } from "./hooks/useUrlState";

function AppContent() {
  const [activeTab, setActiveTab] = React.useState(0);
  const { width: sidebarWidth, isResizing, handleMouseDown } = useResizablePanel(520);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Sidebar
        width={sidebarWidth}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          width: "4px",
          cursor: "col-resize",
          backgroundColor: isResizing ? "primary.500" : "divider",
          "&:hover": {
            backgroundColor: "primary.300",
          },
          transition: "background-color 0.2s",
          zIndex: 1000,
          position: "relative",
          flexShrink: 0,
        }}
      />
      <Box
        sx={{
          flex: 1,
          height: "100%",
          position: "relative",
        }}
      >
        <CommonModelMap />
      </Box>
    </Box>
  );
}

function URLSyncWrapper({ children }: { children: React.ReactNode }) {
  // This component is inside all providers and syncs their state to URL
  const { viewState, levelOfDetail } = useMap();
  const { hierarchyView } = useHierarchy();
  const { colouringContext } = useColouring();

  // Use refs to track previous values and avoid unnecessary updates
  const prevValuesRef = React.useRef({
    hierarchyView,
    levelOfDetail,
    colouringCategory: colouringContext.category,
    latitude: viewState.latitude,
    longitude: viewState.longitude,
    zoom: viewState.zoom,
  });

  // Batch all URL updates together to avoid rate limiting
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const prev = prevValuesRef.current;
      const current = {
        hierarchyView,
        levelOfDetail,
        colouringCategory: colouringContext.category,
        latitude: viewState.latitude,
        longitude: viewState.longitude,
        zoom: viewState.zoom,
      };

      // Only update URL if values actually changed (deep comparison for hierarchyView)
      const hierarchyChanged = JSON.stringify(prev.hierarchyView) !== JSON.stringify(current.hierarchyView);
      const detailChanged = prev.levelOfDetail !== current.levelOfDetail;
      const categoryChanged = prev.colouringCategory !== current.colouringCategory;
      // Round coordinates to reduce URL updates during minor map movements
      const latChanged = Math.abs((prev.latitude || 0) - (current.latitude || 0)) > 0.0001;
      const lngChanged = Math.abs((prev.longitude || 0) - (current.longitude || 0)) > 0.0001;
      const zoomChanged = Math.abs((prev.zoom || 0) - (current.zoom || 0)) > 0.01;

      if (hierarchyChanged || detailChanged || categoryChanged || latChanged || lngChanged || zoomChanged) {
        writeStateToURL(current);
        prevValuesRef.current = current;
      }
    }, 1000); // Increased debounce to 1 second to reduce updates

    return () => clearTimeout(timeoutId);
  }, [
    hierarchyView,
    levelOfDetail,
    colouringContext.category,
    viewState.latitude,
    viewState.longitude,
    viewState.zoom,
  ]);

  return <>{children}</>;
}

export default function CommonModelViewer() {
  // Read initial state from URL
  const urlState = React.useMemo(() => readStateFromURL(), []);

  return (
    <CssVarsProvider>
      <CssBaseline />
      <MapProvider
        initialViewState={{
          latitude: urlState.latitude ?? -39.059,
          longitude: urlState.longitude ?? 174.07,
          zoom: urlState.zoom ?? 14,
        }}
        initialLevelOfDetail={urlState.levelOfDetail ?? null}
      >
        <HierarchyProvider initialHierarchyView={urlState.hierarchyView ?? null}>
          <SelectionProvider>
            <ColouringProvider initialCategory={urlState.colouringCategory ?? ""}>
              <ConnectivityProvider>
                <URLSyncWrapper>
                  <AppContent />
                </URLSyncWrapper>
              </ConnectivityProvider>
            </ColouringProvider>
          </SelectionProvider>
        </HierarchyProvider>
      </MapProvider>
    </CssVarsProvider>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  const root = createRoot(container);
  root.render(<CommonModelViewer />);
}
