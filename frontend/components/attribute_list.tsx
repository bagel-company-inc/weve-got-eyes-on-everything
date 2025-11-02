import * as React from "react";
import Box from "@mui/joy/Box";
import { Typography } from "@mui/joy";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
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
          maxHeight: "700px",
          overflow: "auto",
          p: 0,
        }}
      >
        {Object.entries(attributeData).map(([key, value], index) => (
          <React.Fragment key={key}>
            <ListItem
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr", // left/right column ratio
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography
                level="title-sm"
                sx={{ color: "text.primary", wordBreak: "break-word" }}
              >
                {key}
              </Typography>

              <Typography
                level="body-sm"
                sx={{
                  color: "text.secondary",
                  textAlign: "right",
                  wordBreak: "break-word",
                }}
              >
                {value !== null && value !== undefined ? String(value) : "—"}
              </Typography>
            </ListItem>
            {index < Object.entries(attributeData).length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}
