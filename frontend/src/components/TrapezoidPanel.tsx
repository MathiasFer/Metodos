import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import type { TrapezoidResult } from '../types';

interface Props { trapezoid: TrapezoidResult; plotImage: string }

export default function TrapezoidPanel({ trapezoid, plotImage }: Props) {
  const allDoses = [...trapezoid.monthly_hist, ...trapezoid.monthly_fut];
  const step = Math.max(1, Math.floor(allDoses.length / 30));
  const sampledDoses = allDoses.filter((_, i) => i % step === 0);
  const omsMonthly = trapezoid.oms_limit * 28;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-3xl p-8 text-white shadow-2xl shadow-purple-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm">③</div>
              <div>
                <h2 className="text-3xl font-bold">Regla del Trapecio</h2>
                <p className="text-purple-100">Dosis Acumulada PM2.5</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">{trapezoid.total_fut}</div>
            <div className="text-purple-100 text-sm">µg/m³·días futura</div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Dosis histórica" value={`${trapezoid.total_hist}`} sub="µg/m³·días" icon="📊" gradient="from-blue-500 to-cyan-400" />
        <MetricCard label="Dosis futura" value={`${trapezoid.total_fut}`} sub="µg/m³·días" icon="🔮" gradient="from-purple-500 to-pink-400" />
        <MetricCard label="Días hist. > OMS" value={`${trapezoid.days_over_hist}`} sub={`de ${trapezoid.n_historical}`} icon="⚠️" gradient="from-red-500 to-orange-400" highlight={trapezoid.days_over_hist > trapezoid.n_historical / 2 ? 'red' : 'green'} />
        <MetricCard label="Días futuros > OMS" value={`${trapezoid.days_over_fut}`} sub={`de ${trapezoid.n_future}`} icon="📅" gradient="from-amber-500 to-yellow-400" />
      </div>

      {/* Matplotlib Plot */}
      {plotImage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-xl">📊</span>
              Gráfica Original — Regla del Trapecio (Matplotlib)
            </h3>
          </div>
          <div className="p-6">
            <img src={`data:image/png;base64,${plotImage}`} alt="Trapezoid Plot" className="w-full rounded-lg shadow-md" />
          </div>
        </div>
      )}

      {/* Interactive Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📈</span>
            Dosis Mensual Interactiva
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sampledDoses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#666' }} angle={-45} textAnchor="end" height={60} interval={Math.floor(sampledDoses.length / 15)} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(v: any) => [`${Number(v).toFixed(0)} µg/m³·días`, 'Dosis']} />
              <ReferenceLine y={omsMonthly} stroke="#f39c12" strokeDasharray="5 5" label={{ value: `OMS`, fontSize: 10, fill: '#f39c12' }} />
              <Bar dataKey="dose" radius={[4, 4, 0, 0]}>
                {sampledDoses.map((entry, i) => (
                  <Cell key={i} fill={entry.dose > omsMonthly ? '#e74c3c' : '#8e44ad'} opacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🔥</span>
            Top 5 Períodos de Mayor Dosis
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase text-xs">#</th>
              <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase text-xs">Período</th>
              <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase text-xs">Dosis</th>
            </tr>
          </thead>
          <tbody>
            {[...trapezoid.monthly_hist].sort((a, b) => b.dose - a.dose).slice(0, 5).map((row, i) => (
              <tr key={i} className={`border-b border-gray-100 ${i === 0 ? 'bg-gradient-to-r from-red-50 to-orange-50' : ''}`}>
                <td className="px-6 py-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-gradient-to-br from-red-500 to-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                </td>
                <td className="px-6 py-4 font-mono font-semibold">{row.label}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-red-600">{row.dose.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, highlight, icon, gradient }: {
  label: string; value: string; sub: string; highlight?: 'red' | 'green'; icon: string; gradient: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 card-hover ${
      highlight === 'red' ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg shadow-red-100' :
      highlight === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg shadow-green-100' :
      'bg-white border-gray-100 shadow-lg'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shadow-lg`}>{icon}</div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-800 font-mono">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
    </div>
  );
}
