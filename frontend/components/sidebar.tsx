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
import Connectivity from "./connectivity";

interface SidebarProps {
  attributeData: Record<string, any> | null;
  searchBarSelectionChange?: (name: string | null) => void;
  selectedName?: string | null;
  hierarchyView: HierarchyView | null;
  setHierarchyView?: (hierarchy_view: HierarchyView | null) => void;
  width?: number;
  colouringContext: ColouringContext;
  setColouringContext: React.Dispatch<React.SetStateAction<ColouringContext>>;
  pathFromNode?: string | null;
  setPathFromNode?: React.Dispatch<React.SetStateAction<string | null>>;
  pathToNode?: string | null;
  setPathToNode?: React.Dispatch<React.SetStateAction<string | null>>;
  pathFromInputValue?: string;
  setPathFromInputValue?: React.Dispatch<React.SetStateAction<string>>;
  pathToInputValue?: string;
  setPathToInputValue?: React.Dispatch<React.SetStateAction<string>>;
  excludedEdges?: string[];
  setExcludedEdges?: React.Dispatch<React.SetStateAction<string[]>>;
  pathNotFound?: boolean;
  pathLoading?: boolean;
  activeTab?: number;
  setActiveTab?: React.Dispatch<React.SetStateAction<number>>;
}

export default function Sidebar({
  attributeData,
  searchBarSelectionChange,
  selectedName,
  hierarchyView,
  setHierarchyView,
  width = 260,
  colouringContext,
  setColouringContext,
  pathFromNode = null,
  setPathFromNode,
  pathToNode = null,
  setPathToNode,
  pathFromInputValue = "",
  setPathFromInputValue,
  pathToInputValue = "",
  setPathToInputValue,
  excludedEdges = [],
  setExcludedEdges,
  pathNotFound = false,
  pathLoading = false,
  activeTab = 0,
  setActiveTab,
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
      <SearchBar
        onSelectionChange={searchBarSelectionChange}
        hierarchyView={hierarchyView}
      />
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab?.(value as number)}
      >
        <TabList>
          <Tab>Attributes</Tab>
          <Tab>Colouring</Tab>
          <Tab>Hierarchy</Tab>
          <Tab>Connectivity</Tab>
        </TabList>
        <TabPanel value={0}>
          <AttributeList attributeData={attributeData} />
        </TabPanel>
        <TabPanel value={1}>
          <Colouring
            colouringContext={colouringContext}
            setColouringContext={setColouringContext}
            hierarchyView={hierarchyView}
          />
        </TabPanel>
        <TabPanel value={2}>
          <Hierarchy
            onSelectionChange={setHierarchyView}
            selectedName={selectedName}
          />
        </TabPanel>
        <TabPanel value={3}>
          <Connectivity
            hierarchyView={hierarchyView}
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
          />
        </TabPanel>
      </Tabs>
    </Sheet>
  );
}
