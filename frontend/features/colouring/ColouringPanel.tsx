import * as React from "react";
import Box from "@mui/joy/Box";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useEffect, useMemo } from "react";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Typography from "@mui/joy/Typography";
import ColorPicker from "./ColorPicker";
import { useHierarchy, addHierarchyToURL } from "../../contexts/HierarchyContext";
import { useColouring } from "../../contexts/ColouringContext";
import { useSelection } from "../../contexts/SelectionContext";
import { API_URL } from "../../config/api";

export default function ColouringPanel() {
  const { hierarchyView } = useHierarchy();
  const { colouringContext, setCategory, updateColor } = useColouring();
  const { setSelectedAssets } = useSelection();

  const [columnNames, setColumnNames] = React.useState<string[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<string>(
    colouringContext.category,
  );
  const [categoryValues, setCategoryValues] = React.useState<
    (string | number)[]
  >(Object.keys(colouringContext.mapping));

  useEffect(() => {
    fetch(`${API_URL}column_names`)
      .then((response) => response.json())
      .then((data) => {
        if (!data) return;
        setColumnNames(data);
        // Only set to first column if there's no category already selected
        if (!colouringContext.category) {
          setSelectedValue(data[0]);
        }
      });
  }, [colouringContext.category]);

  // Sync selectedValue with colouringContext.category when it changes externally
  useEffect(() => {
    if (colouringContext.category && colouringContext.category !== selectedValue) {
      setSelectedValue(colouringContext.category);
    }
  }, [colouringContext.category]);

  // Sync categoryValues with colouringContext.mapping when it changes
  useEffect(() => {
    if (Object.keys(colouringContext.mapping).length > 0) {
      setCategoryValues(Object.keys(colouringContext.mapping));
    }
  }, [colouringContext.mapping]);

  const handleValueClick = React.useCallback(
    async (value: string | number) => {
      if (!selectedValue) return;

      try {
        const url = addHierarchyToURL(
          hierarchyView,
          `${API_URL}all_with_attribute?column=${encodeURIComponent(selectedValue)}&value=${encodeURIComponent(value)}`
        );
        const response = await fetch(url);
        const assetNames = await response.json();

        if (assetNames && Array.isArray(assetNames)) {
          setSelectedAssets(assetNames);
        }
      } catch (err) {
        console.error("Error fetching assets by attribute:", err);
      }
    },
    [selectedValue, hierarchyView, setSelectedAssets]
  );

  const categoryList = useMemo(() => {
    return (
      <List
        variant="outlined"
        sx={{
          borderRadius: "sm",
          maxHeight: "700px",
          overflow: "auto",
          p: 0,
        }}
      >
        {categoryValues.map((category) => (
          <React.Fragment key={category}>
            <ListItem
              sx={{
                display: "grid",
                gridTemplateColumns: "30px 1fr",
                alignItems: "left",
                gap: 1,
                px: 1,
                py: 1,
              }}
            >
              <ColorPicker
                colour={colouringContext.mapping[category]}
                onChange={(colour) => {
                  updateColor(category, colour);
                }}
              />
              <Typography
                level="title-sm"
                onClick={() => handleValueClick(category)}
                sx={{
                  color: "text.primary",
                  wordBreak: "break-word",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "background.level1",
                    borderRadius: "sm",
                  },
                }}
              >
                {`${category}`}
              </Typography>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  }, [categoryValues, colouringContext.mapping, handleValueClick, updateColor]);

  useEffect(() => {
    if (!selectedValue) return;

    const url = addHierarchyToURL(
      hierarchyView,
      `${API_URL}column_unique_values?column=${selectedValue}`,
    );

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setCategoryValues(data.slice(0, 50));
        setCategory(selectedValue);
      });
  }, [selectedValue, hierarchyView, setCategory]);

  return (
    <Box>
      <Typography level="title-md">Filter & Color By:</Typography>
      <Typography level="body-sm" sx={{ color: "text.secondary", mb: 1 }}>
        Select a column to color the map. Click on any value to filter assets.
      </Typography>
      <Select
        color="neutral"
        placeholder="Choose one…"
        value={selectedValue}
        onChange={(event, newValue) => {
          if (newValue) {
            setSelectedValue(newValue);
          }
        }}
      >
        {columnNames.map((column) => (
          <Option
            key={column}
            value={column}
            onClick={() => {
              setSelectedValue(column);
            }}
          >
            {column}
          </Option>
        ))}
      </Select>
      {categoryList}
    </Box>
  );
}
