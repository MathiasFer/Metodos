import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { EulerResult } from '../types';

interface Props { euler: EulerResult; plotImage: string }

export default function EulerPanel({ euler, plotImage }: Props) {
  const totalPoints = euler.dates.length;
  const sampleRate = Math.max(1, Math.floor(totalPoints / 200));

  const timeSeriesData = euler.dates
    .filter((_, i) => i % sampleRate === 0 || i === totalPoints - 1)
    .map((date, idx) => {
      const origIdx = euler.dates.indexOf(date);
      return {
        date,
        real: origIdx < euler.co_historical.length ? euler.co_historical[origIdx] : null,
        euler: euler.co_predicted[origIdx],
      };
    });

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const sMonthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: monthNames[i],
    value: euler.s_monthly[String(i + 1)] || 0,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-3xl p-8 text-white shadow-2xl shadow-red-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm">①</div>
              <div>
                <h2 className="text-3xl font-bold">Método de Euler</h2>
                <p className="text-red-100">Predicción temporal de CO</p>
              </div>
            </div>
            <p className="text-red-100 mt-2">Resolución de dC/dt = −k·C + S(t) con Método de Euler explícito (Δt = 1 día)</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">{euler.co_pred_at_target}</div>
            <div className="text-red-100 text-sm">µg/m³ predichos</div>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white text-sm">📝</span>
          Ecuación Diferencial
        </h3>
        <div className="font-mono text-sm text-gray-700 space-y-2 bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-lg"><strong>dC/dt</strong> = −k·C + S(t)</p>
          <p>C<sub>{'{n+1}'}</sub> = C<sub>n</sub> + Δt·(−k·C<sub>n</sub> + S(t<sub>n</sub>))</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">k = {euler.k} día⁻¹</span>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">MAE = {euler.mae} µg/m³</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="k calibrado" value={`${euler.k}`} unit="día⁻¹" icon="🔧" gradient="from-blue-500 to-cyan-400" />
        <StatCard label="MAE histórico" value={`${euler.mae}`} unit="µg/m³" icon="📏" gradient="from-green-500 to-emerald-400" />
        <StatCard label="CO predicho" value={`${euler.co_pred_at_target}`} unit="µg/m³" icon="🎯" gradient="from-purple-500 to-pink-400" accent />
      </div>

      {/* Matplotlib Plot */}
      {plotImage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-xl">📊</span>
              Gráfica Original — Método de Euler (Matplotlib)
            </h3>
          </div>
          <div className="p-6">
            <img src={`data:image/png;base64,${plotImage}`} alt="Euler Plot" className="w-full rounded-lg shadow-md" />
          </div>
        </div>
      )}

      {/* Interactive Charts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📈</span>
            Predicción CO Interactiva
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} tickFormatter={(v) => v.slice(5)} interval={Math.floor(timeSeriesData.length / 8)} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} label={{ value: 'CO (µg/m³)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(value: any, name: string) => [`${Number(value).toFixed(1)} µg/m³`, name === 'real' ? 'Datos reales' : 'Euler']} labelFormatter={(label) => `Fecha: ${label}`} />
              <Legend />
              <Line type="monotone" dataKey="real" stroke="#2e86de" strokeWidth={2} dot={false} name="Datos reales" connectNulls={false} />
              <Line type="monotone" dataKey="euler" stroke="#e74c3c" strokeWidth={2.5} strokeDasharray="8 4" dot={false} name="Euler" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* S(t) Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📊</span>
            Término Fuente S(t) — Media Mensual CSV
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} label={{ value: 'S(t) [µg/m³·día]', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#666' }} />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(0)} µg/m³·día`, 'S(t)']} contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#e74c3c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent, icon, gradient }: {
  label: string; value: string; unit: string; accent?: boolean; icon: string; gradient: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 card-hover ${accent ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg shadow-blue-100' : 'bg-white border-gray-100 shadow-lg'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shadow-lg`}>{icon}</div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-bold font-mono ${accent ? 'text-blue-700' : 'text-gray-800'}`}>{value}</p>
        <p className="text-sm text-gray-400">{unit}</p>
      </div>
    </div>
  );
}
