"""
Pydantic models for API request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import List, Optional


# ─── Request ────────────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    target_date: str = Field(
        ...,
        description="Target prediction date in YYYY-MM-DD format",
        examples=["2026-06-15"],
    )


# ─── Shared ─────────────────────────────────────────────────────────────────

class CityInfo(BaseModel):
    name: str
    latitude: float
    longitude: float
    population: int


class DataSummary(BaseModel):
    total_records: int
    date_range_start: str
    date_range_end: str
    co_mean: float
    pm25_mean: float


# ─── Euler ──────────────────────────────────────────────────────────────────

class EulerResult(BaseModel):
    dates: List[str]
    co_predicted: List[float]
    co_historical: List[float]
    historical_dates: List[str]
    mae: float
    k: float
    s_monthly: dict  # month number -> value
    co_pred_at_target: float
    target_date: str


# ─── Taylor ─────────────────────────────────────────────────────────────────

class TaylorResult(BaseModel):
    dates: List[str]
    co_euler: List[float]
    co_taylor: List[float]
    co_historical: List[float]
    mae_euler: float
    mae_taylor: float
    rmse_euler: float
    rmse_taylor: float
    pct_euler: float
    pct_taylor: float


# ─── Trapezoid ──────────────────────────────────────────────────────────────

class MonthlyDose(BaseModel):
    label: str
    dose: float

class TrapezoidResult(BaseModel):
    monthly_hist: List[MonthlyDose]
    monthly_fut: List[MonthlyDose]
    total_hist: float
    total_fut: float
    oms_limit: float
    days_over_hist: int
    days_over_fut: int
    n_historical: int
    n_future: int


# ─── Double Integral ────────────────────────────────────────────────────────

class DoubleIntegralResult(BaseModel):
    heatmap: List[List[float]]  # 2D grid for contour
    lon_range: List[float]      # [min, max]
    lat_range: List[float]      # [min, max]
    mass_kg: float
    mass_ton: float
    c0_ug: float
    lon0: float
    lat0: float
    target_date: str


# ─── Plots (base64 PNG) ─────────────────────────────────────────────────────

class PlotsData(BaseModel):
    euler: str = ""        # base64 PNG
    taylor: str = ""       # base64 PNG
    trapezoid: str = ""    # base64 PNG
    double_integral: str = ""  # base64 PNG


# ─── Combined Response ──────────────────────────────────────────────────────

class SimulationResponse(BaseModel):
    city: CityInfo
    summary: DataSummary
    euler: EulerResult
    taylor: TaylorResult
    trapezoid: TrapezoidResult
    double_integral: DoubleIntegralResult
    n_future_days: int
    plots: PlotsData = PlotsData()
