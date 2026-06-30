import type { SimulationResponse } from '../types';

interface Props {
  result: SimulationResponse;
}

export default function Dashboard({ result }: Props) {
  const { euler, taylor, trapezoid, double_integral, city, summary, n_future_days } = result;

  const pctOver = ((trapezoid.days_over_hist / trapezoid.n_historical) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Resultados para {euler.target_date}
            </h2>
            <p className="text-blue-100 text-lg">
              {n_future_days} días en el futuro — {city.name}, Ecuador
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Población: {city.population.toLocaleString()} habitantes | Lat: {city.latitude}° | Lon: {city.longitude}°
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold font-mono">{double_integral.mass_ton}</div>
            <div className="text-blue-200 text-sm">toneladas de CO</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CO predicho (Euler)"
          value={`${euler.co_pred_at_target}`}
          unit="µg/m³"
          subtitle={`MAE: ${euler.mae}`}
          gradient="from-blue-500 to-cyan-400"
          icon="🔬"
        />
        <MetricCard
          title="CO predicho (Taylor)"
          value={`${euler.co_pred_at_target}`}
          unit="µg/m³"
          subtitle={`MAE: ${taylor.mae_taylor}`}
          gradient="from-green-500 to-emerald-400"
          icon="📐"
        />
        <MetricCard
          title="Masa CO sobre Quito"
          value={`${double_integral.mass_ton}`}
          unit="ton"
          subtitle={`${double_integral.mass_kg} kg`}
          gradient="from-purple-500 to-pink-400"
          icon="🌍"
        />
        <MetricCard
          title="Días PM2.5 > OMS"
          value={`${trapezoid.days_over_hist}`}
          unit={`/ ${trapezoid.n_historical}`}
          subtitle={`${pctOver}% del total`}
          gradient={parseFloat(pctOver) > 50 ? 'from-red-500 to-orange-400' : 'from-amber-500 to-yellow-400'}
          icon="⚠️"
        />
      </div>

      {/* Method Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MethodCard
          number="①"
          title="Euler"
          lines={[`k = ${euler.k} día⁻¹`, `MAE = ${euler.mae} µg/m³`]}
          gradient="from-red-500 to-orange-400"
          description="Ecuación diferencial ordinaria"
        />
        <MethodCard
          number="②"
          title="Taylor"
          lines={[`ΔMAE = ${(euler.mae - taylor.mae_taylor) >= 0 ? '+' : ''}${(euler.mae - taylor.mae_taylor).toFixed(2)}`, `RMSE = ${taylor.rmse_taylor}`]}
          gradient="from-green-500 to-emerald-400"
          description="Serie de segundo orden"
        />
        <MethodCard
          number="③"
          title="Trapecio"
          lines={[`Dosis: ${trapezoid.total_hist} µg/m³·d`, `Días > OMS: ${trapezoid.days_over_hist}`]}
          gradient="from-purple-500 to-pink-400"
          description="Integral numérica compuesta"
        />
        <MethodCard
          number="④"
          title="Integral Doble"
          lines={[`C₀ = ${double_integral.c0_ug} µg/m³`, `M = ${double_integral.mass_ton} ton`]}
          gradient="from-indigo-500 to-violet-400"
          description="Masa atmosférica 2D"
        />
      </div>

      {/* Alert */}
      {parseFloat(pctOver) > 50 ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-lg shadow-amber-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl shadow-lg">
              ⚠️
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Alerta de Calidad del Aire</h4>
              <p className="text-amber-800 text-sm leading-relaxed">
                El <strong className="text-amber-900">{pctOver}%</strong> de los días históricos supera el límite OMS de PM2.5.
                Se estiman <strong className="text-amber-900">{double_integral.mass_ton} toneladas</strong> de CO sobre Quito al {euler.target_date}.
                <strong className="text-amber-900"> {trapezoid.days_over_fut}</strong> de los próximos {n_future_days} días proyectados también superarán el límite.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg shadow-green-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl shadow-lg">
              ✅
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Calidad Aceptable</h4>
              <p className="text-green-800 text-sm leading-relaxed">
                El <strong className="text-green-900">{pctOver}%</strong> de los días históricos supera el límite OMS.
                Masa estimada de CO: <strong className="text-green-900">{double_integral.mass_ton} ton</strong> al {euler.target_date}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="Datos Históricos"
          value={`${summary.total_records.toLocaleString()}`}
          subtitle={`registros del ${summary.date_range_start} al ${summary.date_range_end}`}
          icon="📊"
          gradient="from-blue-500 to-cyan-400"
        />
        <InfoCard
          title="Concentración CO"
          value={`${summary.co_mean}`}
          subtitle="µg/m³ promedio histórico"
          icon="💨"
          gradient="from-orange-500 to-red-400"
        />
        <InfoCard
          title="Concentración PM2.5"
          value={`${summary.pm25_mean}`}
          subtitle="µg/m³ promedio histórico"
          icon="🌫️"
          gradient="from-purple-500 to-pink-400"
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, subtitle, gradient, icon }: {
  title: string; value: string; unit: string; subtitle: string; gradient: string; icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden card-hover">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-800 font-mono">{value}</p>
          <p className="text-sm text-gray-400">{unit}</p>
        </div>
        <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

function MethodCard({ number, title, lines, gradient, description }: {
  number: string; title: string; lines: string[]; gradient: string; description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5 card-hover">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
          {number}
        </div>
        <div>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          <p className="text-[10px] text-gray-400">{description}</p>
        </div>
      </div>
      {lines.map((line, i) => (
        <p key={i} className="text-xs text-gray-600 font-mono bg-gray-50 rounded-lg px-3 py-1.5 mt-1">{line}</p>
      ))}
    </div>
  );
}

function InfoCard({ title, value, subtitle, icon, gradient }: {
  title: string; value: string; subtitle: string; icon: string; gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden card-hover">
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl shadow-lg`}>
            {icon}
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        </div>
        <p className="text-2xl font-bold text-gray-800 font-mono">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
