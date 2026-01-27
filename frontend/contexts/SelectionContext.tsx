import * as React from "react";
import { API_URL } from "../config/api";
import { useMap } from "./MapContext";

interface SelectionContextType {
  selectedAssets: string[];
  setSelectedAssets: React.Dispatch<React.SetStateAction<string[]>>;
  viewedAssetName: string | null;
  setViewedAssetName: (name: string | null) => void;
  boxSelectionMode: boolean;
  setBoxSelectionMode: (mode: boolean) => void;
  searchBarSelectedName: string | null;
  setSearchBarSelectedName: (name: string | null) => void;
  searchTriggerCount: number;
  triggerSearch: () => void;
  attributeData: Record<string, any> | null;
  fetchAttributesForAsset: (name: string) => void;
  clearSelection: () => void;
  addToSelection: (name: string) => void;
  addMultipleToSelection: (names: string[]) => void;
}

const SelectionContext = React.createContext<SelectionContextType | undefined>(
  undefined,
);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);
  const [viewedAssetName, setViewedAssetNameState] = React.useState<string | null>(null);
  const [boxSelectionMode, setBoxSelectionModeState] = React.useState(false);
  const [searchBarSelectedName, setSearchBarSelectedNameState] = React.useState<string | null>(null);
  const [searchTriggerCount, setSearchTriggerCount] = React.useState(0);
  const [attributeData, setAttributeData] = React.useState<Record<string, any> | null>(null);

  const { currentMapBounds } = useMap();

  // Wrap setters in useCallback to prevent unnecessary re-renders
  const setViewedAssetName = React.useCallback((name: string | null) => {
    setViewedAssetNameState(name);
  }, []);

  const setBoxSelectionMode = React.useCallback((mode: boolean) => {
    setBoxSelectionModeState(mode);
  }, []);

  const setSearchBarSelectedName = React.useCallback((name: string | null) => {
    setSearchBarSelectedNameState(name);
  }, []);

  const triggerSearch = React.useCallback(() => {
    setSearchTriggerCount((prev) => prev + 1);
  }, []);

  const fetchAttributesForAsset = React.useCallback(
    (name: string) => {
      const bbox = currentMapBounds || "166.0,-47.5,179.0,-34.0";
      fetch(`${API_URL}attributes?name=${encodeURIComponent(name)}&bbox=${bbox}`)
        .then((response) => response.json())
        .then((data) => {
          setAttributeData(data);
        })
        .catch((err) => console.error("Error getting attributes:", err));
    },
    [currentMapBounds],
  );

  const clearSelection = React.useCallback(() => {
    setViewedAssetName(null);
    setAttributeData(null);
  }, []);

  const addToSelection = React.useCallback((name: string) => {
    setSelectedAssets((prev) => {
      if (prev.includes(name)) return prev;
      return [...prev, name];
    });
  }, []);

  const addMultipleToSelection = React.useCallback((names: string[]) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      names.forEach((name) => newSet.add(name));
      return Array.from(newSet);
    });
  }, []);

  const value = React.useMemo(
    () => ({
      selectedAssets,
      setSelectedAssets,
      viewedAssetName,
      setViewedAssetName,
      boxSelectionMode,
      setBoxSelectionMode,
      searchBarSelectedName,
      setSearchBarSelectedName,
      searchTriggerCount,
      triggerSearch,
      attributeData,
      fetchAttributesForAsset,
      clearSelection,
      addToSelection,
      addMultipleToSelection,
    }),
    [
      selectedAssets,
      viewedAssetName,
      boxSelectionMode,
      searchBarSelectedName,
      searchTriggerCount,
      attributeData,
      fetchAttributesForAsset,
      clearSelection,
      addToSelection,
      addMultipleToSelection,
      triggerSearch,
    ],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = React.useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
