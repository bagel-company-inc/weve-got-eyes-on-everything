import * as React from "react";
import { createRoot } from "react-dom/client";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";

import CommonModelMap from "./components/map";
import Sidebar from "./components/sidebar";
import { ColouringContext } from "./components/colouring";
import { HierarchyView } from "./components/hierarchy";

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
  const [sidebarWidth, setSidebarWidth] = React.useState(300);
  const [isResizing, setIsResizing] = React.useState(false);

  const [colouringContext, setColouringContext] =
    React.useState<ColouringContext>({ category: "", mapping: {} });

  const handleMouseDown = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      // Constrain width between 200px and 600px
      const constrainedWidth = Math.max(200, Math.min(600, newWidth));
      setSidebarWidth(constrainedWidth);
    },
    [isResizing]
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
          setHierarchyView={setHierarchyView}
          width={sidebarWidth}
          colouringContext={colouringContext}
          setColouringContext={setColouringContext}
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
