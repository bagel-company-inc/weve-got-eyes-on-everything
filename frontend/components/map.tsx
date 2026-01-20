import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { Map } from "react-map-gl/maplibre";
import { WebMercatorViewport, FlyToInterpolator, Color } from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import {
  CompassWidget,
  _FpsWidget as FpsWidget,
  ZoomWidget,
  _ScaleWidget as ScaleWidget,
  DarkGlassTheme,
  LightGlassTheme,
  _GeocoderWidget as GeocoderWidget,
} from "@deck.gl/widgets";
import "@deck.gl/widgets/stylesheet.css";
import { ColouringContext } from "./colouring";
import { HierarchyView } from "./hierarchy";
import { API_URL } from "../api_url";

const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const widgetTheme = prefersDarkScheme.matches
  ? DarkGlassTheme
  : LightGlassTheme;

// Throttle: limit function calls to once per interval
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return function (this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;
}

// Debounce: delay function until no calls for delay ms
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timer: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  } as T;
}

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function getCurrentBounds(
  viewState: any,
  containerWidth: number,
  containerHeight: number
): number[] {
  const { width, height } = {
    width: containerWidth,
    height: containerHeight,
  };

  const viewport = new WebMercatorViewport({
    ...viewState,
    width,
    height,
  });

  const topLeft = viewport.unproject([0, 0]);
  const bottomRight = viewport.unproject([width, height]);

  // returns [minLng, minLat, maxLng, maxLat]
  return [topLeft[0], bottomRight[1], bottomRight[0], topLeft[1]];
}

interface CommonModelMapProps {
  onAttributeDataChange?: (data: Record<string, any> | null) => void;
  hierarchyView?: HierarchyView;
  searchBarSelected?: string | null;
  colouringContext: ColouringContext;
  shortestPathMode?: boolean;
}

type PropertiesType = {
  name: string;
  colour: Color;
  gxp_code: string;
  substation_name: string | null;
  hv_feeder_code: string | null;
  dtx_code: string | null;
};

