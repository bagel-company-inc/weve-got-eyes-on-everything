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
  setPathEdges?: React.Dispatch<React.SetStateAction<Set<string>>>;
  setPathNotFound?: React.Dispatch<React.SetStateAction<boolean>>;
  setPathLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  floodFillNode?: string | null;
  setFloodFillNode?: React.Dispatch<React.SetStateAction<string | null>>;
  floodFillInputValue?: string;
  setFloodFillInputValue?: React.Dispatch<React.SetStateAction<string>>;
  floodFillExcludedEdges?: string[];
  setFloodFillExcludedEdges?: React.Dispatch<React.SetStateAction<string[]>>;
  setFloodFillEdges?: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFloodFillNotFound?: React.Dispatch<React.SetStateAction<boolean>>;
  setFloodFillLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  onClearShortestPath?: () => void;
  onClearFloodFill?: () => void;
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
  setPathEdges,
  setPathNotFound,
  setPathLoading,
  floodFillNode = null,
  setFloodFillNode,
  floodFillInputValue = "",
  setFloodFillInputValue,
  floodFillExcludedEdges = [],
  setFloodFillExcludedEdges,
  setFloodFillEdges,
  setFloodFillNotFound,
  setFloodFillLoading,
  onClearShortestPath,
  onClearFloodFill,
}: ConnectivityProps) {
  const [fromOptions, setFromOptions] = React.useState<string[]>([]);
  const [toOptions, setToOptions] = React.useState<string[]>([]);
  const [fromLoading, setFromLoading] = React.useState(false);
  const [toLoading, setToLoading] = React.useState(false);
  const [floodFillOptions, setFloodFillOptions] = React.useState<string[]>([]);
  const [floodFillOptionsLoading, setFloodFillOptionsLoading] = React.useState(false);
  const [pathLoading, setPathLoadingLocal] = React.useState(false);
  const [pathNotFound, setPathNotFoundLocal] = React.useState(false);
  const [floodFillLoading, setFloodFillLoadingLocal] = React.useState(false);
  const [floodFillNotFound, setFloodFillNotFoundLocal] = React.useState(false);

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

  // Sync flood fill input value with selected node value when it changes externally
  React.useEffect(() => {
    if (floodFillNode !== null && setFloodFillInputValue) {
      setFloodFillInputValue(floodFillNode);
    }
  }, [floodFillNode, setFloodFillInputValue]);

  // Fetch suggestions for flood fill field
  React.useEffect(() => {
    const fetchSuggestions = async () => {
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

  // Fetch shortest path when both input fields have values
  React.useEffect(() => {
    if (!setPathEdges || !setPathNotFound || !setPathLoading) {
      return;
    }

    // Reset state immediately when inputs change
    setPathNotFoundLocal(false);
    setPathLoadingLocal(false);
    if (setPathNotFound) setPathNotFound(false);
    if (setPathLoading) setPathLoading(false);
    if (setPathEdges) setPathEdges(new Set());

    if (
      pathFromInputValue.trim() &&
      pathToInputValue.trim() &&
      pathFromInputValue.trim() !== pathToInputValue.trim()
    ) {
      setPathLoadingLocal(true);
      setPathNotFoundLocal(false);
      if (setPathLoading) setPathLoading(true);
      if (setPathNotFound) setPathNotFound(false);
      let url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}shortest_path?a=${encodeURIComponent(pathFromInputValue.trim())}&b=${encodeURIComponent(pathToInputValue.trim())}`,
      );
      if (excludedEdges.length > 0) {
        const excludedString = excludedEdges
          .map((edge) => edge.trim())
          .filter((edge) => edge.length > 0)
          .join(",");
        if (excludedString) {
          url += `&exclude=${encodeURIComponent(excludedString)}`;
        }
      }

      const abortController = new AbortController();

      fetch(url, { signal: abortController.signal })
        .then((response) => response.json())
        .then((data: string[]) => {
          // Only update state if this request hasn't been aborted
          if (!abortController.signal.aborted) {
            const notFound = data.length === 0;
            setPathNotFoundLocal(notFound);
            setPathLoadingLocal(false);
            if (setPathEdges) setPathEdges(new Set(data));
            if (setPathNotFound) setPathNotFound(notFound);
            if (setPathLoading) setPathLoading(false);
          }
        })
        .catch((err) => {
          // Ignore abort errors
          if (err.name === "AbortError") {
            return;
          }
          console.error("Error getting shortest path:", err);
          if (!abortController.signal.aborted) {
            setPathNotFoundLocal(false);
            setPathLoadingLocal(false);
            if (setPathEdges) setPathEdges(new Set());
            if (setPathNotFound) setPathNotFound(false);
            if (setPathLoading) setPathLoading(false);
          }
        });

      // Cleanup: abort the request if inputs change before it completes
      return () => {
        abortController.abort();
      };
    }
  }, [pathFromInputValue, pathToInputValue, excludedEdges, hierarchyView, setPathEdges, setPathNotFound, setPathLoading]);

  // Fetch flood fill when input field has a value
  React.useEffect(() => {
    if (!setFloodFillEdges || !setFloodFillNotFound || !setFloodFillLoading) {
      return;
    }

    // Reset state immediately when input changes
    setFloodFillNotFoundLocal(false);
    setFloodFillLoadingLocal(false);
    if (setFloodFillNotFound) setFloodFillNotFound(false);
    if (setFloodFillLoading) setFloodFillLoading(false);
    if (setFloodFillEdges) setFloodFillEdges(new Set());

    if (floodFillInputValue.trim()) {
      setFloodFillLoadingLocal(true);
      setFloodFillNotFoundLocal(false);
      if (setFloodFillLoading) setFloodFillLoading(true);
      if (setFloodFillNotFound) setFloodFillNotFound(false);
      let url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}flood_fill?node=${encodeURIComponent(floodFillInputValue.trim())}`,
      );
      if (floodFillExcludedEdges.length > 0) {
        const excludedString = floodFillExcludedEdges
          .map((edge) => edge.trim())
          .filter((edge) => edge.length > 0)
          .join(",");
        if (excludedString) {
          url += `&exclude=${encodeURIComponent(excludedString)}`;
        }
      }

      const abortController = new AbortController();

      fetch(url, { signal: abortController.signal })
        .then((response) => response.json())
        .then((data: string[]) => {
          // Only update state if this request hasn't been aborted
          if (!abortController.signal.aborted) {
            const notFound = data.length === 0;
            setFloodFillNotFoundLocal(notFound);
            setFloodFillLoadingLocal(false);
            if (setFloodFillEdges) setFloodFillEdges(new Set(data));
            if (setFloodFillNotFound) setFloodFillNotFound(notFound);
            if (setFloodFillLoading) setFloodFillLoading(false);
          }
        })
        .catch((err) => {
          // Ignore abort errors
          if (err.name === "AbortError") {
            return;
          }
          console.error("Error getting flood fill:", err);
          if (!abortController.signal.aborted) {
            setFloodFillNotFoundLocal(false);
            setFloodFillLoadingLocal(false);
            if (setFloodFillEdges) setFloodFillEdges(new Set());
            if (setFloodFillNotFound) setFloodFillNotFound(false);
            if (setFloodFillLoading) setFloodFillLoading(false);
          }
        });

      // Cleanup: abort the request if input changes before it completes
      return () => {
        abortController.abort();
      };
    }
  }, [floodFillInputValue, floodFillExcludedEdges, hierarchyView, setFloodFillEdges, setFloodFillNotFound, setFloodFillLoading]);

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography level="title-md">Shortest Path</Typography>
        {onClearShortestPath && (pathFromNode || pathToNode) && (
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={onClearShortestPath}
            title="Clear path"
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
          {onClearFloodFill && floodFillNode && (
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={onClearFloodFill}
              title="Clear flood fill"
            >
              <Clear />
            </IconButton>
          )}
        </Box>
        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
          Find all edges reachable from a starting node.
        </Typography>

        {!setFloodFillNode ? (
          <Alert color="warning" size="sm">
            Flood fill input is not available.
          </Alert>
        ) : (
          <>
            <Autocomplete
              options={floodFillOptions}
              loading={floodFillOptionsLoading}
              inputValue={floodFillInputValue}
              onInputChange={(_, newInputValue) => {
                if (setFloodFillInputValue) {
                  setFloodFillInputValue(newInputValue);
                }
              }}
              onChange={(_, newValue) => {
                const selectedName = typeof newValue === "string" ? newValue : null;
                if (setFloodFillNode) {
                  setFloodFillNode(selectedName);
                }
                if (selectedName && setFloodFillInputValue) {
                  setFloodFillInputValue(selectedName);
                }
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
                        if (setFloodFillExcludedEdges) {
                          const currentEdges =
                            floodFillExcludedEdges.length === 0 ? [""] : floodFillExcludedEdges;
                          const newEdges = [...currentEdges];
                          newEdges[index] = e.target.value;
                          setFloodFillExcludedEdges(newEdges);
                        }
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
                          if (setFloodFillExcludedEdges) {
                            const currentEdges =
                              floodFillExcludedEdges.length === 0 ? [""] : floodFillExcludedEdges;
                            const newEdges = currentEdges.filter(
                              (_, i) => i !== index,
                            );
                            setFloodFillExcludedEdges(newEdges);
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
                  if (setFloodFillExcludedEdges) {
                    const currentEdges =
                      floodFillExcludedEdges.length === 0 ? [""] : floodFillExcludedEdges;
                    setFloodFillExcludedEdges([...currentEdges, ""]);
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
          </>
        )}
      </Box>
    </Box>
  );
}
