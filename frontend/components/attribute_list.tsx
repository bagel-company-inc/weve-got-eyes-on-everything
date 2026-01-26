import * as React from "react";
import Box from "@mui/joy/Box";
import { Typography } from "@mui/joy";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Divider from "@mui/joy/Divider";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import Delete from "@mui/icons-material/Delete";
import Clear from "@mui/icons-material/Clear";
import CropFree from "@mui/icons-material/CropFree";
import { API_URL } from "../api_url";

interface AttributeListProps {
  attributeData: Record<string, any> | null;
  selectedAssets?: string[];
  setSelectedAssets?: React.Dispatch<React.SetStateAction<string[]>>;
  viewedAssetName?: string | null;
  setViewedAssetName?: React.Dispatch<React.SetStateAction<string | null>>;
  onFetchAttributes?: (name: string) => void;
  boxSelectionMode?: boolean;
  setBoxSelectionMode?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AttributeList({
  attributeData,
  selectedAssets = [],
  setSelectedAssets,
  viewedAssetName,
  setViewedAssetName,
  onFetchAttributes,
  boxSelectionMode = false,
  setBoxSelectionMode,
}: AttributeListProps) {
  const handleAssetClick = React.useCallback(
    (name: string) => {
      if (setViewedAssetName) {
        setViewedAssetName(name);
      }
      if (onFetchAttributes) {
        onFetchAttributes(name);
      } else {
        // Fallback: fetch with a default large bbox (covers New Zealand area)
        fetch(
          `${API_URL}attributes?name=${encodeURIComponent(name)}&bbox=${defaultBbox}`,
        )
          .then((response) => response.json())
          .then((data) => {
            // This won't update attributeData without a callback
            console.log("Fetched attributes:", data);
          })
          .catch((err) => console.error("Error getting attributes:", err));
      }
    },
    [setViewedAssetName, onFetchAttributes],
  );

  const handleClearAll = React.useCallback(() => {
    if (setSelectedAssets) {
      setSelectedAssets([]);
    }
    // Don't clear viewedAssetName - keep the attribute list visible
  }, [setSelectedAssets]);

  return (
    <Box
      className="AttributeList"
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 2,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography level="title-md">
          {selectedAssets.length > 0
            ? `Selected Assets (${selectedAssets.length})`
            : "Attributes"}
        </Typography>
        <Button
          size="sm"
          variant={boxSelectionMode ? "solid" : "outlined"}
          color={boxSelectionMode ? "primary" : "neutral"}
          startDecorator={<CropFree />}
          onClick={() => setBoxSelectionMode?.(!boxSelectionMode)}
        >
          {boxSelectionMode ? "Box Select (Active)" : "Box Select"}
        </Button>
      </Box>
      {selectedAssets.length > 0 ? (
        <>
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                {selectedAssets.length} asset
                {selectedAssets.length !== 1 ? "s" : ""} selected
              </Typography>
              {selectedAssets.length > 0 && (
                <IconButton
                  size="sm"
                  variant="plain"
                  color="neutral"
                  onClick={handleClearAll}
                  title="Clear all selected assets"
                >
                  <Clear />
                </IconButton>
              )}
            </Box>
            <Sheet
              variant="outlined"
              sx={{
                borderRadius: "sm",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <Table
                sx={{
                  "& tbody tr:hover": {
                    backgroundColor: "background.level1",
                    cursor: "pointer",
                  },
                  "& tbody tr[aria-selected='true']": {
                    backgroundColor: "primary.50",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>#</th>
                    <th>Asset Name</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAssets.map((name, index) => (
                    <tr
                      key={name}
                      onClick={() => handleAssetClick(name)}
                      aria-selected={viewedAssetName === name}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <Typography level="body-sm">{name}</Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
          </Box>
        </>
      ) : (
        <Typography
          level="body-sm"
          sx={{ color: "text.secondary" }}
        ></Typography>
      )}

      {attributeData && viewedAssetName && (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <List
            variant="outlined"
            sx={{
              borderRadius: "sm",
              flex: 1,
              overflow: "auto",
              p: 0,
            }}
          >
            {Object.entries(attributeData).map(([key, value], index) => (
              <React.Fragment key={key}>
                <ListItem
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
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
                    {value !== null && value !== undefined
                      ? String(value)
                      : "—"}
                  </Typography>
                </ListItem>
                {index < Object.entries(attributeData).length - 1 && (
                  <Divider />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {!viewedAssetName && selectedAssets.length > 0 && (
        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
          Click on an asset above to view its attributes
        </Typography>
      )}
    </Box>
  );
}
