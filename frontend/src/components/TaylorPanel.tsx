import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { TaylorResult } from '../types';

interface Props { taylor: TaylorResult; plotImage: string }

export default function TaylorPanel({ taylor, plotImage }: Props) {
  const total = taylor.dates.length;
  const step = Math.max(1, Math.floor(total / 200));

  const comparisonData = taylor.dates
    .filter((_, i) => i % step === 0 || i === total - 1)
    .map((date) => {
      const idx = taylor.dates.indexOf(date);
      return { date, real: taylor.co_historical[idx], euler: taylor.co_euler[idx], taylor: taylor.co_taylor[idx] };
    });

  const errorData = taylor.dates
    .filter((_, i) => i % step === 0 || i === total - 1)
    .map((date) => {
      const idx = taylor.dates.indexOf(date);
      return { date, eulerErr: Math.abs(taylor.co_euler[idx] - taylor.co_historical[idx]), taylorErr: Math.abs(taylor.co_taylor[idx] - taylor.co_historical[idx]) };
    });

  const metricsData = [
    { name: 'MAE', Euler: taylor.mae_euler, Taylor: taylor.mae_taylor },
    { name: 'RMSE', Euler: taylor.rmse_euler, Taylor: taylor.rmse_taylor },
    { name: 'Error %', Euler: taylor.pct_euler, Taylor: taylor.pct_taylor },
  ];

  const delta = taylor.mae_taylor - taylor.mae_euler;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-8 text-white shadow-2xl shadow-green-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm">②</div>
              <div>
                <h2 className="text-3xl font-bold">Series de Taylor</h2>
                <p className="text-green-100">Corrección de 2° Orden</p>
              </div>
            </div>
            <p className="text-green-100 mt-2">C<sub>{'{n+1}'}</sub> = C<sub>n</sub> + Δt·f<sub>n</sub> + (Δt²/2)·f'<sub>n</sub></p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold font-mono ${delta < 0 ? 'text-green-200' : 'text-red-200'}`}>{delta >= 0 ? '+' : ''}{delta.toFixed(2)}</div>
            <div className="text-green-100 text-sm">Δ MAE (µg/m³)</div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="MAE Euler" value={`${taylor.mae_euler}`} sub="µg/m³" icon="📏" gradient="from-red-500 to-orange-400" />
        <MetricCard label="MAE Taylor" value={`${taylor.mae_taylor}`} sub={`Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`} icon="🎯" gradient="from-green-500 to-emerald-400" highlight={delta < 0 ? 'green' : delta > 0 ? 'red' : undefined} />
        <MetricCard label="RMSE Taylor" value={`${taylor.rmse_taylor}`} sub="µg/m³" icon="📊" gradient="from-purple-500 to-pink-400" />
        <MetricCard label="Error % Taylor" value={`${taylor.pct_taylor}`} sub="%" icon="📈" gradient="from-blue-500 to-cyan-400" />
      </div>

      {/* Matplotlib Plot */}
      {plotImage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-xl">📊</span>
              Gráfica Original — Series de Taylor (Matplotlib)
            </h3>
          </div>
          <div className="p-6">
            <img src={`data:image/png;base64,${plotImage}`} alt="Taylor Plot" className="w-full rounded-lg shadow-md" />
          </div>
        </div>
      )}

      {/* Interactive Charts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📈</span>
            Euler vs Taylor Interactivo
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} tickFormatter={(v) => v.slice(5)} interval={Math.floor(comparisonData.length / 8)} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="real" stroke="#2e86de" strokeWidth={1.5} dot={false} name="Real" connectNulls={false} />
              <Line type="monotone" dataKey="euler" stroke="#e74c3c" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Euler" />
              <Line type="monotone" dataKey="taylor" stroke="#27ae60" strokeWidth={2.5} dot={false} name="Taylor 2°" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📉</span>
            Error Absoluto Comparativo
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} tickFormatter={(v) => v.slice(5)} interval={Math.floor(errorData.length / 8)} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="eulerErr" stroke="#e74c3c" strokeWidth={2} dot={false} name={`Euler MAE=${taylor.mae_euler}`} />
              <Line type="monotone" dataKey="taylorErr" stroke="#27ae60" strokeWidth={2.5} dot={false} name={`Taylor MAE=${taylor.mae_taylor}`} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Bar Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📊</span>
            Métricas Comparativas (menor = mejor)
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="Euler" fill="#e74c3c" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Taylor" fill="#27ae60" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📋</span>
            Tabla Comparativa de Errores
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase tracking-wider text-xs">Método</th>
              <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase tracking-wider text-xs">MAE</th>
              <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase tracking-wider text-xs">RMSE</th>
              <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase tracking-wider text-xs">Error %</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
              <td className="px-6 py-4 font-semibold text-red-600">① Euler</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{taylor.mae_euler.toFixed(3)}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{taylor.rmse_euler.toFixed(3)}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{taylor.pct_euler.toFixed(2)}%</td>
            </tr>
            <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
              <td className="px-6 py-4 font-semibold text-green-600">② Taylor 2°</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{taylor.mae_taylor.toFixed(3)}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{taylor.rmse_taylor.toFixed(3)}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{taylor.pct_taylor.toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, highlight, icon, gradient }: {
  label: string; value: string; sub: string; highlight?: 'green' | 'red'; icon: string; gradient: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 card-hover ${
      highlight === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg shadow-green-100' :
      highlight === 'red' ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg shadow-red-100' :
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
