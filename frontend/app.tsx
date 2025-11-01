import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import { WebMercatorViewport } from "@deck.gl/core";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";

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
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  async function fetchVisibleData(vs: any) {
    setLoadingGeoJson(true);
    const [minLng, minLat, maxLng, maxLat] = getCurrentBounds(vs);

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/geojson?bbox=${minLng},${minLat},${maxLng},${maxLat}`
      );
      const data = await res.json();
      setGeoJsonData(data);
    } catch (err) {
      console.error("Error fetching visible data:", err);
    } finally {
      setLoadingGeoJson(false);
    }
  }

  const handleViewChange = ({ viewState: vs }: any) => {
    setViewState(vs);
    fetchVisibleData(vs);
  };

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
