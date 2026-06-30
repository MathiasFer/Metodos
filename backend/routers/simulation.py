"""
Simulation API router — endpoints for running numerical methods.
"""
import base64
import pandas as pd
from fastapi import APIRouter, HTTPException
from models.schemas import SimulationRequest, SimulationResponse, PlotsData, ParishesResponse
from services.data_loader import load_data, get_summary, load_parishes
from services.euler import compute_euler
from services.taylor import compute_taylor
from services.trapezoid import compute_trapezoid
from services.double_integral import compute_double_integral
from services.plots import plot_euler, plot_taylor, plot_trapecio, plot_double_integral

router = APIRouter(prefix="/api", tags=["simulation"])

# ─── Cache data at startup ──────────────────────────────────────────────────
_cached_df: pd.DataFrame | None = None
_cached_city = None


def _ensure_loaded():
    global _cached_df, _cached_city
    if _cached_df is None:
        _cached_df, _cached_city = load_data()
    return _cached_df, _cached_city


def _bytes_to_b64(png_bytes: bytes) -> str:
    return base64.b64encode(png_bytes).decode("utf-8")


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/info")
def get_city_info():
    """Return city info and dataset summary."""
    df, city = _ensure_loaded()
    return {
        "city": city.model_dump(),
        "summary": get_summary(df).model_dump(),
    }


@router.post("/simulate", response_model=SimulationResponse)
def run_simulation(req: SimulationRequest):
    """Run the full 4-method simulation chain and generate matplotlib plots."""
    df, city = _ensure_loaded()

    try:
        target_date = pd.Timestamp(req.target_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if target_date <= df["date"].max():
        raise HTTPException(
            status_code=400,
            detail=f"Target date must be after {df['date'].max().date()}.",
        )

    # ① Euler
    euler = compute_euler(df, target_date)

    # ② Taylor (uses Euler results)
    s_monthly_int = {int(k): v for k, v in euler.s_monthly.items()}
    taylor = compute_taylor(df, euler.co_predicted, euler.k, s_monthly_int)

    # ③ Trapezoid
    trap = compute_trapezoid(df, target_date)

    # ④ Double Integral
    di = compute_double_integral(
        df,
        city.longitude,
        city.latitude,
        euler.co_pred_at_target,
        euler.target_date,
    )

    n_future = max(0, (target_date - df["date"].iloc[-1]).days)

    # Generate matplotlib plots
    plots = PlotsData()
    try:
        plots.euler = _bytes_to_b64(plot_euler(
            dates=euler.dates,
            co_predicted=euler.co_predicted,
            co_historical=euler.co_historical,
            historical_dates=euler.historical_dates,
            target_date=euler.target_date,
            k=euler.k,
            mae=euler.mae,
            s_monthly=euler.s_monthly,
        ))
    except Exception as e:
        print(f"Plot euler error: {e}")

    try:
        plots.taylor = _bytes_to_b64(plot_taylor(
            dates=taylor.dates,
            co_euler=taylor.co_euler,
            co_taylor=taylor.co_taylor,
            co_historical=taylor.co_historical,
            mae_euler=taylor.mae_euler,
            mae_taylor=taylor.mae_taylor,
            rmse_euler=taylor.rmse_euler,
            rmse_taylor=taylor.rmse_taylor,
            pct_euler=taylor.pct_euler,
            pct_taylor=taylor.pct_taylor,
        ))
    except Exception as e:
        print(f"Plot taylor error: {e}")

    try:
        plots.trapezoid = _bytes_to_b64(plot_trapecio(
            monthly_hist_labels=[d.label for d in trap.monthly_hist],
            monthly_hist_doses=[d.dose for d in trap.monthly_hist],
            total_hist=trap.total_hist,
            days_over_hist=trap.days_over_hist,
            oms_limit=trap.oms_limit,
            df_dates=df["date"].tolist(),
            df_pm25=df["pm2_5"].tolist(),
        ))
    except Exception as e:
        print(f"Plot trapezoid error: {e}")

    try:
        plots.double_integral = _bytes_to_b64(plot_double_integral(
            heatmap=di.heatmap,
            lon_range=di.lon_range,
            lat_range=di.lat_range,
            mass_kg=di.mass_kg,
            mass_ton=di.mass_ton,
            c0_ug=di.c0_ug,
            lon0=di.lon0,
            lat0=di.lat0,
            target_date=di.target_date,
        ))
    except Exception as e:
        print(f"Plot double error: {e}")

    return SimulationResponse(
        city=city,
        summary=get_summary(df),
        euler=euler,
        taylor=taylor,
        trapezoid=trap,
        double_integral=di,
        n_future_days=n_future,
        plots=plots,
    )


@router.get("/parishes")
def get_parishes():
    """Return parish data with contamination levels."""
    df, _ = _ensure_loaded()
    parishes = load_parishes(df)
    return ParishesResponse(parishes=parishes)
