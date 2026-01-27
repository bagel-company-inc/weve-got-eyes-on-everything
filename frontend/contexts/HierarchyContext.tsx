import * as React from "react";

export type HierarchyView = {
  gxp_code: string;
  substation_name: string | null;
  hv_feeder_code: string | null;
  dtx_code: string | null;
};

export function addHierarchyToURL(
  hv: HierarchyView | null,
  url: string,
): string {
  if (hv?.gxp_code) {
    url += `&gxp=${hv.gxp_code}`;
  }
  if (hv?.substation_name) {
    url += `&substation=${hv.substation_name}`;
  }
  if (hv?.hv_feeder_code) {
    url += `&hv=${hv.hv_feeder_code}`;
  }
  if (hv?.dtx_code) {
    url += `&dtx=${hv.dtx_code}`;
  }
  return url;
}

interface HierarchyContextType {
  hierarchyView: HierarchyView | null;
  setHierarchyView: (view: HierarchyView | null) => void;
}

const HierarchyContext = React.createContext<HierarchyContextType | undefined>(
  undefined,
);

interface HierarchyProviderProps {
  children: React.ReactNode;
  initialHierarchyView?: HierarchyView | null;
}

export function HierarchyProvider({ 
  children, 
  initialHierarchyView = null 
}: HierarchyProviderProps) {
  const [hierarchyView, setHierarchyView] = React.useState<HierarchyView | null>(
    initialHierarchyView
  );

  const value = React.useMemo(
    () => ({
      hierarchyView,
      setHierarchyView,
    }),
    [hierarchyView],
  );

  return (
    <HierarchyContext.Provider value={value}>
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const context = React.useContext(HierarchyContext);
  if (context === undefined) {
    throw new Error("useHierarchy must be used within a HierarchyProvider");
  }
  return context;
}
