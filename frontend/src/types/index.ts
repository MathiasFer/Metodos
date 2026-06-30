export interface CityInfo {
  name: string;
  latitude: number;
  longitude: number;
  population: number;
}

export interface DataSummary {
  total_records: number;
  date_range_start: string;
  date_range_end: string;
  co_mean: number;
  pm25_mean: number;
}

export interface EulerResult {
  dates: string[];
  co_predicted: number[];
  co_historical: number[];
  historical_dates: string[];
  mae: number;
  k: number;
  s_monthly: Record<string, number>;
  co_pred_at_target: number;
  target_date: string;
}

export interface TaylorResult {
  dates: string[];
  co_euler: number[];
  co_taylor: number[];
  co_historical: number[];
  mae_euler: number;
  mae_taylor: number;
  rmse_euler: number;
  rmse_taylor: number;
  pct_euler: number;
  pct_taylor: number;
}

export interface MonthlyDose {
  label: string;
  dose: number;
}

export interface TrapezoidResult {
  monthly_hist: MonthlyDose[];
  monthly_fut: MonthlyDose[];
  total_hist: number;
  total_fut: number;
  oms_limit: number;
  days_over_hist: number;
  days_over_fut: number;
  n_historical: number;
  n_future: number;
}

export interface DoubleIntegralResult {
  heatmap: number[][];
  lon_range: number[];
  lat_range: number[];
  mass_kg: number;
  mass_ton: number;
  c0_ug: number;
  lon0: number;
  lat0: number;
  target_date: string;
}

export interface PlotsData {
  euler: string;
  taylor: string;
  trapezoid: string;
  double_integral: string;
}

export interface SimulationResponse {
  city: CityInfo;
  summary: DataSummary;
  euler: EulerResult;
  taylor: TaylorResult;
  trapezoid: TrapezoidResult;
  double_integral: DoubleIntegralResult;
  n_future_days: number;
  plots: PlotsData;
}

export interface CityInfoResponse {
  city: CityInfo;
  summary: DataSummary;
}
