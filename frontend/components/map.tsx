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
import { HierarchyView, addHierarchyToURL } from "./hierarchy";
import { API_URL } from "../api_url";

const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const widgetTheme = prefersDarkScheme.matches
  ? DarkGlassTheme
  : LightGlassTheme;

// Throttle: limit function calls to once per interval
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number,
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
  delay: number,
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
  containerHeight: number,
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
  pathFromNode?: string | null;
  pathToNode?: string | null;
  pathEdges?: Set<string>;
  onObjectSelected?: () => void;
  onMapObjectClickClearPath?: () => void;
  selectedAssets?: string[];
  onAddToSelection?: (name: string) => void;
  boxSelectionMode?: boolean;
  onBoxSelection?: (names: string[]) => void;
  onBoxSelectionComplete?: () => void;
  highlightedAssetName?: string | null;
  onAssetSelected?: (name: string) => void;
  onBoundsChange?: (bounds: string) => void;
  onClearAttributes?: () => void;
  onClearSelection?: () => void;
  levelOfDetail?: string | null;
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
  pathFromNode = null,
  pathToNode = null,
  pathEdges = new Set(),
  onObjectSelected,
  onMapObjectClickClearPath,
  selectedAssets = [],
  onAddToSelection,
  boxSelectionMode = false,
  onBoxSelection,
  onBoxSelectionComplete,
  highlightedAssetName = null,
  onAssetSelected,
  onBoundsChange,
  onClearAttributes,
  onClearSelection,
  levelOfDetail = null,
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

  // Sync selectedId with highlightedAssetName when it changes externally
  useEffect(() => {
    if (highlightedAssetName === null) {
      setSelectedId(null);
    } else if (highlightedAssetName !== selectedId) {
      setSelectedId(highlightedAssetName);
    }
  }, [highlightedAssetName, selectedId]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const [boxSelectionStart, setBoxSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [boxSelectionEnd, setBoxSelectionEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const isDraggingBox = useRef(false);

  const selectObject = (name: string, vs: any) => {
    const size = containerSizeRef.current;
    const [minLng, minLat, maxLng, maxLat] = getCurrentBounds(
      vs,
      size.width || window.innerWidth,
      size.height || window.innerHeight,
    );
    if (!name) return;
    fetch(
      `${API_URL}attributes?name=${name}&bbox=${minLng},${minLat},${maxLng},${maxLat}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (onAttributeDataChange) {
          onAttributeDataChange(data);
        }
      })
      .catch((err) => console.error("Error getting attributes:", err));

    setSelectedId(name);
    if (onAssetSelected) {
      onAssetSelected(name);
    }
    if (onObjectSelected) {
      onObjectSelected();
    }
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
      size.height || window.innerHeight,
    );
    const zoomLevel = vs.zoom;

    // Cancel any ongoing request
    if (currentAbortController.current) {
      currentAbortController.current.abort();
    }
    const controller = new AbortController();
    currentAbortController.current = controller;

    let url = addHierarchyToURL(
      hv,
      `${API_URL}geojson?bbox=${minLng},${minLat},${maxLng},${maxLat}&zoom=${zoomLevel}&column=${colouringContext.category}`,
    );

    // Add level of detail parameter if specified
    if (levelOfDetail) {
      url += `&detail=${levelOfDetail}`;
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
    levelOfDetail,
  ]);

  // Debounced fetch for final "stop" fetch
  const debouncedFetch = useCallback(debounce(fetchVisibleData, 100), [
    colouringContext.category,
    colouringContext.mapping,
    levelOfDetail,
  ]);

  const handleViewChange = ({ viewState: vs }: any) => {
    setViewState(vs);
    throttledFetch(vs, hierarchyView);
    debouncedFetch(vs, hierarchyView);

    // Update bounds for attribute fetching
    if (onBoundsChange) {
      const size = containerSizeRef.current;
      const [minLng, minLat, maxLng, maxLat] = getCurrentBounds(
        vs,
        size.width || window.innerWidth,
        size.height || window.innerHeight,
      );
      onBoundsChange(`${minLng},${minLat},${maxLng},${maxLat}`);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      fetchVisibleData(viewState, hierarchyView);

      // Set initial bounds
      if (onBoundsChange) {
        const [minLng, minLat, maxLng, maxLat] = getCurrentBounds(
          viewState,
          containerSize.width || window.innerWidth,
          containerSize.height || window.innerHeight,
        );
        onBoundsChange(`${minLng},${minLat},${maxLng},${maxLat}`);
      }
    }
  }, [
    containerSize.width,
    containerSize.height,
    colouringContext.category,
    colouringContext.mapping,
    hierarchyView,
    onBoundsChange,
    levelOfDetail,
  ]);

  useEffect(() => {
    if (!searchBarSelected) return;
    selectObject(searchBarSelected, viewState);
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
      getPointRadius: 1,
      pointRadiusUnits: "pixels",
      lineCapRounded: true,
      lineJointRounded: true,
      lineWidthUnits: "pixels",
      getLineWidth: (f) => {
        if (pathEdges.has(f.properties.name)) {
          return 4;
        }
        if (
          f.properties.name === selectedId ||
          f.properties.name === highlightedAssetName
        ) {
          return 5;
        }
        if (selectedAssets.includes(f.properties.name)) {
          return 3;
        }
        if (
          f.properties.name === pathFromNode ||
          f.properties.name === pathToNode
        ) {
          return 4;
        }
        return 1;
      },

      getLineColor: (f) => {
        // Highlight shortest path edges in a distinct color (bright cyan/magenta)
        if (pathEdges.has(f.properties.name)) return [255, 0, 255];
        if (
          f.properties.name === selectedId ||
          f.properties.name === highlightedAssetName
        )
          return [255, 30, 0];
        if (selectedAssets.includes(f.properties.name)) return [255, 165, 0]; // Orange for selected assets
        if (f.properties.name === hoveredId) return [200, 200, 200];
        // Highlight path start/end nodes
        if (
          f.properties.name === pathFromNode ||
          f.properties.name === pathToNode
        ) {
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

      onClick: (info, event) => {
        // Don't handle clicks in box selection mode
        if (boxSelectionMode) {
          return;
        }
        const name = info.object?.properties.name;
        if (name) {
          // Regular click: just select the object (GIS-style single selection)
          onMapObjectClickClearPath?.();
          selectObject(name, viewState);
        } else {
          // Clicked on empty space - clear attributes and selection
          setSelectedId(null);
          if (onClearAttributes) {
            onClearAttributes();
          }
          if (onClearSelection) {
            onClearSelection();
          }
        }
      },
      onHover: (info) => setHoveredId(info.object?.properties.name),

      updateTriggers: {
        onClick: [selectedId, viewState],
        getLineColor: [
          selectedId,
          highlightedAssetName,
          selectedAssets,
          hoveredId,
          pathFromNode,
          pathToNode,
          pathEdges,
          colouringContext.category,
          colouringContext.mapping,
        ],
        getLineWidth: [
          selectedId,
          highlightedAssetName,
          selectedAssets,
          pathFromNode,
          pathToNode,
          pathEdges,
          viewState.zoom,
        ],
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
    highlightedAssetName,
    selectedAssets,
    hoveredId,
    pathFromNode,
    pathToNode,
    pathEdges,
    viewState.zoom,
    colouringContext.category,
    colouringContext.mapping,
  ]);

  const layers = geojsonLayer ? [geojsonLayer] : [];

  // Handle box selection
  const handleBoxSelectionStart = useCallback(
    (event: MouseEvent) => {
      if (!boxSelectionMode) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setBoxSelectionStart({ x, y });
        setBoxSelectionEnd({ x, y });
        isDraggingBox.current = true;
      }
    },
    [boxSelectionMode],
  );

  const handleBoxSelectionMove = useCallback(
    (event: MouseEvent) => {
      if (!boxSelectionMode || !isDraggingBox.current || !boxSelectionStart)
        return;
      event.preventDefault();
      event.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setBoxSelectionEnd({ x, y });
      }
    },
    [boxSelectionMode, boxSelectionStart],
  );

  const handleBoxSelectionEnd = useCallback(() => {
    if (
      !boxSelectionMode ||
      !isDraggingBox.current ||
      !boxSelectionStart ||
      !boxSelectionEnd
    ) {
      isDraggingBox.current = false;
      setBoxSelectionStart(null);
      setBoxSelectionEnd(null);
      return;
    }

    // Calculate bounding box in geographic coordinates
    const viewport = new WebMercatorViewport({
      ...viewState,
      width: containerSizeRef.current.width || window.innerWidth,
      height: containerSizeRef.current.height || window.innerHeight,
    });

    const minX = Math.min(boxSelectionStart.x, boxSelectionEnd.x);
    const maxX = Math.max(boxSelectionStart.x, boxSelectionEnd.x);
    const minY = Math.min(boxSelectionStart.y, boxSelectionEnd.y);
    const maxY = Math.max(boxSelectionStart.y, boxSelectionEnd.y);

    const topLeft = viewport.unproject([minX, minY]);
    const bottomRight = viewport.unproject([maxX, maxY]);

    const bbox = {
      minLng: Math.min(topLeft[0], bottomRight[0]),
      maxLng: Math.max(topLeft[0], bottomRight[0]),
      minLat: Math.min(topLeft[1], bottomRight[1]),
      maxLat: Math.max(topLeft[1], bottomRight[1]),
    };

    // Find all features within the bounding box
    if (geoJsonData && geoJsonData.features) {
      const selectedNames: string[] = [];
      geoJsonData.features.forEach((feature: any) => {
        if (feature.geometry && feature.properties?.name) {
          const coords = feature.geometry.coordinates;
          if (feature.geometry.type === "Point") {
            const [lng, lat] = coords;
            if (
              lng >= bbox.minLng &&
              lng <= bbox.maxLng &&
              lat >= bbox.minLat &&
              lat <= bbox.maxLat
            ) {
              selectedNames.push(feature.properties.name);
            }
          } else if (
            feature.geometry.type === "LineString" ||
            feature.geometry.type === "MultiLineString"
          ) {
            // Check if any point of the line is within the box
            const points =
              feature.geometry.type === "LineString" ? [coords] : coords;
            for (const line of points) {
              for (const [lng, lat] of line) {
                if (
                  lng >= bbox.minLng &&
                  lng <= bbox.maxLng &&
                  lat >= bbox.minLat &&
                  lat <= bbox.maxLat
                ) {
                  selectedNames.push(feature.properties.name);
                  break;
                }
              }
              if (selectedNames.includes(feature.properties.name)) break;
            }
          }
        }
      });

      if (selectedNames.length > 0 && onBoxSelection) {
        onBoxSelection(selectedNames);
      }
    }

    isDraggingBox.current = false;
    setBoxSelectionStart(null);
    setBoxSelectionEnd(null);

    // Deactivate box selection mode after selection
    if (onBoxSelectionComplete) {
      onBoxSelectionComplete();
    }
  }, [
    boxSelectionMode,
    boxSelectionStart,
    boxSelectionEnd,
    viewState,
    geoJsonData,
    onBoxSelection,
    onBoxSelectionComplete,
  ]);

  // Add event listeners for box selection
  useEffect(() => {
    if (!boxSelectionMode) {
      setBoxSelectionStart(null);
      setBoxSelectionEnd(null);
      isDraggingBox.current = false;
      return;
    }

    if (!boxSelectionMode) return;

    const handleMouseDown = (e: MouseEvent) => handleBoxSelectionStart(e);
    const handleMouseMove = (e: MouseEvent) => handleBoxSelectionMove(e);
    const handleMouseUp = () => handleBoxSelectionEnd();
    const handleMouseLeave = () => handleBoxSelectionEnd();

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, [
    boxSelectionMode,
    handleBoxSelectionStart,
    handleBoxSelectionMove,
    handleBoxSelectionEnd,
  ]);

  // Calculate selection rectangle style
  const selectionRectStyle: React.CSSProperties | null =
    boxSelectionStart && boxSelectionEnd
      ? {
          position: "absolute",
          left: `${Math.min(boxSelectionStart.x, boxSelectionEnd.x)}px`,
          top: `${Math.min(boxSelectionStart.y, boxSelectionEnd.y)}px`,
          width: `${Math.abs(boxSelectionEnd.x - boxSelectionStart.x)}px`,
          height: `${Math.abs(boxSelectionEnd.y - boxSelectionStart.y)}px`,
          border: "2px dashed #1976d2",
          backgroundColor: "rgba(25, 118, 210, 0.1)",
          pointerEvents: "none",
          zIndex: 1000,
        }
      : null;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: boxSelectionMode ? "crosshair" : undefined,
      }}
    >
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewChange}
        controller={!boxSelectionMode}
        layers={layers}
        pickingRadius={10}
        onClick={(info) => {
          if (!boxSelectionMode) {
            if (info.object?.properties.name) {
              setSelectedId(info.object.properties.name);
            } else {
              // Clicked on empty space - clear attributes and selection
              setSelectedId(null);
              if (onClearAttributes) {
                onClearAttributes();
              }
              if (onClearSelection) {
                onClearSelection();
              }
            }
          }
        }}
        widgets={[
          new FpsWidget({ style: widgetTheme, placement: "top-left" }),
          new ScaleWidget({ style: widgetTheme, placement: "bottom-right" }),
          new CompassWidget({ style: widgetTheme, placement: "top-right" }),
          new ZoomWidget({ style: widgetTheme, placement: "top-right" }),
          new GeocoderWidget({ style: widgetTheme, placement: "bottom-left" }),
        ]}
        getCursor={(interactiveState) => {
          if (boxSelectionMode) return "crosshair";
          if (interactiveState.isDragging) return "grabbing";
          if (interactiveState.isHovering) return "pointer";
          return "grab";
        }}
      >
        <Map reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
      {selectionRectStyle && <div style={selectionRectStyle} />}
    </div>
  );
}
