import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl/maplibre';
import {DeckGL} from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';


const INITIAL_VIEW_STATE = {
  latitude: -39.059,
  longitude: 174.07,
  zoom: 14,
  minZoom: 2,
  maxZoom: 21.8
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export default function App() {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/geojson')
      .then(response => response.json())
      .then(jsonData => setGeoJsonData(jsonData))
      .catch(err => console.error("Error loading geojson:", err));
  }, []);

  const layers = useMemo(() => {
    if (!geoJsonData) return [];
    return [
      new GeoJsonLayer({
        id: 'geojson-layer',
        data: geoJsonData,
        pickable: true,
        filled: false,
        getPointRadius: 0.2,
        lineCapRounded: true,
        lineJointRounded: true,
        getLineWidth: f => {
          if (f.properties.name === selectedId) return 0.5;
          return 0.3;
        },
        lineWidthMinPixels: 1,
        
        getLineColor: f => {
          if (f.properties.name === selectedId) return [255, 100, 0];
          if (f.properties.name === hoveredId) return [200, 200, 200];
          return f.properties.colour;
        },

        onClick: info => setSelectedId(info.object?.properties.name),
        onHover: info => setHoveredId(info.object?.properties.name),

        updateTriggers: {
          onClick: [selectedId],
          getLineColor: [selectedId, hoveredId],
          getLineWidth: [selectedId],
        },

        transitions: {
          getLineColor: 200,
          getLineWidth: 100,
        }
      })
    ]
  }, [geoJsonData, selectedId, hoveredId]);

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={layers}
      pickingRadius={10}
      onClick={info => setSelectedId(info.object?.properties.name)}
    >
      <Map reuseMaps mapStyle={MAP_STYLE} />
    </DeckGL>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  const root = createRoot(container);
  root.render(<App />);
}