export default function CommonModelMap({
  onAttributeDataChange,
  hierarchyView,
  searchBarSelected,
  colouringContext,
  shortestPathMode = false,
}: CommonModelMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [viewState, setViewState] = useState({
    latitude: -39.059,
    longitude: 174.07,
    zoom: 14,
  });
  const currentAbortController = useRef<AbortController | null>(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pathStartNode, setPathStartNode] = useState<string | null>(null);
  const [pathEndNode, setPathEndNode] = useState<string | null>(null);
  const [pathEdges, setPathEdges] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const selectObject = (name: string) => {
    if (!name) return;
    fetch(`${API_URL}attributes?name=${name}`)
      .then((response) => response.json())
      .then((data) => {
        if (onAttributeDataChange) {
          onAttributeDataChange(data);
        }
      })
      .catch((err) => console.error("Error getting attributes:", err));

    setSelectedId(name);
  };

  const handlePathNodeClick = (name: string) => {
    if (!name) return;
    
    // If no start node is selected, set it as the start
    if (!pathStartNode) {
      setPathStartNode(name);
      setPathEndNode(null);
      setPathEdges(new Set());
      return;
    }
    
    // If start node is selected and it's the same node, clear selection
    if (pathStartNode === name) {
      setPathStartNode(null);
      setPathEndNode(null);
      setPathEdges(new Set());
      return;
    }
    
    // If both start and end are set, clicking a new node resets and starts a new path
    if (pathStartNode && pathEndNode) {
      setPathStartNode(name);
      setPathEndNode(null);
      setPathEdges(new Set());
      return;
    }
    
    // If start node is selected and a different node is clicked, set as end and fetch path
    setPathEndNode(name);
    fetch(`${API_URL}shortest_path?a=${pathStartNode}&b=${name}`)
      .then((response) => response.json())
      .then((data: string[]) => {
        setPathEdges(new Set(data));
      })
      .catch((err) => {
        console.error("Error getting shortest path:", err);
        setPathEdges(new Set());
      });
  };

  // Update container size on mount and when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = { width: rect.width, height: rect.height };
        setContainerSize(size);
        containerSizeRef.current = size;
      }
    };

    // Initial size
    updateSize();

    // Use ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Also listen to window resize as fallback
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  async function fetchVisibleData(vs: any, hv: HierarchyView | null) {
    const size = containerSizeRef.current;
    const [minLng, minLat, maxLng, maxLat] = getCurrentBounds(
      vs,
      size.width || window.innerWidth,
      size.height || window.innerHeight
    );
    const zoomLevel = vs.zoom;

    // Cancel any ongoing request
    if (currentAbortController.current) {
      currentAbortController.current.abort();
    }
    const controller = new AbortController();
    currentAbortController.current = controller;

    let url = `${API_URL}geojson?bbox=${minLng},${minLat},${maxLng},${maxLat}&zoom=${zoomLevel}&column=${colouringContext.category}`;

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

    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      if (!controller.signal.aborted) {
        setGeoJsonData(data);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching visible data:", err);
      }
    }
  }

  // Throttled fetch for continuous panning
  const throttledFetch = useCallback(throttle(fetchVisibleData, 2000), [
    colouringContext.category,
    colouringContext.mapping,
  ]);

  // Debounced fetch for final "stop" fetch
  const debouncedFetch = useCallback(debounce(fetchVisibleData, 100), [
    colouringContext.category,
    colouringContext.mapping,
  ]);

  const handleViewChange = ({ viewState: vs }: any) => {
    setViewState(vs);
    throttledFetch(vs, hierarchyView);
    debouncedFetch(vs, hierarchyView);
  };

  // Initial fetch
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      fetchVisibleData(viewState, hierarchyView);
    }
  }, [
    containerSize.width,
    containerSize.height,
    colouringContext.category,
    colouringContext.mapping,
    hierarchyView,
  ]);

  useEffect(() => {
    if (!searchBarSelected) return;
    selectObject(searchBarSelected);
    fetch(`${API_URL}centroid?name=${searchBarSelected}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data) return;
        if (data.length == 0) return;
        const lon = data[0];
        const lat = data[1];
        const newViewState = {
          latitude: lat,
          longitude: lon,
          zoom: 18,
          transitionDuration: 1500,
          transitionInterpolator: new FlyToInterpolator(),
        };
        setViewState(newViewState);
      })
      .catch((err) => console.error("Error getting centroid:", err));
  }, [searchBarSelected]);

  const geojsonLayer = useMemo(() => {
    if (!geoJsonData) return null;

    return new GeoJsonLayer<PropertiesType>({
      id: "geojson-layer",
      data: geoJsonData,
      pickable: viewState.zoom >= 15,
      filled: false,
      getPointRadius: 1 / viewState.zoom,
      lineCapRounded: true,
      lineJointRounded: true,
      lineWidthUnits: "pixels",
      getLineWidth: (f) => {
        if (pathEdges.has(f.properties.name)) {
          return 4;
        }
        if (f.properties.name === selectedId) {
          return 5;
        }
        if (f.properties.name === pathStartNode || f.properties.name === pathEndNode) {
          return 4;
        }
        return 1;
      },

      getLineColor: (f) => {
        // Highlight shortest path edges in a distinct color (bright cyan/magenta)
        if (pathEdges.has(f.properties.name)) return [255, 0, 255];
        if (f.properties.name === selectedId) return [255, 30, 0];
        if (f.properties.name === hoveredId) return [200, 200, 200];
        // Highlight path start/end nodes
        if (f.properties.name === pathStartNode || f.properties.name === pathEndNode) {
          return [0, 255, 255];
        }
        if (colouringContext.category in f.properties) {
          const value = f.properties[colouringContext.category];
          if (value in colouringContext.mapping) {
            const hexColour = colouringContext.mapping[value];
            var bigint = parseInt(hexColour.replace("#", ""), 16);
            var r = (bigint >> 16) & 255;
            var g = (bigint >> 8) & 255;
            var b = bigint & 255;
            return [r, g, b];
          }
        }
        return f.properties.colour;
      },

      onClick: (info) => {
        const name = info.object?.properties.name;
        if (name) {
          if (shortestPathMode) {
            // If we're in path selection mode (start node already selected), handle path selection
            if (pathStartNode !== null) {
              handlePathNodeClick(name);
            } else {
              // Regular click: select object and handle path start
              selectObject(name);
              handlePathNodeClick(name);
            }
          } else {
            // Regular selection mode
            selectObject(name);
          }
        } else {
          // Clicked on empty space - clear path selection if in path mode
          if (shortestPathMode) {
            setPathStartNode(null);
            setPathEndNode(null);
            setPathEdges(new Set());
          }
        }
      },
      onHover: (info) => setHoveredId(info.object?.properties.name),

      updateTriggers: {
        onClick: [selectedId, pathStartNode, pathEndNode],
        getLineColor: [
          selectedId,
          hoveredId,
          pathStartNode,
          pathEndNode,
          pathEdges,
          colouringContext.category,
          colouringContext.mapping,
        ],
        getLineWidth: [selectedId, pathStartNode, pathEndNode, pathEdges, viewState.zoom],
        getPointRadius: [viewState.zoom],
        pickable: [viewState.zoom],
      },

      transitions: {
        getLineColor: 50,
        getLineWidth: 100,
      },
    });
  }, [
    geoJsonData,
    selectedId,
    hoveredId,
    pathStartNode,
    pathEndNode,
    pathEdges,
    shortestPathMode,
    viewState.zoom,
    colouringContext.category,
    colouringContext.mapping,
  ]);

  // Clear path selection when mode is disabled
  useEffect(() => {
    if (!shortestPathMode) {
      setPathStartNode(null);
      setPathEndNode(null);
      setPathEdges(new Set());
    }
  }, [shortestPathMode]);

  const layers = geojsonLayer ? [geojsonLayer] : [];

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewChange}
        controller={true}
        layers={layers}
        pickingRadius={10}
        onClick={(info) => setSelectedId(info.object?.properties.name)}
        widgets={[
          new FpsWidget({ style: widgetTheme, placement: "top-left" }),
          new ScaleWidget({ style: widgetTheme, placement: "bottom-right" }),
          new CompassWidget({ style: widgetTheme, placement: "top-right" }),
          new ZoomWidget({ style: widgetTheme, placement: "top-right" }),
          new GeocoderWidget({ style: widgetTheme, placement: "bottom-left" }),
        ]}
        getCursor={(interactiveState) => {
          if (interactiveState.isDragging) return "grabbing";
          if (interactiveState.isHovering) return "pointer";
          return "grab";
        }}
      >
        <Map reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
    </div>
  );
}
