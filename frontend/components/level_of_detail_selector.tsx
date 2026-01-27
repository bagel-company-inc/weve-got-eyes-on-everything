import * as React from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Typography from "@mui/joy/Typography";
import { API_URL } from "../api_url";

interface LevelOfDetailSelectorProps {
  selectedDetail: string | null;
  onDetailChange: (detail: string | null) => void;
}

export default function LevelOfDetailSelector({
  selectedDetail,
  onDetailChange,
}: LevelOfDetailSelectorProps) {
  const [detailLevels, setDetailLevels] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch(`${API_URL}detail_levels`)
      .then((response) => response.json())
      .then((data) => {
        setDetailLevels(data);
      })
      .catch((err) => console.error("Error fetching detail levels:", err));
  }, []);

  const allOptions = ["Auto", ...detailLevels];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography level="body-sm" fontWeight="lg">
        Level of Detail
      </Typography>
      <ButtonGroup
        variant="outlined"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          "--ButtonGroup-radius": "8px",
        }}
      >
        {allOptions.map((option) => (
          <Button
            key={option}
            variant={selectedDetail === (option === "Auto" ? null : option) ? "solid" : "outlined"}
            color={selectedDetail === (option === "Auto" ? null : option) ? "primary" : "neutral"}
            onClick={() => onDetailChange(option === "Auto" ? null : option)}
            sx={{ flex: 1, minWidth: "60px" }}
          >
            {option}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}
