import * as React from "react";
import Box from "@mui/joy/Box";
import { Typography } from "@mui/joy";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import Divider from "@mui/joy/Divider";

interface AttributeListProps {
  attributeData: Record<string, any> | null;
}

export default function AttributeList({ attributeData }: AttributeListProps) {
  if (!attributeData) {
    return (
      <Box className="AttributeList" sx={{ mt: 2 }}>
        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
          Click on a feature on the map to view attributes
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="AttributeList" sx={{ mt: 2 }}>
      <Typography level="title-md" sx={{ mb: 1 }}>
        Attributes
      </Typography>
      <List
        variant="outlined"
        sx={{
          borderRadius: "sm",
          maxHeight: "400px",
          overflow: "auto",
        }}
      >
        {Object.entries(attributeData).map(([key, value], index) => (
          <React.Fragment key={key}>
            <ListItem>
              <ListItemContent>
                <Typography level="title-sm">{key}</Typography>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  {value !== null && value !== undefined ? String(value) : "—"}
                </Typography>
              </ListItemContent>
            </ListItem>
            {index < Object.entries(attributeData).length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}
