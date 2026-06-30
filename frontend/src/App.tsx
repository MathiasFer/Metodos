import { useState, useEffect } from 'react';
import { getCityInfo, runSimulation } from './api/simulation';
import type { SimulationResponse, CityInfoResponse } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EulerPanel from './components/EulerPanel';
import TaylorPanel from './components/TaylorPanel';
import TrapezoidPanel from './components/TrapezoidPanel';
import DoubleIntegralPanel from './components/DoubleIntegralPanel';
import ReportPanel from './components/ReportPanel';

type Tab = 'dashboard' | 'euler' | 'taylor' | 'trapezoid' | 'double' | 'report';

const TABS: { key: Tab; label: string; icon: string; color: string }[] = [
  { key: 'dashboard', label: 'Resumen', icon: '🏠', color: 'from-blue-500 to-cyan-400' },
  { key: 'euler', label: 'Euler', icon: '①', color: 'from-red-500 to-orange-400' },
  { key: 'taylor', label: 'Taylor', icon: '②', color: 'from-green-500 to-emerald-400' },
  { key: 'trapezoid', label: 'Trapecio', icon: '③', color: 'from-purple-500 to-pink-400' },
  { key: 'double', label: 'Integral Doble', icon: '④', color: 'from-indigo-500 to-violet-400' },
  { key: 'report', label: 'Reporte', icon: '📋', color: 'from-amber-500 to-yellow-400' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [info, setInfo] = useState<CityInfoResponse | null>(null);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCityInfo()
      .then(setInfo)
      .catch(() => setError('No se pudo conectar al backend. Asegúrese de que FastAPI esté corriendo en puerto 8000.'));
  }, []);

  const handleRun = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation(date);
      setResult(res);
      setActiveTab('dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Error al ejecutar la simulación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        info={info}
        onRun={handleRun}
        loading={loading}
        result={result}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Error banner */}
        {error && (
          <div className="m-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl text-red-700 text-sm shadow-lg shadow-red-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Top Tabs Bar - only show after simulation runs */}
        {result && (
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
              <div className="relative mb-8">
                <div className="text-9xl float-animation">🌫️</div>
              </div>
              <h1 className="text-4xl font-bold mb-3">
                <span className="gradient-text">Sistema de Predicción</span>
                <br />
                <span className="text-gray-700">de Calidad del Aire</span>
              </h1>
              <p className="text-gray-500 max-w-xl mb-8 text-lg">
                Quito, Ecuador — Métodos Numéricos Encadenados
              </p>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 max-w-3xl mb-8">
                <h3 className="font-semibold text-gray-700 mb-6 text-lg">Cadena de Métodos Numéricos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MethodFlowCard number="①" title="Euler" formula="dC/dt = −kC + S(t)" color="from-red-500 to-orange-400" bgColor="bg-red-50" />
                  <MethodFlowCard number="②" title="Taylor" formula="C{'{n+1}'} = Cₙ + Δtfₙ + ..." color="from-green-500 to-emerald-400" bgColor="bg-green-50" />
                  <MethodFlowCard number="③" title="Trapecio" formula="Dosis = ∫C(t)dt" color="from-purple-500 to-pink-400" bgColor="bg-purple-50" />
                  <MethodFlowCard number="④" title="Integral Doble" formula="M = ρH∬C(x,y)dA" color="from-indigo-500 to-violet-400" bgColor="bg-indigo-50" />
                </div>
                <div className="flex justify-center items-center gap-2 mt-4 text-gray-300">
                  <div className="h-0.5 w-12 bg-gradient-to-r from-red-400 to-green-400 rounded"></div>
                  <div className="h-0.5 w-12 bg-gradient-to-r from-green-400 to-purple-400 rounded"></div>
                  <div className="h-0.5 w-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded"></div>
                </div>
              </div>
              {info && (
                <div className="flex gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot"></div>
                    <span>{info.summary.total_records.toLocaleString()} registros</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full">
                    <span>📅 {info.summary.date_range_start} → {info.summary.date_range_end}</span>
                  </div>
                </div>
              )}
              <p className="text-gray-400 mt-8 text-sm">
                👈 Selecciona una fecha en el panel lateral y presiona <strong className="text-blue-600">Ejecutar Simulación</strong>
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-700 text-xl font-semibold mt-8">Ejecutando simulación numérica...</p>
              <p className="text-gray-400 text-sm mt-3">Calculando Euler → Taylor → Trapecio → Integral Doble</p>
              <div className="flex gap-2 mt-6">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
              </div>
            </div>
          )}

          {result && activeTab === 'dashboard' && <Dashboard result={result} />}
          {result && activeTab === 'euler' && <EulerPanel euler={result.euler} plotImage={result.plots?.euler || ''} />}
          {result && activeTab === 'taylor' && <TaylorPanel taylor={result.taylor} plotImage={result.plots?.taylor || ''} />}
          {result && activeTab === 'trapezoid' && <TrapezoidPanel trapezoid={result.trapezoid} plotImage={result.plots?.trapezoid || ''} />}
          {result && activeTab === 'double' && <DoubleIntegralPanel di={result.double_integral} plotImage={result.plots?.double_integral || ''} />}
          {result && activeTab === 'report' && <ReportPanel result={result} />}
        </div>
      </main>
    </div>
  );
}

function MethodFlowCard({ number, title, formula, color, bgColor }: {
  number: string; title: string; formula: string; color: string; bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-4 border border-white/50 shadow-sm card-hover`}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg`}>
        {number}
      </div>
      <h4 className="font-semibold text-gray-800 text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-500 font-mono">{formula}</p>
    </div>
  );
}
