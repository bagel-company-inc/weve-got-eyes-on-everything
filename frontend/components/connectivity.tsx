import * as React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Autocomplete from "@mui/joy/Autocomplete";
import Alert from "@mui/joy/Alert";
import Input from "@mui/joy/Input";
import IconButton from "@mui/joy/IconButton";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import { HierarchyView, addHierarchyToURL } from "./hierarchy";
import { API_URL } from "../api_url";

interface ConnectivityProps {
  hierarchyView: HierarchyView | null;
  pathFromNode?: string | null;
  setPathFromNode?: React.Dispatch<React.SetStateAction<string | null>>;
  pathToNode?: string | null;
  setPathToNode?: React.Dispatch<React.SetStateAction<string | null>>;
  pathFromInputValue?: string;
  setPathFromInputValue?: React.Dispatch<React.SetStateAction<string>>;
  pathToInputValue?: string;
  setPathToInputValue?: React.Dispatch<React.SetStateAction<string>>;
  excludedEdges?: string[];
  setExcludedEdges?: React.Dispatch<React.SetStateAction<string[]>>;
  pathNotFound?: boolean;
  pathLoading?: boolean;
}

export default function Connectivity({
  hierarchyView,
  pathFromNode = null,
  setPathFromNode,
  pathToNode = null,
  setPathToNode,
  pathFromInputValue = "",
  setPathFromInputValue,
  pathToInputValue = "",
  setPathToInputValue,
  excludedEdges = [],
  setExcludedEdges,
  pathNotFound = false,
  pathLoading = false,
}: ConnectivityProps) {
  const [fromOptions, setFromOptions] = React.useState<string[]>([]);
  const [toOptions, setToOptions] = React.useState<string[]>([]);
  const [fromLoading, setFromLoading] = React.useState(false);
  const [toLoading, setToLoading] = React.useState(false);

  // Sync input values with selected node values when they change externally
  React.useEffect(() => {
    if (pathFromNode !== null && setPathFromInputValue) {
      setPathFromInputValue(pathFromNode);
    }
  }, [pathFromNode, setPathFromInputValue]);

  React.useEffect(() => {
    if (pathToNode !== null && setPathToInputValue) {
      setPathToInputValue(pathToNode);
    }
  }, [pathToNode, setPathToInputValue]);

  // Fetch suggestions for "from" field
  React.useEffect(() => {
    const fetchSuggestions = async () => {
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
    const fetchSuggestions = async () => {
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

  if (!setPathFromNode || !setPathToNode) {
    return (
      <Alert color="warning" size="sm">
        Connectivity inputs are not available.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography level="title-md">Shortest Path</Typography>
      <Typography level="body-sm" sx={{ color: "text.secondary" }}>
        Find the shortest path between two nodes.
      </Typography>

      <Autocomplete
        options={fromOptions}
        loading={fromLoading}
        inputValue={pathFromInputValue}
        onInputChange={(_, newInputValue) => {
          if (setPathFromInputValue) {
            setPathFromInputValue(newInputValue);
          }
        }}
        onChange={(_, newValue) => {
          const selectedName = typeof newValue === "string" ? newValue : null;
          if (setPathFromNode) {
            setPathFromNode(selectedName);
          }
          if (selectedName && setPathFromInputValue) {
            setPathFromInputValue(selectedName);
          }
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
          if (setPathToInputValue) {
            setPathToInputValue(newInputValue);
          }
        }}
        onChange={(_, newValue) => {
          const selectedName = typeof newValue === "string" ? newValue : null;
          if (setPathToNode) {
            setPathToNode(selectedName);
          }
          if (selectedName && setPathToInputValue) {
            setPathToInputValue(selectedName);
          }
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
                  if (setExcludedEdges) {
                    const currentEdges =
                      excludedEdges.length === 0 ? [""] : excludedEdges;
                    const newEdges = [...currentEdges];
                    newEdges[index] = e.target.value;
                    setExcludedEdges(newEdges);
                  }
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
                    if (setExcludedEdges) {
                      const currentEdges =
                        excludedEdges.length === 0 ? [""] : excludedEdges;
                      const newEdges = currentEdges.filter(
                        (_, i) => i !== index,
                      );
                      setExcludedEdges(newEdges);
                    }
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
            if (setExcludedEdges) {
              const currentEdges =
                excludedEdges.length === 0 ? [""] : excludedEdges;
              setExcludedEdges([...currentEdges, ""]);
            }
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
          Path not found between these nodes
        </Alert>
      )}
    </Box>
  );
}
