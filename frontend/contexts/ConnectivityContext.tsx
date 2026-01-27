import * as React from "react";
import { API_URL } from "../config/api";
import { useHierarchy, addHierarchyToURL } from "./HierarchyContext";

interface ConnectivityContextType {
  // Shortest path state
  pathFromNode: string | null;
  pathToNode: string | null;
  pathEdges: Set<string>;
  excludedEdges: string[];
  pathLoading: boolean;
  pathNotFound: boolean;
  pathFromInputValue: string;
  pathToInputValue: string;

  // Flood fill state
  floodFillNode: string | null;
  floodFillEdges: Set<string>;
  floodFillExcludedEdges: string[];
  floodFillLoading: boolean;
  floodFillNotFound: boolean;
  floodFillInputValue: string;

  // Combined edges for map
  allHighlightedEdges: Set<string>;

  // Shortest path actions
  setPathFromNode: (node: string | null) => void;
  setPathToNode: (node: string | null) => void;
  setPathFromInputValue: (value: string) => void;
  setPathToInputValue: (value: string) => void;
  setExcludedEdges: (edges: string[]) => void;
  clearShortestPath: () => void;

  // Flood fill actions
  setFloodFillNode: (node: string | null) => void;
  setFloodFillInputValue: (value: string) => void;
  setFloodFillExcludedEdges: (edges: string[]) => void;
  clearFloodFill: () => void;
}

const ConnectivityContext = React.createContext<
  ConnectivityContextType | undefined
>(undefined);

