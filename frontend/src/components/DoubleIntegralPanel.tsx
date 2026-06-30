import { useState } from 'react';
import type { DoubleIntegralResult } from '../types';

interface Props { di: DoubleIntegralResult; plotImage: string }

export default function DoubleIntegralPanel({ di, plotImage }: Props) {
  const [hoveredCell, setHoveredCell] = useState<{ lon: number; lat: number; val: number } | null>(null);

  const { heatmap, lon_range, lat_range, mass_kg, mass_ton, c0_ug, lon0, lat0, target_date } = di;
  const rows = heatmap.length;
  const cols = heatmap[0]?.length || 0;
  const lonStep = (lon_range[1] - lon_range[0]) / cols;
  const latStep = (lat_range[1] - lat_range[0]) / rows;

  let minVal = Infinity, maxVal = -Infinity;
  for (const row of heatmap) {
    for (const v of row) {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
  }

  const getColor = (val: number) => {
    const t = maxVal > minVal ? (val - minVal) / (maxVal - minVal) : 0;
    if (t < 0.2) return `rgb(${Math.round(30 + 50 * (t / 0.2))}, ${Math.round(100 + 155 * (t / 0.2))}, ${Math.round(200 + 55 * (1 - t / 0.2))})`;
    if (t < 0.4) { const p = (t - 0.2) / 0.2; return `rgb(${Math.round(80 + 100 * p)}, ${Math.round(255 - 50 * p)}, ${Math.round(255 - 155 * p)})`; }
    if (t < 0.6) { const p = (t - 0.4) / 0.2; return `rgb(${Math.round(180 + 75 * p)}, ${Math.round(205 - 55 * p)}, ${Math.round(100 - 80 * p)})`; }
    if (t < 0.8) { const p = (t - 0.6) / 0.2; return `rgb(255, ${Math.round(150 - 70 * p)}, ${Math.round(20 + 30 * (1 - p))})`; }
    const p = (t - 0.8) / 0.2; return `rgb(${Math.round(255 - 50 * p)}, ${Math.round(80 - 50 * p)}, ${Math.round(50 - 30 * p)})`;
  };

  const cellSize = Math.min(12, Math.floor(600 / Math.max(rows, cols)));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm">④</div>
              <div>
                <h2 className="text-3xl font-bold">Integral Doble</h2>
                <p className="text-indigo-100">Masa de CO sobre Quito</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">{mass_ton}</div>
            <div className="text-indigo-100 text-sm">toneladas de CO</div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="C₀ (Euler)" value={`${c0_ug}`} unit="µg/m³" icon="🎯" gradient="from-blue-500 to-cyan-400" />
        <MetricCard label="Masa total" value={`${mass_ton}`} unit="ton" icon="🌍" gradient="from-purple-500 to-pink-400" accent />
        <MetricCard label="En kg" value={`${mass_kg}`} unit="kg" icon="⚖️" gradient="from-green-500 to-emerald-400" />
      </div>

      {/* Matplotlib Plot */}
      {plotImage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-xl">📊</span>
              Gráfica Original — Integral Doble (Matplotlib)
            </h3>
            <p className="text-indigo-100 text-sm mt-1">Mapa de calor 2D + Superficie 3D + Vista isométrica</p>
          </div>
          <div className="p-6">
            <img src={`data:image/png;base64,${plotImage}`} alt="Double Integral Plot" className="w-full rounded-lg shadow-md" />
          </div>
        </div>
      )}

      {/* Interactive Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            Mapa de Calor Interactivo 2D
          </h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <svg width={cols * cellSize + 80} height={rows * cellSize + 60} className="mx-auto">
              {Array.from({ length: Math.min(rows, 8) }, (_, i) => {
                const rowIdx = Math.floor(i * rows / 8);
                const lat = lat_range[1] - rowIdx * latStep;
                return <text key={`yl${i}`} x={35} y={30 + rowIdx * cellSize + cellSize / 2} fontSize={10} fill="#666" textAnchor="end" dominantBaseline="middle">{lat.toFixed(2)}°</text>;
              })}
              {Array.from({ length: Math.min(cols, 10) }, (_, i) => {
                const colIdx = Math.floor(i * cols / 10);
                const lon = lon_range[0] + colIdx * lonStep;
                return <text key={`xl${i}`} x={50 + colIdx * cellSize + cellSize / 2} y={rows * cellSize + 40} fontSize={10} fill="#666" textAnchor="middle">{lon.toFixed(2)}°</text>;
              })}
              <text x={50 + (cols * cellSize) / 2} y={rows * cellSize + 55} fontSize={11} fill="#444" textAnchor="middle" fontWeight="600">Longitud (°)</text>
              <text x={10} y={30 + (rows * cellSize) / 2} fontSize={11} fill="#444" textAnchor="middle" fontWeight="600" transform={`rotate(-90, 10, ${30 + (rows * cellSize) / 2})`}>Latitud (°)</text>
              {heatmap.map((row, ri) => row.map((val, ci) => (
                <rect key={`${ri}-${ci}`} x={50 + ci * cellSize} y={30 + ri * cellSize} width={cellSize} height={cellSize} fill={getColor(val)} opacity={0.95} stroke="white" strokeWidth={0.3}
                  onMouseEnter={() => setHoveredCell({ lon: lon_range[0] + ci * lonStep, lat: lat_range[1] - ri * latStep, val: val * 1e9 })}
                  onMouseLeave={() => setHoveredCell(null)} style={{ cursor: 'crosshair' }} />
              )))}
              <circle cx={50 + ((lon0 - lon_range[0]) / (lon_range[1] - lon_range[0])) * cols * cellSize} cy={30 + ((lat_range[1] - lat0) / (lat_range[1] - lat_range[0])) * rows * cellSize} r={6} fill="#1a1a1a" stroke="white" strokeWidth={3} />
              <circle cx={50 + ((lon0 - lon_range[0]) / (lon_range[1] - lon_range[0])) * cols * cellSize} cy={30 + ((lat_range[1] - lat0) / (lat_range[1] - lat_range[0])) * rows * cellSize} r={3} fill="white" />
            </svg>
          </div>
          {hoveredCell && (
            <div className="mt-4 text-center text-sm bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-3 border border-indigo-100">
              <span className="font-mono text-indigo-700">Lon: {hoveredCell.lon.toFixed(4)}° | Lat: {hoveredCell.lat.toFixed(4)}° | CO: {hoveredCell.val.toFixed(1)} µg/m³</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, accent, icon, gradient }: {
  label: string; value: string; unit: string; accent?: boolean; icon: string; gradient: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 card-hover ${accent ? 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 shadow-lg'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shadow-lg`}>{icon}</div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-bold font-mono ${accent ? 'text-indigo-700' : 'text-gray-800'}`}>{value}</p>
        <p className="text-sm text-gray-400">{unit}</p>
      </div>
    </div>
  );
}
