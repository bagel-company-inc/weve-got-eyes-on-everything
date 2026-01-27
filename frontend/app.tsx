import * as React from "react";
import { createRoot } from "react-dom/client";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";

import CommonModelMap from "./components/map";
import Sidebar from "./components/sidebar";
import { ColouringContext } from "./components/colouring";
import { HierarchyView, addHierarchyToURL } from "./components/hierarchy";
import { API_URL } from "./api_url";
import { readStateFromURL, writeStateToURL, DEFAULT_STATE } from "./url_state";

export default function CommonModelViewer() {
  // Read initial state from URL
  const urlState = React.useMemo(() => readStateFromURL(), []);

  const [attributeData, setAttributeData] = React.useState<Record<
    string,
    any
  > | null>(null);
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);
  const [viewedAssetName, setViewedAssetName] = React.useState<string | null>(
    null,
  );
  const [currentMapBounds, setCurrentMapBounds] = React.useState<string | null>(
    null,
  );
  const [boxSelectionMode, setBoxSelectionMode] = React.useState(false);
  const [hierarchyView, setHierarchyView] =
    React.useState<HierarchyView | null>(urlState.hierarchyView ?? null);
  const [searchBarSelectedName, setSearchBarSelectedName] = React.useState<
    string | null
  >(null);
  const [searchTriggerCount, setSearchTriggerCount] = React.useState(0);
  const [sidebarWidth, setSidebarWidth] = React.useState(520);
  const [isResizing, setIsResizing] = React.useState(false);

  const [colouringContext, setColouringContext] =
    React.useState<ColouringContext>({
      category: urlState.colouringCategory ?? "",
      mapping: {},
    });
  const [activeTab, setActiveTab] = React.useState(0);

  // Voltage color preset (same as in colouring.tsx)
  const VOLTAGE_COLOUR_PRESET: Record<number, string> = {
    415: "#6fdd50",
    3300: "#8bb01c",
    6600: "#edbd0e",
    11000: "#e86033",
    22000: "#0eaaed",
  };

  // Helper function to convert HSL to Hex (same as in colouring.tsx)
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const [pathFromNode, setPathFromNode] = React.useState<string | null>(null);
  const [pathToNode, setPathToNode] = React.useState<string | null>(null);
  const [pathFromInputValue, setPathFromInputValue] = React.useState("");
  const [pathToInputValue, setPathToInputValue] = React.useState("");
  const [excludedEdges, setExcludedEdges] = React.useState<string[]>([]);
  const [pathEdges, setPathEdges] = React.useState<Set<string>>(new Set());
  const [pathNotFound, setPathNotFound] = React.useState(false);
  const [pathLoading, setPathLoading] = React.useState(false);

  const [floodFillNode, setFloodFillNode] = React.useState<string | null>(null);
  const [floodFillInputValue, setFloodFillInputValue] = React.useState("");
  const [floodFillExcludedEdges, setFloodFillExcludedEdges] = React.useState<
    string[]
  >([]);
  const [floodFillEdges, setFloodFillEdges] = React.useState<Set<string>>(
    new Set(),
  );
  const [floodFillNotFound, setFloodFillNotFound] = React.useState(false);
  const [floodFillLoading, setFloodFillLoading] = React.useState(false);

  const [levelOfDetail, setLevelOfDetail] = React.useState<string | null>(
    urlState.levelOfDetail ?? null,
  );

  // Store initial view state from URL
  const [initialViewState] = React.useState({
    latitude: urlState.latitude ?? DEFAULT_STATE.latitude,
    longitude: urlState.longitude ?? DEFAULT_STATE.longitude,
    zoom: urlState.zoom ?? DEFAULT_STATE.zoom,
  });

  // Track current map view state for URL updates
  const [currentMapViewState, setCurrentMapViewState] =
    React.useState(initialViewState);

  // Load color mapping when category is set from URL
  React.useEffect(() => {
    // Only load if we have a category but no mapping
    if (
      colouringContext.category &&
      Object.keys(colouringContext.mapping).length === 0
    ) {
      const url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}column_unique_values?column=${colouringContext.category}`,
      );

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (!data || data.length === 0) return;

          const newCategoryColours: Record<string | number, string> = {};
          const isVoltage = colouringContext.category.includes("voltage");
          const differences = 12;

          for (let i = 0; i < data.length; i++) {
            // Use voltage preset if applicable
            if (isVoltage && data[i] in VOLTAGE_COLOUR_PRESET) {
              newCategoryColours[data[i]] = VOLTAGE_COLOUR_PRESET[data[i]];
              continue;
            }

            // Generate color based on position
            let percent = i / data.length;
            let angle = percent * 360;
            let mod = i % differences;
            angle = (angle + (360 / differences) * mod) % 360;
            newCategoryColours[data[i]] = hslToHex(angle, 80, 50);
          }

          setColouringContext({
            category: colouringContext.category,
            mapping: newCategoryColours,
          });
        })
        .catch((err) => console.error("Error loading color mapping:", err));
    }
  }, [colouringContext.category, hierarchyView]); // Run when category or hierarchy changes

  // Sync hierarchy view to URL
  React.useEffect(() => {
    writeStateToURL({ hierarchyView });
  }, [hierarchyView]);

  // Sync level of detail to URL
  React.useEffect(() => {
    writeStateToURL({ levelOfDetail });
  }, [levelOfDetail]);

  // Sync colouring category to URL (not the full mapping)
  React.useEffect(() => {
    writeStateToURL({ colouringCategory: colouringContext.category });
  }, [colouringContext.category]);

  // Debounced sync of map view state to URL
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      writeStateToURL({
        latitude: currentMapViewState.latitude,
        longitude: currentMapViewState.longitude,
        zoom: currentMapViewState.zoom,
      });
    }, 500); // Debounce by 500ms to avoid updating URL too frequently

    return () => clearTimeout(timeoutId);
  }, [currentMapViewState]);

  const clearShortestPath = React.useCallback(() => {
    setPathFromNode(null);
    setPathToNode(null);
    setPathEdges(new Set());
    setPathNotFound(false);
    setPathLoading(false);
    setPathFromInputValue("");
    setPathToInputValue("");
    setExcludedEdges([]);
  }, []);

  const clearFloodFill = React.useCallback(() => {
    setFloodFillNode(null);
    setFloodFillEdges(new Set());
    setFloodFillNotFound(false);
    setFloodFillLoading(false);
    setFloodFillInputValue("");
    setFloodFillExcludedEdges([]);
  }, []);

  const handleSelectAssetsByValue = React.useCallback(
    (assetNames: string[]) => {
      setSelectedAssets(assetNames);
      setActiveTab(0); // Switch to Attributes tab
    },
    [],
  );

  const handleZoomToAsset = React.useCallback((name: string) => {
    setSearchBarSelectedName(name);
    setSearchTriggerCount((prev) => prev + 1);
  }, []);

  // Fetch attributes for a selected asset
  const fetchAttributesForAsset = React.useCallback(
    (name: string) => {
      // Use current map bounds if available, otherwise fallback to default
      const bbox = currentMapBounds || "166.0,-47.5,179.0,-34.0";
      fetch(
        `${API_URL}attributes?name=${encodeURIComponent(name)}&bbox=${bbox}`,
      )
        .then((response) => response.json())
        .then((data) => {
          setAttributeData(data);
        })
        .catch((err) => console.error("Error getting attributes:", err));
    },
    [currentMapBounds],
  );

  // Combine path edges and flood fill edges for the map
  const allHighlightedEdges = React.useMemo(() => {
    const combined = new Set(pathEdges);
    floodFillEdges.forEach((edge) => combined.add(edge));
    return combined;
  }, [pathEdges, floodFillEdges]);

  const handleMouseDown = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      const constrainedWidth = Math.max(380, Math.min(600, newWidth));
      setSidebarWidth(constrainedWidth);
    },
    [isResizing],
  );

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <CssVarsProvider>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <Sidebar
          attributeData={attributeData}
          searchBarSelectionChange={(name) => {
            setSearchBarSelectedName(name);
            if (name) {
              setSearchTriggerCount((prev) => prev + 1);
            }
          }}
          selectedName={searchBarSelectedName}
          selectedAssets={selectedAssets}
          setSelectedAssets={setSelectedAssets}
          viewedAssetName={viewedAssetName}
          setViewedAssetName={setViewedAssetName}
          onFetchAttributes={fetchAttributesForAsset}
          boxSelectionMode={boxSelectionMode}
          setBoxSelectionMode={setBoxSelectionMode}
          hierarchyView={hierarchyView}
          setHierarchyView={setHierarchyView}
          width={sidebarWidth}
          colouringContext={colouringContext}
          setColouringContext={setColouringContext}
          pathFromNode={pathFromNode}
          setPathFromNode={setPathFromNode}
          pathToNode={pathToNode}
          setPathToNode={setPathToNode}
          pathFromInputValue={pathFromInputValue}
          setPathFromInputValue={setPathFromInputValue}
          pathToInputValue={pathToInputValue}
          setPathToInputValue={setPathToInputValue}
          excludedEdges={excludedEdges}
          setExcludedEdges={setExcludedEdges}
          setPathEdges={setPathEdges}
          setPathNotFound={setPathNotFound}
          setPathLoading={setPathLoading}
          floodFillNode={floodFillNode}
          setFloodFillNode={setFloodFillNode}
          floodFillInputValue={floodFillInputValue}
          setFloodFillInputValue={setFloodFillInputValue}
          floodFillExcludedEdges={floodFillExcludedEdges}
          setFloodFillExcludedEdges={setFloodFillExcludedEdges}
          setFloodFillEdges={setFloodFillEdges}
          setFloodFillNotFound={setFloodFillNotFound}
          setFloodFillLoading={setFloodFillLoading}
          onClearShortestPath={clearShortestPath}
          onClearFloodFill={clearFloodFill}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          levelOfDetail={levelOfDetail}
          setLevelOfDetail={setLevelOfDetail}
          onSelectAssetsByValue={handleSelectAssetsByValue}
          onZoomToAsset={handleZoomToAsset}
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
          <CommonModelMap
            onAttributeDataChange={setAttributeData}
            hierarchyView={hierarchyView}
            searchBarSelected={searchBarSelectedName}
            searchTriggerCount={searchTriggerCount}
            colouringContext={colouringContext}
            pathFromNode={pathFromNode}
            pathToNode={pathToNode}
            pathEdges={allHighlightedEdges}
            onObjectSelected={() => setActiveTab(0)}
            onMapObjectClickClearPath={clearShortestPath}
            selectedAssets={selectedAssets}
            onAddToSelection={(name) => {
              setSelectedAssets((prev) => {
                if (prev.includes(name)) return prev;
                return [...prev, name];
              });
            }}
            boxSelectionMode={boxSelectionMode}
            onBoxSelection={(names) => {
              setSelectedAssets((prev) => {
                const newSet = new Set(prev);
                names.forEach((name) => newSet.add(name));
                return Array.from(newSet);
              });
            }}
            onBoxSelectionComplete={() => setBoxSelectionMode(false)}
            highlightedAssetName={viewedAssetName}
            onAssetSelected={(name) => {
              setViewedAssetName(name);
            }}
            onBoundsChange={setCurrentMapBounds}
            onClearAttributes={() => {
              setViewedAssetName(null);
              setAttributeData(null);
            }}
            onClearSelection={() => {
              setViewedAssetName(null);
            }}
            levelOfDetail={levelOfDetail}
            initialViewState={initialViewState}
            onViewStateChange={setCurrentMapViewState}
          />
        </Box>
      </Box>
    </CssVarsProvider>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  const root = createRoot(container);
  root.render(<CommonModelViewer />);
}