export function ConnectivityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shortest path state
  const [pathFromNode, setPathFromNodeState] = React.useState<string | null>(null);
  const [pathToNode, setPathToNodeState] = React.useState<string | null>(null);
  const [pathFromInputValue, setPathFromInputValueState] = React.useState("");
  const [pathToInputValue, setPathToInputValueState] = React.useState("");
  const [excludedEdges, setExcludedEdgesState] = React.useState<string[]>([]);
  const [pathEdges, setPathEdges] = React.useState<Set<string>>(new Set());
  const [pathNotFound, setPathNotFound] = React.useState(false);
  const [pathLoading, setPathLoading] = React.useState(false);

  // Flood fill state
  const [floodFillNode, setFloodFillNodeState] = React.useState<string | null>(null);
  const [floodFillInputValue, setFloodFillInputValueState] = React.useState("");
  const [floodFillExcludedEdges, setFloodFillExcludedEdgesState] = React.useState<
    string[]
  >([]);
  const [floodFillEdges, setFloodFillEdges] = React.useState<Set<string>>(
    new Set(),
  );
  const [floodFillNotFound, setFloodFillNotFound] = React.useState(false);
  const [floodFillLoading, setFloodFillLoading] = React.useState(false);

  const { hierarchyView } = useHierarchy();

  // Wrap setters in useCallback to prevent unnecessary re-renders
  const setPathFromNode = React.useCallback((node: string | null) => {
    setPathFromNodeState(node);
  }, []);

  const setPathToNode = React.useCallback((node: string | null) => {
    setPathToNodeState(node);
  }, []);

  const setPathFromInputValue = React.useCallback((value: string) => {
    setPathFromInputValueState(value);
  }, []);

  const setPathToInputValue = React.useCallback((value: string) => {
    setPathToInputValueState(value);
  }, []);

  const setExcludedEdges = React.useCallback((edges: string[]) => {
    setExcludedEdgesState(edges);
  }, []);

  const setFloodFillNode = React.useCallback((node: string | null) => {
    setFloodFillNodeState(node);
  }, []);

  const setFloodFillInputValue = React.useCallback((value: string) => {
    setFloodFillInputValueState(value);
  }, []);

  const setFloodFillExcludedEdges = React.useCallback((edges: string[]) => {
    setFloodFillExcludedEdgesState(edges);
  }, []);

  // Fetch shortest path when both inputs have values
  React.useEffect(() => {
    // Reset state immediately when inputs change
    setPathNotFound(false);
    setPathLoading(false);
    setPathEdges(new Set());

    const pathFromValue = pathFromInputValue;
    const pathToValue = pathToInputValue;

    if (
      pathFromValue.trim() &&
      pathToValue.trim() &&
      pathFromValue.trim() !== pathToValue.trim()
    ) {
      setPathLoading(true);
      setPathNotFound(false);

      let url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}shortest_path?a=${encodeURIComponent(pathFromValue.trim())}&b=${encodeURIComponent(pathToValue.trim())}`,
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
          if (!abortController.signal.aborted) {
            const notFound = data.length === 0;
            setPathNotFound(notFound);
            setPathLoading(false);
            setPathEdges(new Set(data));
          }
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          console.error("Error getting shortest path:", err);
          if (!abortController.signal.aborted) {
            setPathNotFound(false);
            setPathLoading(false);
            setPathEdges(new Set());
          }
        });

      return () => {
        abortController.abort();
      };
    }
  }, [pathFromInputValue, pathToInputValue, excludedEdges, hierarchyView]);

  // Fetch flood fill when input has a value
  React.useEffect(() => {
    // Reset state immediately when input changes
    setFloodFillNotFound(false);
    setFloodFillLoading(false);
    setFloodFillEdges(new Set());

    const floodFillValue = floodFillInputValue;

    if (floodFillValue.trim()) {
      setFloodFillLoading(true);
      setFloodFillNotFound(false);

      let url = addHierarchyToURL(
        hierarchyView,
        `${API_URL}flood_fill?node=${encodeURIComponent(floodFillValue.trim())}`,
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
          if (!abortController.signal.aborted) {
            const notFound = data.length === 0;
            setFloodFillNotFound(notFound);
            setFloodFillLoading(false);
            setFloodFillEdges(new Set(data));
          }
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          console.error("Error getting flood fill:", err);
          if (!abortController.signal.aborted) {
            setFloodFillNotFound(false);
            setFloodFillLoading(false);
            setFloodFillEdges(new Set());
          }
        });

      return () => {
        abortController.abort();
      };
    }
  }, [floodFillInputValue, floodFillExcludedEdges, hierarchyView]);

  const clearShortestPath = React.useCallback(() => {
    setPathFromNodeState(null);
    setPathToNodeState(null);
    setPathEdges(new Set());
    setPathNotFound(false);
    setPathLoading(false);
    setPathFromInputValueState("");
    setPathToInputValueState("");
    setExcludedEdgesState([]);
  }, []);

  const clearFloodFill = React.useCallback(() => {
    setFloodFillNodeState(null);
    setFloodFillEdges(new Set());
    setFloodFillNotFound(false);
    setFloodFillLoading(false);
    setFloodFillInputValueState("");
    setFloodFillExcludedEdgesState([]);
  }, []);

  // Combine path edges and flood fill edges for the map
  const allHighlightedEdges = React.useMemo(() => {
    const combined = new Set(pathEdges);
    floodFillEdges.forEach((edge) => combined.add(edge));
    return combined;
  }, [pathEdges, floodFillEdges]);

  const value = React.useMemo(
    () => ({
      pathFromNode,
      pathToNode,
      pathEdges,
      excludedEdges,
      pathLoading,
      pathNotFound,
      pathFromInputValue,
      pathToInputValue,
      floodFillNode,
      floodFillEdges,
      floodFillExcludedEdges,
      floodFillLoading,
      floodFillNotFound,
      floodFillInputValue,
      allHighlightedEdges,
      setPathFromNode,
      setPathToNode,
      setPathFromInputValue,
      setPathToInputValue,
      setExcludedEdges,
      clearShortestPath,
      setFloodFillNode,
      setFloodFillInputValue,
      setFloodFillExcludedEdges,
      clearFloodFill,
    }),
    [
      pathFromNode,
      pathToNode,
      pathEdges,
      excludedEdges,
      pathLoading,
      pathNotFound,
      pathFromInputValue,
      pathToInputValue,
      floodFillNode,
      floodFillEdges,
      floodFillExcludedEdges,
      floodFillLoading,
      floodFillNotFound,
      floodFillInputValue,
      allHighlightedEdges,
      setPathFromNode,
      setPathToNode,
      setPathFromInputValue,
      setPathToInputValue,
      setExcludedEdges,
      clearShortestPath,
      setFloodFillNode,
      setFloodFillInputValue,
      setFloodFillExcludedEdges,
      clearFloodFill,
    ],
  );

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const context = React.useContext(ConnectivityContext);
  if (context === undefined) {
    throw new Error(
      "useConnectivity must be used within a ConnectivityProvider",
    );
  }
  return context;
}
