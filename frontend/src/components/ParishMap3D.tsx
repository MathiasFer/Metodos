import { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ParishData } from '../types';
import { getParishes } from '../api/simulation';

// Quito center
const INITIAL_VIEW = {
  longitude: -78.5100,
  latitude: -0.2200,
  zoom: 11,
  pitch: 45,
  bearing: -30,
};

function getColor(index: number): [number, number, number, number] {
  if (index < 25) return [34, 197, 94, 200];    // green
  if (index < 50) return [234, 179, 8, 200];     // yellow
  if (index < 75) return [249, 115, 22, 200];    // orange
  return [239, 68, 68, 200];                      // red
}

function getElevation(index: number): number {
  return Math.max(50, index * 8);
}

export default function ParishMap3D() {
  const [parishes, setParishes] = useState<ParishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urbana' | 'rural'>('all');
  const [hoverInfo, setHoverInfo] = useState<{ parish: ParishData; x: number; y: number } | null>(null);

  useEffect(() => {
    getParishes()
      .then((res) => setParishes(res.parishes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return parishes;
    return parishes.filter((p) => p.zone === filter);
  }, [parishes, filter]);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: filtered.map((p) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [p.polygon],
      },
      properties: {
        name: p.name,
        zone: p.zone,
        population: p.population,
        area_km2: p.area_km2,
        co_level: p.co_level,
        pm25_level: p.pm25_level,
        contamination_index: p.contamination_index,
      },
    })),
  }), [filtered]);

  const layers = useMemo(() => [
    new GeoJsonLayer({
      id: 'parishes-3d',
      data: geojson,
      filled: true,
      extruded: true,
      getFillColor: (d: any) => getColor(d.properties.contamination_index),
      getElevation: (d: any) => getElevation(d.properties.contamination_index),
      elevationScale: 1,
      stroked: true,
      getLineColor: [255, 255, 255, 200],
      getLineWidth: 2,
      wireframe: true,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          setHoverInfo({
            parish: {
              name: info.object.properties.name,
              zone: info.object.properties.zone,
              latitude: 0,
              longitude: 0,
              population: info.object.properties.population,
              area_km2: info.object.properties.area_km2,
              polygon: [],
              co_level: info.object.properties.co_level,
              pm25_level: info.object.properties.pm25_level,
              contamination_index: info.object.properties.contamination_index,
            },
            x: info.x,
            y: info.y,
          });
        } else {
          setHoverInfo(null);
        }
      },
    }),
  ], [geojson]);

  const topParishes = useMemo(() =>
    [...parishes].sort((a, b) => b.contamination_index - a.contamination_index).slice(0, 10),
    [parishes],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm">🗺️</div>
              <div>
                <h2 className="text-3xl font-bold">Mapa 3D — Parroquias de Quito</h2>
                <p className="text-emerald-100">Niveles de contaminación por parroquia</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">{parishes.length}</div>
            <div className="text-emerald-100 text-sm">parroquias</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {(['all', 'urbana', 'rural'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? '📍 Todas' : f === 'urbana' ? '🏙️ Urbanas' : '🌿 Rurales'}
            <span className="ml-2 text-xs opacity-70">
              ({f === 'all' ? parishes.length : parishes.filter((p) => p.zone === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* 3D Map */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden relative">
        <div className="h-[500px]">
          <DeckGL
            initialViewState={INITIAL_VIEW}
            controller={true}
            layers={layers}
            getTooltip={null}
          >
            <Map
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
              attributionControl={false}
            />
          </DeckGL>

          {/* Hover Tooltip */}
          {hoverInfo && (
            <div
              className="absolute pointer-events-none z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[220px]"
              style={{ left: hoverInfo.x + 10, top: hoverInfo.y - 10 }}
            >
              <p className="font-bold text-gray-800 text-sm">{hoverInfo.parish.name}</p>
              <p className="text-xs text-gray-500 uppercase mb-2">{hoverInfo.parish.zone}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">CO:</span>
                  <span className="font-mono font-bold text-orange-600">{hoverInfo.parish.co_level} µg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PM2.5:</span>
                  <span className="font-mono font-bold text-purple-600">{hoverInfo.parish.pm25_level} µg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Índice:</span>
                  <span className="font-mono font-bold" style={{ color: getColor(hoverInfo.parish.contamination_index).slice(0, 3).join(',') }}>
                    {hoverInfo.parish.contamination_index}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Población:</span>
                  <span className="font-mono">{hoverInfo.parish.population.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
            <span>Bajo (0-25)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(234, 179, 8)' }}></div>
            <span>Moderado (25-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(249, 115, 22)' }}></div>
            <span>Alto (50-75)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
            <span>Muy Alto (75-100)</span>
          </div>
        </div>
      </div>

      {/* Top 10 Most Contaminated */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🔥</span>
            Top 10 Parroquias Más Contaminadas
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase text-xs">#</th>
              <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase text-xs">Parroquia</th>
              <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase text-xs">Zona</th>
              <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase text-xs">CO (µg/m³)</th>
              <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase text-xs">PM2.5</th>
              <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase text-xs">Índice</th>
            </tr>
          </thead>
          <tbody>
            {topParishes.map((p, i) => (
              <tr key={p.name} className={`border-b border-gray-100 ${i === 0 ? 'bg-gradient-to-r from-red-50 to-orange-50' : ''}`}>
                <td className="px-6 py-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < 3 ? 'bg-gradient-to-br from-red-500 to-orange-400 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>{i + 1}</span>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-800">{p.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.zone === 'urbana' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {p.zone}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-orange-600">{p.co_level}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-purple-600">{p.pm25_level}</td>
                <td className="px-6 py-4 text-right font-mono font-bold" style={{ color: `rgb(${getColor(p.contamination_index).slice(0, 3).join(',')})` }}>
                  {p.contamination_index}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
