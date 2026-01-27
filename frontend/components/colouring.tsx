import * as React from "react";
import Box from "@mui/joy/Box";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useEffect, useMemo } from "react";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Typography from "@mui/joy/Typography";
import ColorfulPopup from "./colourful_popup";
import { HierarchyView, addHierarchyToURL } from "./hierarchy";
import { API_URL } from "../api_url";

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export type ColouringContext = {
  category: string;
  mapping: Record<string | number, string>;
};

interface ColouringProps {
  colouringContext: ColouringContext;
  setColouringContext: React.Dispatch<React.SetStateAction<ColouringContext>>;
  hierarchyView: HierarchyView | null;
  onSelectAssetsByValue?: (assetNames: string[]) => void;
}

enum ColourPreset {
  VOLTAGE,
  OTHER,
}

const VOLTAGE_COLOUR_PRESET: Record<number, string> = {
  415: "#6fdd50",
  3300: "#8bb01c",
  6600: "#edbd0e",
  11000: "#e86033",
  22000: "#0eaaed",
};

export function Colouring({
  colouringContext,
  setColouringContext,
  hierarchyView,
  onSelectAssetsByValue,
}: ColouringProps) {
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
      if (!selectedValue || !onSelectAssetsByValue) return;

      try {
        const url = addHierarchyToURL(
          hierarchyView,
          `${API_URL}all_with_attribute?column=${encodeURIComponent(selectedValue)}&value=${encodeURIComponent(value)}`
        );
        const response = await fetch(url);
        const assetNames = await response.json();
        
        if (assetNames && Array.isArray(assetNames)) {
          onSelectAssetsByValue(assetNames);
        }
      } catch (err) {
        console.error("Error fetching assets by attribute:", err);
      }
    },
    [selectedValue, onSelectAssetsByValue, hierarchyView]
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
                gridTemplateColumns: "30px 1fr", // left/right column ratio
                alignItems: "left",
                gap: 1,
                px: 1,
                py: 1,
              }}
            >
              <ColorfulPopup
                colour={colouringContext.mapping[category]}
                onChange={(colour) => {
                  setColouringContext({
                    category: colouringContext.category,
                    mapping: {
                      ...colouringContext.mapping,
                      [category]: colour,
                    },
                  });
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
  }, [categoryValues, colouringContext, handleValueClick]);

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

        const newCategoryColours: Record<string | number, string> = {};

        let colour_preset: ColourPreset = ColourPreset.OTHER;
        if (selectedValue.includes("voltage")) {
          colour_preset = ColourPreset.VOLTAGE;
        }

        const differences = 12;

        for (let i = 0; i < data.length; i++) {
          if (
            colour_preset === ColourPreset.VOLTAGE &&
            data[i] in VOLTAGE_COLOUR_PRESET
          ) {
            newCategoryColours[data[i]] = VOLTAGE_COLOUR_PRESET[data[i]];
            continue;
          }

          let percent = i / data.length;
          let angle = percent * 360;

          let mod = i % differences;
          angle = (angle + (360 / differences) * mod) % 360;

          newCategoryColours[data[i]] = hslToHex(angle, 80, 50);
        }

        setColouringContext({
          category: selectedValue,
          mapping: newCategoryColours,
        });
      });
  }, [selectedValue, hierarchyView]);

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
        onChange={(event) => setSelectedValue(event.target.value)}
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
