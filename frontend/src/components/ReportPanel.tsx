import type { SimulationResponse } from '../types';

interface Props { result: SimulationResponse }

export default function ReportPanel({ result }: Props) {
  const { euler, taylor, trapezoid, double_integral, city, n_future_days } = result;

  const reportData = [
    {
      method: '① Euler',
      variable: 'CO (µg/m³)',
      result: `${euler.co_pred_at_target}`,
      precision: `MAE=${euler.mae}`,
      feeds: 'Taylor, Trapecio, Doble',
      gradient: 'from-red-500 to-orange-400',
      icon: '🔬',
    },
    {
      method: '② Taylor 2°',
      variable: 'CO (µg/m³)',
      result: `${euler.co_pred_at_target}`,
      precision: `MAE=${taylor.mae_taylor}`,
      feeds: 'Validación interna',
      gradient: 'from-green-500 to-emerald-400',
      icon: '📐',
    },
    {
      method: '③ Trapecio (PM2.5)',
      variable: 'Dosis PM2.5 (µg/m³·días)',
      result: `${trapezoid.total_fut}`,
      precision: `${trapezoid.days_over_fut} días > OMS`,
      feeds: 'Análisis de riesgo poblacional',
      gradient: 'from-purple-500 to-pink-400',
      icon: '📊',
    },
    {
      method: '④ Integral Doble',
      variable: 'Masa CO (ton)',
      result: `${double_integral.mass_ton}`,
      precision: `C₀=${double_integral.c0_ug} µg/m³`,
      feeds: 'Estimación espacial final',
      gradient: 'from-indigo-500 to-violet-400',
      icon: '🌍',
    },
  ];

  const pctOver = ((trapezoid.days_over_hist / trapezoid.n_historical) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-8 text-white shadow-2xl shadow-amber-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm">
                📋
              </div>
              <div>
                <h2 className="text-3xl font-bold">Reporte Científico Final</h2>
                <p className="text-amber-100">Análisis completo de calidad del aire</p>
              </div>
            </div>
            <p className="text-amber-100 mt-2">
              Fecha objetivo: {euler.target_date} | Días proyectados: {n_future_days} | Ciudad: {city.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">{double_integral.mass_ton}</div>
            <div className="text-amber-100 text-sm">toneladas de CO</div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📊</span>
            Resumen de Resultados por Método
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase tracking-wider text-xs">Método</th>
                <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase tracking-wider text-xs">Variable</th>
                <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase tracking-wider text-xs">Resultado</th>
                <th className="px-6 py-4 text-right text-gray-500 font-semibold uppercase tracking-wider text-xs">Precisión</th>
                <th className="px-6 py-4 text-left text-gray-500 font-semibold uppercase tracking-wider text-xs">Alimenta a</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-6 py-4 font-semibold text-gray-800 flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${row.gradient} flex items-center justify-center text-white text-lg shadow-lg`}>
                      {row.icon}
                    </span>
                    {row.method}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{row.variable}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-800 text-lg">{row.result}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-600">{row.precision}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{row.feeds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert */}
      <div className={`rounded-2xl p-6 shadow-lg ${parseFloat(pctOver) > 50 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-amber-100' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-green-100'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg ${parseFloat(pctOver) > 50 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'}`}>
            {parseFloat(pctOver) > 50 ? '⚠️' : '✅'}
          </div>
          <div>
            <h4 className={`font-semibold mb-1 ${parseFloat(pctOver) > 50 ? 'text-amber-900' : 'text-green-900'}`}>
              {parseFloat(pctOver) > 50 ? 'Alerta de Calidad del Aire' : 'Calidad Aceptable'}
            </h4>
            <p className={`text-sm leading-relaxed ${parseFloat(pctOver) > 50 ? 'text-amber-800' : 'text-green-800'}`}>
              El <strong className={parseFloat(pctOver) > 50 ? 'text-amber-900' : 'text-green-900'}>{pctOver}%</strong> de los días históricos supera el límite OMS de PM2.5.
              Se estiman <strong className={parseFloat(pctOver) > 50 ? 'text-amber-900' : 'text-green-900'}>{double_integral.mass_ton} toneladas</strong> de CO sobre Quito al {euler.target_date}.
              <strong className={parseFloat(pctOver) > 50 ? 'text-amber-900' : 'text-green-900'}> {trapezoid.days_over_fut}</strong> de los próximos {n_future_days} días proyectados también superarán el límite.
            </p>
          </div>
        </div>
      </div>

      {/* Conclusion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">📝</span>
            Conclusión Metodológica
          </h3>
        </div>
        <div className="p-6">
          <div className="text-sm text-gray-600 leading-relaxed space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-blue-800">
                El sistema demuestra la cadena numérica completa:
                el <strong>Método de Euler</strong> resuelve la EDO dC/dt = −kC + S(t) para obtener la trayectoria temporal
                del CO; las <strong>Series de Taylor</strong> incorporan la segunda derivada para reducir el error de truncación;
                la <strong>Regla del Trapecio</strong> integra la dosis acumulada de PM2.5; y la <strong>Integral Doble</strong> proyecta
                esa concentración sobre el espacio geográfico de Quito, cuantificando la masa total de contaminante
                en la atmósfera urbana.
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
              <p className="text-green-800">
                Cada método alimenta al siguiente, garantizando la coherencia física
                y matemática de las predicciones. Los datos provienen de mediciones reales de calidad del aire
                en Quito ({result.summary.total_records.toLocaleString()} registros, {result.summary.date_range_start} → {result.summary.date_range_end}).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🔍</span>
            Hallazgos Clave
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FindingCard
              icon="🔬"
              title="Métodos Numéricos"
              desc={`Euler MAE: ${euler.mae} µg/m³ → Taylor MAE: ${taylor.mae_taylor} µg/m³ (mejora de ${(taylor.mae_euler - taylor.mae_taylor).toFixed(2)} µg/m³)`}
              gradient="from-red-500 to-orange-400"
            />
            <FindingCard
              icon="🏭"
              title="Calidad del Aire"
              desc={`CO promedio: ${result.summary.co_mean} µg/m³ | PM2.5 promedio: ${result.summary.pm25_mean} µg/m³`}
              gradient="from-blue-500 to-cyan-400"
            />
            <FindingCard
              icon="⚠️"
              title="Impacto OMS"
              desc={`${trapezoid.days_over_hist} de ${trapezoid.n_historical} días (${pctOver}%) superan el límite OMS de ${trapezoid.oms_limit} µg/m³`}
              gradient="from-amber-500 to-yellow-400"
            />
            <FindingCard
              icon="🌍"
              title="Masa Atmosférica"
              desc={`${double_integral.mass_ton} toneladas de CO sobre un área de 0.6°×0.8° centrada en Quito`}
              gradient="from-purple-500 to-pink-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FindingCard({ icon, title, desc, gradient }: { icon: string; title: string; desc: string; gradient: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-100 shadow-md card-hover">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm mb-1">{title}</p>
          <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
