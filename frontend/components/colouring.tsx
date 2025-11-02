import * as React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useEffect } from "react";

export default function Colouring() {
  const [columnNames, setColumnNames] = React.useState<string[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<string>("");
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/column_names")
      .then((response) => response.json())
      .then((data) => {
        if (!data) return;
        setColumnNames(data);
        setSelectedValue(data[0]);
      });
  }, []);

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
                  console.log(data);
                });
            }}
          >
            {column}
          </Option>
        ))}
      </Select>
    </Box>
  );
}
