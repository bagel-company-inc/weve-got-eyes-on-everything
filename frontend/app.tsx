import * as React from "react";
import { createRoot } from "react-dom/client";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";

import CommonModelMap from "./components/map";
import Sidebar from "./components/sidebar";
import { ColouringContext } from "./components/colouring";
import { HierarchyView } from "./components/hierarchy";
import { API_URL } from "./api_url";

export default function CommonModelViewer() {
  const [attributeData, setAttributeData] = React.useState<Record<
    string,
    any
  > | null>(null);
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);
  const [viewedAssetName, setViewedAssetName] = React.useState<string | null>(null);
  const [currentMapBounds, setCurrentMapBounds] = React.useState<string | null>(null);
  const [boxSelectionMode, setBoxSelectionMode] = React.useState(false);
  const [hierarchyView, setHierarchyView] =
    React.useState<HierarchyView | null>(null);
  const [searchBarSelectedName, setSearchBarSelectedName] = React.useState<
    string | null
  >(null);
  const [sidebarWidth, setSidebarWidth] = React.useState(400);
  const [isResizing, setIsResizing] = React.useState(false);

  const [colouringContext, setColouringContext] =
    React.useState<ColouringContext>({ category: "", mapping: {} });
  const [activeTab, setActiveTab] = React.useState(0);

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

  const [levelOfDetail, setLevelOfDetail] = React.useState<string | null>(null);

  const clearShortestPath = React.useCallback(() => {
    setPathFromNode(null);
    setPathToNode(null);
    setPathEdges(new Set());
    setPathNotFound(false);
    setPathLoading(false);
    // Don't clear input values - preserve user's typed text
  }, []);

  const clearFloodFill = React.useCallback(() => {
    setFloodFillNode(null);
    setFloodFillEdges(new Set());
    setFloodFillNotFound(false);
    setFloodFillLoading(false);
    // Don't clear input values - preserve user's typed text
  }, []);

  // Fetch attributes for a selected asset
  const fetchAttributesForAsset = React.useCallback((name: string) => {
    // Use current map bounds if available, otherwise fallback to default
    const bbox = currentMapBounds || "166.0,-47.5,179.0,-34.0";
    fetch(`${API_URL}attributes?name=${encodeURIComponent(name)}&bbox=${bbox}`)
      .then((response) => response.json())
      .then((data) => {
        setAttributeData(data);
      })
      .catch((err) => console.error("Error getting attributes:", err));
  }, [currentMapBounds]);

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
          searchBarSelectionChange={setSearchBarSelectedName}
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
