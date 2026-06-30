import axios from 'axios';
import type { SimulationResponse, CityInfoResponse, ParishesResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const plotsApi = axios.create({
  baseURL: '/api/plots',
  timeout: 60000,
  responseType: 'blob',
});

export async function getCityInfo(): Promise<CityInfoResponse> {
  const { data } = await api.get('/info');
  return data;
}

export async function runSimulation(targetDate: string): Promise<SimulationResponse> {
  const { data } = await api.post('/simulate', { target_date: targetDate });
  return data;
}

export async function getEulerPlot(targetDate: string): Promise<string> {
  const { data } = await plotsApi.post('/euler', { target_date: targetDate });
  return URL.createObjectURL(data);
}

export async function getTaylorPlot(targetDate: string): Promise<string> {
  const { data } = await plotsApi.post('/taylor', { target_date: targetDate });
  return URL.createObjectURL(data);
}

export async function getTrapezoidPlot(targetDate: string): Promise<string> {
  const { data } = await plotsApi.post('/trapezoid', { target_date: targetDate });
  return URL.createObjectURL(data);
}

export async function getDoubleIntegralPlot(targetDate: string): Promise<string> {
  const { data } = await plotsApi.post('/double', { target_date: targetDate });
  return URL.createObjectURL(data);
}

export async function getParishes(): Promise<ParishesResponse> {
  const { data } = await api.get('/parishes');
  return data;
}
