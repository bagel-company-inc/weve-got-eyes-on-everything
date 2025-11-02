import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { Map } from "react-map-gl/maplibre";
import { WebMercatorViewport, Widget } from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import {
  CompassWidget,
  _FpsWidget as FpsWidget,
  ZoomWidget,
  _ScaleWidget as ScaleWidget,
  DarkGlassTheme,
  LightGlassTheme,
} from "@deck.gl/widgets";
import "@deck.gl/widgets/stylesheet.css";

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

function getCurrentBounds(viewState: any, containerWidth: number, containerHeight: number): number[] {
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

export default function CommonModelMap() {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loadingGeoJson, setLoadingGeoJson] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: -39.059,
    longitude: 174.07,
    zoom: 14,
  });
  const currentAbortController = useRef<AbortController | null>(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerSizeRef = useRef({ width: 0, height: 0 });

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

  async function fetchVisibleData(vs: any) {
    setLoadingGeoJson(true);
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

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/geojson?bbox=${minLng},${minLat},${maxLng},${maxLat}&zoom=${zoomLevel}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      setGeoJsonData(data);
    } catch (err) {
      console.error("Error fetching visible data:", err);
    } finally {
      setLoadingGeoJson(false);
    }
  }

  // Throttled fetch for continuous panning
  const throttledFetch = useCallback(throttle(fetchVisibleData, 1000), []);

  // Debounced fetch for final "stop" fetch
  const debouncedFetch = useCallback(debounce(fetchVisibleData, 200), []);

  const handleViewChange = ({ viewState: vs }: any) => {
    setViewState(vs);
    throttledFetch(vs);
    debouncedFetch(vs);
  };

  // Initial fetch
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      fetchVisibleData(viewState);
    }
  }, [containerSize.width, containerSize.height]);

  const layers = useMemo(() => {
    if (!geoJsonData) return [];
    return [
      new GeoJsonLayer({
        id: "geojson-layer",
        data: geoJsonData,
        pickable: viewState.zoom >= 16,
        filled: false,
        getPointRadius: 0.2,
        lineCapRounded: true,
        lineJointRounded: true,
        getLineWidth: (f) => {
          if (f.properties.name === selectedId) return 0.5;
          return 0.3;
        },
        lineWidthMinPixels: 1,

        getLineColor: (f) => {
          if (f.properties.name === selectedId) return [255, 100, 0];
          if (f.properties.name === hoveredId) return [200, 200, 200];
          return f.properties.colour;
        },

        onClick: (info) => setSelectedId(info.object?.properties.name),
        onHover: (info) => setHoveredId(info.object?.properties.name),

        updateTriggers: {
          onClick: [selectedId],
          getLineColor: [selectedId, hoveredId],
          getLineWidth: [selectedId],
          pickable: [viewState],
        },

        transitions: {
          getLineColor: 200,
          getLineWidth: 100,
        },
      }),
    ];
  }, [geoJsonData, selectedId, hoveredId]);

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
        width={containerSize.width || undefined}
        height={containerSize.height || undefined}
        onClick={(info) => setSelectedId(info.object?.properties.name)}
        widgets={[
          new FpsWidget({ style: widgetTheme, placement: "top-left" }),
          new ScaleWidget({ style: widgetTheme, placement: "bottom-left" }),
          new CompassWidget({ style: widgetTheme, placement: "top-right" }),
          new ZoomWidget({ style: widgetTheme, placement: "top-right" }),
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
