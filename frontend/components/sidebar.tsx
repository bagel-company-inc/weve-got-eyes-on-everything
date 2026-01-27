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
import LevelOfDetailSelector from "./level_of_detail_selector";

interface SidebarProps {
  attributeData: Record<string, any> | null;
  searchBarSelectionChange?: (name: string | null) => void;
  selectedName?: string | null;
  selectedAssets?: string[];
  setSelectedAssets?: React.Dispatch<React.SetStateAction<string[]>>;
  viewedAssetName?: string | null;
  setViewedAssetName?: React.Dispatch<React.SetStateAction<string | null>>;
  onFetchAttributes?: (name: string) => void;
  boxSelectionMode?: boolean;
  setBoxSelectionMode?: React.Dispatch<React.SetStateAction<boolean>>;
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
  setPathEdges?: React.Dispatch<React.SetStateAction<Set<string>>>;
  setPathNotFound?: React.Dispatch<React.SetStateAction<boolean>>;
  setPathLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  floodFillNode?: string | null;
  setFloodFillNode?: React.Dispatch<React.SetStateAction<string | null>>;
  floodFillInputValue?: string;
  setFloodFillInputValue?: React.Dispatch<React.SetStateAction<string>>;
  floodFillExcludedEdges?: string[];
  setFloodFillExcludedEdges?: React.Dispatch<React.SetStateAction<string[]>>;
  setFloodFillEdges?: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFloodFillNotFound?: React.Dispatch<React.SetStateAction<boolean>>;
  setFloodFillLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  onClearShortestPath?: () => void;
  onClearFloodFill?: () => void;
  activeTab?: number;
  setActiveTab?: React.Dispatch<React.SetStateAction<number>>;
  levelOfDetail?: string | null;
  setLevelOfDetail?: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function Sidebar({
  attributeData,
  searchBarSelectionChange,
  selectedName,
  selectedAssets = [],
  setSelectedAssets,
  viewedAssetName,
  setViewedAssetName,
  onFetchAttributes,
  boxSelectionMode = false,
  setBoxSelectionMode,
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
  setPathEdges,
  setPathNotFound,
  setPathLoading,
  floodFillNode = null,
  setFloodFillNode,
  floodFillInputValue = "",
  setFloodFillInputValue,
  floodFillExcludedEdges = [],
  setFloodFillExcludedEdges,
  setFloodFillEdges,
  setFloodFillNotFound,
  setFloodFillLoading,
  onClearShortestPath,
  onClearFloodFill,
  activeTab = 0,
  setActiveTab,
  levelOfDetail = null,
  setLevelOfDetail,
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
      <LevelOfDetailSelector
        selectedDetail={levelOfDetail}
        onDetailChange={setLevelOfDetail}
      />
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab?.(value as number)}
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          flex: 1,
          minHeight: 0,
        }}
      >
        <TabList>
          <Tab>Attributes</Tab>
          <Tab>Colouring</Tab>
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
            p: 0 
          }}
        >
          <AttributeList
            attributeData={attributeData}
            selectedAssets={selectedAssets}
            setSelectedAssets={setSelectedAssets}
            viewedAssetName={viewedAssetName}
            setViewedAssetName={setViewedAssetName}
            onFetchAttributes={onFetchAttributes}
            boxSelectionMode={boxSelectionMode}
            setBoxSelectionMode={setBoxSelectionMode}
          />
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
            onClearShortestPath={onClearShortestPath}
            onClearFloodFill={onClearFloodFill}
          />
        </TabPanel>
        </Tabs>
    </Sheet>
  );
}
