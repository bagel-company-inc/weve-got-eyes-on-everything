import * as React from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Typography from "@mui/joy/Typography";
import { API_URL } from "../../config/api";
import { useMap } from "../../contexts/MapContext";

function LevelOfDetailSelector() {
  const { levelOfDetail, setLevelOfDetail } = useMap();
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
            variant={levelOfDetail === (option === "Auto" ? null : option) ? "solid" : "outlined"}
            color={levelOfDetail === (option === "Auto" ? null : option) ? "primary" : "neutral"}
            onClick={() => setLevelOfDetail(option === "Auto" ? null : option)}
            sx={{ flex: 1, minWidth: "60px" }}
          >
            {option}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(LevelOfDetailSelector);
