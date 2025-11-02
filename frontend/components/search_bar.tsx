import * as React from "react";
import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import { listItemButtonClasses } from "@mui/joy/ListItemButton";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

export default function SearchBar() {
  return (
    <Box>
      <Input
        size="sm"
        startDecorator={<SearchRoundedIcon />}
        placeholder="Search"
      />
      <Box
        sx={{
          minHeight: 0,
          overflow: "hidden auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          [`& .${listItemButtonClasses.root}`]: {
            gap: 1.5,
          },
        }}
      ></Box>
    </Box>
  );
}
