import * as React from "react";
import GlobalStyles from "@mui/joy/GlobalStyles";
import Box from "@mui/joy/Box";
import Tab from "@mui/joy/Tab";
import Tabs from "@mui/joy/Tabs";
import TabList from "@mui/joy/TabList";
import TabPanel from "@mui/joy/TabPanel";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";

import AttributeList from "./attribute_list";
import Colouring from "./colouring";
import SearchBar from "./search_bar";

interface SidebarProps {
  attributeData: Record<string, any> | null;
}

export default function Sidebar({ attributeData }: SidebarProps) {
  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: "fixed", md: "sticky" },
        zIndex: 10000,
        height: "100dvh",
        width: "var(--Sidebar-width)",
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
      <GlobalStyles
        styles={(theme) => ({
          ":root": {
            "--Sidebar-width": "240px",
            [theme.breakpoints.up("lg")]: {
              "--Sidebar-width": "260px",
            },
          },
        })}
      />

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Typography level="title-lg">Common Model Viewer</Typography>
      </Box>
      <Tabs>
        <TabList>
          <Tab>Search</Tab>
          <Tab>Colouring</Tab>
        </TabList>
        <TabPanel value={0}>
          <SearchBar />
          <AttributeList attributeData={attributeData} />
        </TabPanel>
        <TabPanel value={1}>
          <Colouring />
        </TabPanel>
      </Tabs>
    </Sheet>
  );
}
