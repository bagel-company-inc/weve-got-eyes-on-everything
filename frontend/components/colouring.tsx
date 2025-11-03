import * as React from "react";
import Box from "@mui/joy/Box";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useEffect, useMemo } from "react";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Typography from "@mui/joy/Typography";
import ColorfulPopup from "./colourful_popup";

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

type ColourMapping = {
  [category: string | number]: string;
};

export type ColouringContext = {
  category: string;
  mapping: ColourMapping;
};

interface ColouringProps {
  colouringContext: ColouringContext;
  setColouringContext: (prev: ColouringContext) => void;
}

export function Colouring({
  colouringContext,
  setColouringContext,
}: ColouringProps) {
  const [columnNames, setColumnNames] = React.useState<string[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<string>("");
  const [categoryValues, setCategoryValues] = React.useState<
    (string | number)[]
  >([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/column_names")
      .then((response) => response.json())
      .then((data) => {
        if (!data) return;
        setColumnNames(data);
        setSelectedValue(data[0]);
      });
  }, []);

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
                sx={{ color: "text.primary", wordBreak: "break-word" }}
              >
                {`${category}`}
              </Typography>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  }, [categoryValues, colouringContext]);

  return (
    <Box>
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
              fetch(
                `http://127.0.0.1:5000/api/column_unique_values?column=${column}`
              )
                .then((response) => response.json())
                .then((data) => {
                  setCategoryValues(data.slice(0, 50));
                  const newCategoryColours = {};
                  let differences = 5;
                  for (let i = 0; i < data.length; i++) {
                    let percent = i / data.length;
                    let angle = percent * 360;

                    let mod = i % differences;
                    angle += (360 / differences) * mod;
                    angle %= 360;
                    let hexColor = hslToHex(angle, 80, 50);
                    newCategoryColours[data[i]] = hexColor;
                  }
                  setColouringContext({
                    category: column,
                    mapping: newCategoryColours,
                  });
                });
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
