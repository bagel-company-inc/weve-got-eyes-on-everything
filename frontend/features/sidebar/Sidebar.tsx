import * as React from "react";
import Box from "@mui/joy/Box";
import Tab from "@mui/joy/Tab";
import Tabs from "@mui/joy/Tabs";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";

import AttributePanel from "../attributes/AttributePanel";
import ColouringPanel from "../colouring/ColouringPanel";
import SearchBar from "../search/SearchBar";
import HierarchyPanel from "../hierarchy/HierarchyPanel";
import ConnectivityPanel from "../connectivity/ConnectivityPanel";
import LevelOfDetailSelector from "../level-of-detail/LevelOfDetailSelector";

interface SidebarProps {
  width?: number;
  activeTab?: number;
  onTabChange?: (tab: number) => void;
}

function Sidebar({
  width = 520,
  activeTab = 0,
  onTabChange,
}: SidebarProps) {
  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: "fixed", md: "sticky" },
        height: "100dvh",
        width: `${width}px`,
        top: 0,
        p: 2,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Typography level="title-lg">Common Model Viewer</Typography>
      </Box>
      <SearchBar />
      <LevelOfDetailSelector />
      <Tabs
        value={activeTab}
        onChange={(_, value) => onTabChange?.(value as number)}
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <TabList>
          <Tab>Attributes</Tab>
          <Tab>Filter & Color</Tab>
          <Tab>Hierarchy</Tab>
          <Tab>Connectivity</Tab>
        </TabList>
        <TabPanel
          value={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: activeTab === 0 ? 1 : "none",
            minHeight: activeTab === 0 ? 0 : "auto",
            overflow: "hidden",
            p: 0,
          }}
        >
          <AttributePanel />
        </TabPanel>
        <TabPanel value={1}>
          <ColouringPanel />
        </TabPanel>
        <TabPanel value={2}>
          <HierarchyPanel />
        </TabPanel>
        <TabPanel value={3}>
          <ConnectivityPanel />
        </TabPanel>
      </Tabs>
    </Sheet>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(Sidebar);
