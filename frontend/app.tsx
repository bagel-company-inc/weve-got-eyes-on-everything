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
  const [hierarchyView, setHierarchyView] =
    React.useState<HierarchyView | null>(null);
  const [searchBarSelectedName, setSearchBarSelectedName] = React.useState<
    string | null
  >(null);
  const [sidebarWidth, setSidebarWidth] = React.useState(400);
  const [isResizing, setIsResizing] = React.useState(false);

  const [colouringContext, setColouringContext] =
    React.useState<ColouringContext>({ category: "", mapping: {} });
  const [pathFromNode, setPathFromNode] = React.useState<string | null>(null);
  const [pathToNode, setPathToNode] = React.useState<string | null>(null);
  const [pathFromInputValue, setPathFromInputValue] = React.useState("");
  const [pathToInputValue, setPathToInputValue] = React.useState("");
  const [excludedEdges, setExcludedEdges] = React.useState<string[]>([]);
  const [pathEdges, setPathEdges] = React.useState<Set<string>>(new Set());
  const [pathNotFound, setPathNotFound] = React.useState(false);
  const [pathLoading, setPathLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const clearShortestPath = React.useCallback(() => {
    setPathFromNode(null);
    setPathToNode(null);
    setPathEdges(new Set());
    setPathNotFound(false);
    setPathLoading(false);
    // Don't clear input values - preserve user's typed text
  }, []);

  // Fetch shortest path when both input fields have values
  React.useEffect(() => {
    // Reset state immediately when inputs change
    setPathNotFound(false);
    setPathLoading(false);
    setPathEdges(new Set());

    if (
      pathFromInputValue.trim() &&
      pathToInputValue.trim() &&
      pathFromInputValue.trim() !== pathToInputValue.trim()
    ) {
      setPathLoading(true);
      setPathNotFound(false);
      let url = `${API_URL}shortest_path?a=${encodeURIComponent(pathFromInputValue.trim())}&b=${encodeURIComponent(pathToInputValue.trim())}`;
      if (excludedEdges.length > 0) {
        const excludedString = excludedEdges
          .map((edge) => edge.trim())
          .filter((edge) => edge.length > 0)
          .join(",");
        if (excludedString) {
          url += `&exclude=${encodeURIComponent(excludedString)}`;
        }
      }

      const abortController = new AbortController();

      fetch(url, { signal: abortController.signal })
        .then((response) => response.json())
        .then((data: string[]) => {
          // Only update state if this request hasn't been aborted
          if (!abortController.signal.aborted) {
            setPathEdges(new Set(data));
            setPathNotFound(data.length === 0);
            setPathLoading(false);
          }
        })
        .catch((err) => {
          // Ignore abort errors
          if (err.name === "AbortError") {
            return;
          }
          console.error("Error getting shortest path:", err);
          if (!abortController.signal.aborted) {
            setPathEdges(new Set());
            setPathNotFound(false);
            setPathLoading(false);
          }
        });

      // Cleanup: abort the request if inputs change before it completes
      return () => {
        abortController.abort();
      };
    }
  }, [pathFromInputValue, pathToInputValue, excludedEdges]);

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
          pathNotFound={pathNotFound}
          pathLoading={pathLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
            pathEdges={pathEdges}
            onObjectSelected={() => setActiveTab(0)}
            onMapObjectClickClearPath={clearShortestPath}
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
