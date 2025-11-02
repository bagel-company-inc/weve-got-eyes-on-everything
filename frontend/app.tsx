import * as React from "react";
import { createRoot } from "react-dom/client";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";

import CommonModelMap from "./components/map";
import Sidebar from "./components/sidebar";

export default function CommonModelViewer() {
  const [attributeData, setAttributeData] = React.useState<Record<string, any> | null>(null);

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <Sidebar attributeData={attributeData} />
        <Box
          sx={{
            flex: 1,
            height: "100%",
            marginLeft: { xs: "var(--Sidebar-width)", md: 0 },
            position: "relative",
          }}
        >
          <CommonModelMap onAttributeDataChange={setAttributeData} />
        </Box>
      </Box>
    </CssVarsProvider>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  const root = createRoot(container);
  root.render(<CommonModelViewer />);
}
