import * as React from "react";
import Box from "@mui/joy/Box";
import Tab from "@mui/joy/Tab";
import Tabs from "@mui/joy/Tabs";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";

import AttributeList from "./attribute_list";
import { Colouring, ColouringContext } from "./colouring";
import SearchBar from "./search_bar";
import Hierarchy from "./hierarchy";
import { HierarchyView } from "./hierarchy";

interface SidebarProps {
  attributeData: Record<string, any> | null;
  searchBarSelectionChange?: (name: string | null) => void;
  selectedName?: string | null;
  setHierarchyView?: (hierarchy_view: HierarchyView | null) => void;
  width?: number;
  colouringContext: ColouringContext;
  setColouringContext: React.Dispatch<React.SetStateAction<ColouringContext>>;
}

export default function Sidebar({
  attributeData,
  searchBarSelectionChange,
  selectedName,
  setHierarchyView,
  width = 260,
  colouringContext,
  setColouringContext,
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
      <SearchBar onSelectionChange={searchBarSelectionChange} />
      <Tabs>
        <TabList>
          <Tab>Attributes</Tab>
          <Tab>Colouring</Tab>
          <Tab>Hierarchy</Tab>
        </TabList>
        <TabPanel value={0}>
          <AttributeList attributeData={attributeData} />
        </TabPanel>
        <TabPanel value={1}>
          <Colouring
            colouringContext={colouringContext}
            setColouringContext={setColouringContext}
          />
        </TabPanel>
        <TabPanel value={2}>
          <Hierarchy
            onSelectionChange={setHierarchyView}
            selectedName={selectedName}
          />
        </TabPanel>
      </Tabs>
    </Sheet>
  );
}
