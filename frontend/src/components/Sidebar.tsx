import { useState } from 'react';
import type { CityInfoResponse, SimulationResponse } from '../types';

interface SidebarProps {
  info: CityInfoResponse | null;
  onRun: (date: string) => void;
  loading: boolean;
  result: SimulationResponse | null;
}

export default function Sidebar({ info, onRun, loading, result }: SidebarProps) {
  const minDate = info?.summary.date_range_end
    ? new Date(new Date(info.summary.date_range_end).getTime() + 86400000).toISOString().split('T')[0]
    : '2026-03-01';

  const defaultDate = info?.summary.date_range_end
    ? new Date(new Date(info.summary.date_range_end).getTime() + 120 * 86400000).toISOString().split('T')[0]
    : '2026-06-27';

  const [targetDate, setTargetDate] = useState(defaultDate);

  return (
    <aside className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col h-full shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-2xl">🌫️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Calidad del Aire</h1>
            <p className="text-xs text-slate-400">Quito, Ecuador</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot"></div>
          <span className="text-xs text-slate-400">Sistema Activo</span>
        </div>
      </div>

      {/* Parameters */}
      <div className="p-5 border-b border-white/10 space-y-4 relative z-10">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px]">⚙️</span>
          Parámetros
        </h3>

        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium">📅 Fecha objetivo</label>
          <input
            type="date"
            value={targetDate}
            min={minDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/5 text-white"
          />
        </div>

        <button
          onClick={() => onRun(targetDate)}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 text-white text-base font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculando...
            </>
          ) : (
            <>
              <span className="text-lg">🚀</span>
              Ejecutar Simulación
            </>
          )}
        </button>

        {result && (
          <p className="text-center text-xs text-green-400 flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Simulación completada
          </p>
        )}
      </div>

      {/* Dataset Info */}
      {info && (
        <div className="p-5 border-b border-white/10 space-y-3 relative z-10">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px]">📊</span>
            Dataset
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">Registros</p>
              <p className="text-lg font-bold text-white font-mono">{info.summary.total_records.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">CO medio</p>
              <p className="text-lg font-bold text-blue-400 font-mono">{info.summary.co_mean}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">PM2.5 medio</p>
              <p className="text-lg font-bold text-purple-400 font-mono">{info.summary.pm25_mean}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">Rango</p>
              <p className="text-xs font-mono text-slate-300">{info.summary.date_range_start}</p>
              <p className="text-xs font-mono text-slate-400">→ {info.summary.date_range_end}</p>
            </div>
          </div>
        </div>
      )}

      {/* City Info */}
      {info && (
        <div className="p-5 border-b border-white/10 relative z-10">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px]">🏙️</span>
            Ciudad
          </h3>
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-white/5">
            <p className="font-semibold text-white text-sm">{info.city.name}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-slate-400">📍 {info.city.latitude}°, {info.city.longitude}°</span>
              <span className="text-slate-400">👥 {info.city.population.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Results */}
      {result && (
        <div className="p-4 border-t border-white/10 bg-black/20 relative z-10 mt-auto">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-semibold">Resultados Rápidos</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-500/20">
              <p className="text-[10px] text-slate-400 uppercase">CO predicho</p>
              <p className="text-xl font-bold text-blue-400 font-mono">{result.euler.co_pred_at_target}</p>
              <p className="text-[10px] text-slate-500">µg/m³</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-500/20">
              <p className="text-[10px] text-slate-400 uppercase">Masa CO</p>
              <p className="text-xl font-bold text-purple-400 font-mono">{result.double_integral.mass_ton}</p>
              <p className="text-[10px] text-slate-500">toneladas</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
