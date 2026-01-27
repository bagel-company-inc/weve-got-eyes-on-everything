import * as React from "react";
import { generateColorMapping } from "../utils/colors";
import { API_URL } from "../config/api";
import { useHierarchy, addHierarchyToURL } from "./HierarchyContext";

export type ColouringContextType = {
  category: string;
  mapping: Record<string | number, string>;
};

interface ColouringContextValue {
  colouringContext: ColouringContextType;
  setCategory: (category: string) => void;
  updateMapping: (mapping: Record<string | number, string>) => void;
  updateColor: (value: string | number, color: string) => void;
}

const ColouringContext = React.createContext<ColouringContextValue | undefined>(
  undefined,
);

interface ColouringProviderProps {
  children: React.ReactNode;
  initialCategory?: string;
}

export function ColouringProvider({
  children,
  initialCategory = "",
}: ColouringProviderProps) {
  const [colouringContext, setColouringContext] = React.useState<ColouringContextType>({
    category: initialCategory,
    mapping: {},
  });

  const { hierarchyView } = useHierarchy();

  // Load color mapping when category changes
  React.useEffect(() => {
    if (!colouringContext.category) return;

    // If we already have a mapping, don't reload
    if (Object.keys(colouringContext.mapping).length > 0) return;

    const url = addHierarchyToURL(
      hierarchyView,
      `${API_URL}column_unique_values?column=${colouringContext.category}`,
    );

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (!data || data.length === 0) return;

        const isVoltage = colouringContext.category.includes("voltage");
        const mapping = generateColorMapping(data, isVoltage);

        setColouringContext({
          category: colouringContext.category,
          mapping,
        });
      })
      .catch((err) => console.error("Error loading color mapping:", err));
  }, [colouringContext.category, hierarchyView]);

  const setCategory = React.useCallback((category: string) => {
    setColouringContext({
      category,
      mapping: {},
    });
  }, []);

  const updateMapping = React.useCallback(
    (mapping: Record<string | number, string>) => {
      setColouringContext((prev) => ({
        ...prev,
        mapping,
      }));
    },
    [],
  );

  const updateColor = React.useCallback(
    (value: string | number, color: string) => {
      setColouringContext((prev) => ({
        ...prev,
        mapping: {
          ...prev.mapping,
          [value]: color,
        },
      }));
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      colouringContext,
      setCategory,
      updateMapping,
      updateColor,
    }),
    [colouringContext, setCategory, updateMapping, updateColor],
  );

  return (
    <ColouringContext.Provider value={value}>
      {children}
    </ColouringContext.Provider>
  );
}

export function useColouring() {
  const context = React.useContext(ColouringContext);
  if (context === undefined) {
    throw new Error("useColouring must be used within a ColouringProvider");
  }
  return context;
}
