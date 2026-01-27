import * as React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Autocomplete from "@mui/joy/Autocomplete";
import Alert from "@mui/joy/Alert";
import Input from "@mui/joy/Input";
import IconButton from "@mui/joy/IconButton";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Clear from "@mui/icons-material/Clear";
import { useHierarchy, addHierarchyToURL } from "../../contexts/HierarchyContext";
import { useConnectivity } from "../../contexts/ConnectivityContext";
import { API_URL } from "../../config/api";

export default function ConnectivityPanel() {
  const { hierarchyView } = useHierarchy();
  const {
    pathFromInputValue,
    pathToInputValue,
    setPathFromInputValue,
    setPathToInputValue,
    excludedEdges,
    setExcludedEdges,
    pathLoading,
    pathNotFound,
    floodFillInputValue,
    setFloodFillInputValue,
    floodFillExcludedEdges,
    setFloodFillExcludedEdges,
    floodFillLoading,
    floodFillNotFound,
    clearShortestPath: clearShortestPathContext,
    clearFloodFill: clearFloodFillContext,
    pathFromNode,
    pathToNode,
    floodFillNode,
  } = useConnectivity();

  const [fromOptions, setFromOptions] = React.useState<string[]>([]);
  const [toOptions, setToOptions] = React.useState<string[]>([]);
  const [fromLoading, setFromLoading] = React.useState(false);
  const [toLoading, setToLoading] = React.useState(false);
  const [floodFillOptions, setFloodFillOptions] = React.useState<string[]>([]);
  const [floodFillOptionsLoading, setFloodFillOptionsLoading] = React.useState(false);

  // Enhanced clear functions that also clear local suggestion state
  const clearShortestPath = React.useCallback(() => {
    clearShortestPathContext();
    setFromOptions([]);
    setToOptions([]);
  }, [clearShortestPathContext]);

  const clearFloodFill = React.useCallback(() => {
    clearFloodFillContext();
    setFloodFillOptions([]);
  }, [clearFloodFillContext]);

  // Fetch suggestions for "from" field
  React.useEffect(() => {
    // Clear options immediately if input is too short
    if (pathFromInputValue.length < 2) {
      setFromOptions([]);
      return;
    }

    const fetchSuggestions = async () => {
      // Double-check the value hasn't changed
      if (pathFromInputValue.length < 2) {
        setFromOptions([]);
        return;
      }
      setFromLoading(true);
      const url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}search_complete?input=${encodeURIComponent(pathFromInputValue)}`,
      );
      try {
        const response = await fetch(url);
        const data = await response.json();
        setFromOptions(data.slice(0, 100));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setFromLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimeout);
  }, [pathFromInputValue, hierarchyView]);

  // Fetch suggestions for "to" field
  React.useEffect(() => {
    // Clear options immediately if input is too short
    if (pathToInputValue.length < 2) {
      setToOptions([]);
      return;
    }

    const fetchSuggestions = async () => {
      // Double-check the value hasn't changed
      if (pathToInputValue.length < 2) {
        setToOptions([]);
        return;
      }
      setToLoading(true);
      const url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}search_complete?input=${encodeURIComponent(pathToInputValue)}`,
      );
      try {
        const response = await fetch(url);
        const data = await response.json();
        setToOptions(data.slice(0, 100));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setToLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimeout);
  }, [pathToInputValue, hierarchyView]);

  // Fetch suggestions for flood fill field
  React.useEffect(() => {
    // Clear options immediately if input is too short
    if (floodFillInputValue.length < 2) {
      setFloodFillOptions([]);
      return;
    }

    const fetchSuggestions = async () => {
      // Double-check the value hasn't changed
      if (floodFillInputValue.length < 2) {
        setFloodFillOptions([]);
        return;
      }
      setFloodFillOptionsLoading(true);
      const url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}search_complete?input=${encodeURIComponent(floodFillInputValue)}`,
      );
      try {
        const response = await fetch(url);
        const data = await response.json();
        setFloodFillOptions(data.slice(0, 100));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setFloodFillOptionsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimeout);
  }, [floodFillInputValue, hierarchyView]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography level="title-md">Shortest Path</Typography>
        {(pathFromNode || pathToNode || pathFromInputValue || pathToInputValue || excludedEdges.length > 0) && (
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={clearShortestPath}
            title="Clear shortest path"
          >
            <Clear />
          </IconButton>
        )}
      </Box>
      <Typography level="body-sm" sx={{ color: "text.secondary" }}>
        Find the shortest path between two nodes.
      </Typography>

      <Autocomplete
        options={fromOptions}
        loading={fromLoading}
        inputValue={pathFromInputValue}
        onInputChange={(_, newInputValue) => {
          setPathFromInputValue(newInputValue);
        }}
        placeholder="From node..."
        size="sm"
        freeSolo
        filterOptions={(opts) => opts}
        getOptionLabel={(option) => (typeof option === "string" ? option : "")}
      />

      <Autocomplete
        options={toOptions}
        loading={toLoading}
        inputValue={pathToInputValue}
        onInputChange={(_, newInputValue) => {
          setPathToInputValue(newInputValue);
        }}
        placeholder="To node..."
        size="sm"
        freeSolo
        filterOptions={(opts) => opts}
        getOptionLabel={(option) => (typeof option === "string" ? option : "")}
      />

      <Box>
        <Typography level="body-sm" sx={{ mb: 0.5 }}>
          Excluded Edges
        </Typography>
        {(excludedEdges.length === 0 ? [""] : excludedEdges).map(
          (edge, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                gap: 0.5,
                mb: 0.5,
                alignItems: "center",
              }}
            >
              <Input
                value={edge}
                onChange={(e) => {
                  const currentEdges =
                    excludedEdges.length === 0 ? [""] : excludedEdges;
                  const newEdges = [...currentEdges];
                  newEdges[index] = e.target.value;
                  setExcludedEdges(newEdges);
                }}
                placeholder="Edge name..."
                size="sm"
                sx={{ flex: 1 }}
              />
              {(excludedEdges.length > 0 || index > 0) && (
                <IconButton
                  size="sm"
                  variant="plain"
                  color="danger"
                  onClick={() => {
                    const currentEdges =
                      excludedEdges.length === 0 ? [""] : excludedEdges;
                    const newEdges = currentEdges.filter(
                      (_, i) => i !== index,
                    );
                    setExcludedEdges(newEdges);
                  }}
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          ),
        )}
        <IconButton
          size="sm"
          variant="outlined"
          onClick={() => {
            const currentEdges =
              excludedEdges.length === 0 ? [""] : excludedEdges;
            setExcludedEdges([...currentEdges, ""]);
          }}
          sx={{ mt: 0.5 }}
        >
          <Add />
          <Typography level="body-xs" sx={{ ml: 0.5 }}>
            Add Edge
          </Typography>
        </IconButton>
      </Box>

      {pathLoading && (
        <Typography level="body-xs" sx={{ color: "text.secondary" }}>
          Finding path...
        </Typography>
      )}
      {pathNotFound && !pathLoading && (
        <Alert color="warning" size="sm">
          Path not found between these nodes. Make sure you have selected a GXP
          from the hierarchy selector, and are not searching the entire network.
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mt: 3,
          pt: 3,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography level="title-md">Flood Fill</Typography>
          {(floodFillNode || floodFillInputValue || floodFillExcludedEdges.length > 0) && (
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={clearFloodFill}
              title="Clear flood fill"
            >
              <Clear />
            </IconButton>
          )}
        </Box>
        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
          Find all edges reachable from a starting node.
        </Typography>

        <Autocomplete
          options={floodFillOptions}
          loading={floodFillOptionsLoading}
          inputValue={floodFillInputValue}
          onInputChange={(_, newInputValue) => {
            setFloodFillInputValue(newInputValue);
          }}
          placeholder="From node..."
          size="sm"
          freeSolo
          filterOptions={(opts) => opts}
          getOptionLabel={(option) => (typeof option === "string" ? option : "")}
        />

        <Box>
          <Typography level="body-sm" sx={{ mb: 0.5 }}>
            Excluded Edges
          </Typography>
          {(floodFillExcludedEdges.length === 0 ? [""] : floodFillExcludedEdges).map(
            (edge, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 0.5,
                  mb: 0.5,
                  alignItems: "center",
                }}
              >
                <Input
                  value={edge}
                  onChange={(e) => {
                    const currentEdges =
                      floodFillExcludedEdges.length === 0 ? [""] : floodFillExcludedEdges;
                    const newEdges = [...currentEdges];
                    newEdges[index] = e.target.value;
                    setFloodFillExcludedEdges(newEdges);
                  }}
                  placeholder="Edge name..."
                  size="sm"
                  sx={{ flex: 1 }}
                />
                {(floodFillExcludedEdges.length > 0 || index > 0) && (
                  <IconButton
                    size="sm"
                    variant="plain"
                    color="danger"
                    onClick={() => {
                      const currentEdges =
                        floodFillExcludedEdges.length === 0 ? [""] : floodFillExcludedEdges;
                      const newEdges = currentEdges.filter(
                        (_, i) => i !== index,
                      );
                      setFloodFillExcludedEdges(newEdges);
                    }}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ),
          )}
          <IconButton
            size="sm"
            variant="outlined"
            onClick={() => {
              const currentEdges =
                floodFillExcludedEdges.length === 0 ? [""] : floodFillExcludedEdges;
              setFloodFillExcludedEdges([...currentEdges, ""]);
            }}
            sx={{ mt: 0.5 }}
          >
            <Add />
            <Typography level="body-xs" sx={{ ml: 0.5 }}>
              Add Edge
            </Typography>
          </IconButton>
        </Box>

        {floodFillLoading && (
          <Typography level="body-xs" sx={{ color: "text.secondary" }}>
            Finding reachable edges...
          </Typography>
        )}
        {floodFillNotFound && !floodFillLoading && (
          <Alert color="warning" size="sm">
            No edges found. Make sure you have selected a GXP
            from the hierarchy selector, and are not searching the entire network.
          </Alert>
        )}
      </Box>
    </Box>
  );
}
