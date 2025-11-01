import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import { WebMercatorViewport } from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";

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

function getCurrentBounds(viewState: any): number[] {
  const { width, height } = {
    width: window.innerWidth,
    height: window.innerHeight,
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

export default function App() {
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

  async function fetchVisibleData(vs: any) {
    setLoadingGeoJson(true);
    const [minLng, minLat, maxLng, maxLat] = getCurrentBounds(vs);

    // Cancel any ongoing request
    if (currentAbortController.current) {
      currentAbortController.current.abort();
    }
    const controller = new AbortController();
    currentAbortController.current = controller;

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/geojson?bbox=${minLng},${minLat},${maxLng},${maxLat}`,
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
    fetchVisibleData(viewState);
  }, []);

  const layers = useMemo(() => {
    if (!geoJsonData) return [];
    return [
      new GeoJsonLayer({
        id: "geojson-layer",
        data: geoJsonData,
        pickable: true,
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
        },

        transitions: {
          getLineColor: 200,
          getLineWidth: 100,
        },
      }),
    ];
  }, [geoJsonData, selectedId, hoveredId]);

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={handleViewChange}
      controller={true}
      layers={layers}
      pickingRadius={10}
      onClick={(info) => setSelectedId(info.object?.properties.name)}
    >
      <Map reuseMaps mapStyle={MAP_STYLE} />
    </DeckGL>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  const root = createRoot(container);
  root.render(<App />);
}
