"""
Matplotlib plot generation for the Air Quality Prediction system.
Returns figures as PNG bytes for API consumption.
"""
import io
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# ── Colors
C = {
    "hist": "#2e86de", "euler": "#e74c3c", "taylor": "#27ae60",
    "pm25": "#8e44ad", "oms": "#f39c12", "bg": "#f9fafb",
}

# ── Compat NumPy >=2.0
_trapz = getattr(np, "trapezoid", None) or getattr(np, "trapz", None)


def _to_dt(dates: list) -> list:
    """Convert list of date strings to list of datetime objects for matplotlib."""
    return [pd.Timestamp(d).to_pydatetime() for d in dates]


def _fig_to_png(fig: plt.Figure) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=130, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return buf.read()


# ─── EULER PLOT ──────────────────────────────────────────────────────────────

def plot_euler(
    dates: list,
    co_predicted: list,
    co_historical: list,
    historical_dates: list,
    target_date: str,
    k: float,
    mae: float,
    s_monthly: dict,
) -> bytes:
    dt_dates = _to_dt(dates)
    dt_hist = _to_dt(historical_dates)
    dt_target = pd.Timestamp(target_date).to_pydatetime()

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    fig.patch.set_facecolor(C["bg"])

    ax1.set_facecolor("white")
    ax1.plot(dt_hist, co_historical, color=C["hist"], lw=1.2, alpha=0.7, label="Datos reales")
    ax1.plot(dt_dates, co_predicted, color=C["euler"], lw=1.8, ls="--", label="Euler")
    ax1.axvline(dt_target, color="black", ls=":", lw=1.5, label="Fecha objetivo")

    # Mark predicted value at target
    idx_t = sum(1 for d in dt_dates if d <= dt_target) - 1
    pred_val = co_predicted[max(0, idx_t)]
    ax1.scatter(
        [dt_target], [pred_val],
        color="black", zorder=5, s=70,
        label=f"CO pred. = {pred_val:.0f} µg/m³",
    )
    ax1.set_title(
        "Predicción CO — Método de Euler\n"
        r"$\frac{dC}{dt}=-k\,C+S(t)$",
        fontweight="bold",
    )
    ax1.set_xlabel("Fecha")
    ax1.set_ylabel("CO (µg/m³)")
    ax1.legend(fontsize=8)
    ax1.grid(alpha=0.3)
    ax1.tick_params(axis="x", rotation=30)

    ax2.set_facecolor("white")
    mn = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    vals = [s_monthly.get(str(m), s_monthly.get(m, 0)) for m in range(1, 13)]
    bars = ax2.bar(mn, vals, color=C["euler"], alpha=0.82, edgecolor="white")
    ax2.set_title(
        f"Término Fuente S(t) (media mensual CSV)\n"
        f"k = {k:.4f} día⁻¹  |  MAE = {mae:.1f} µg/m³",
        fontweight="bold",
    )
    ax2.set_xlabel("Mes")
    ax2.set_ylabel("S(t) [µg/m³·día]")
    ax2.grid(alpha=0.3, axis="y")
    for b, v in zip(bars, vals):
        ax2.text(b.get_x() + b.get_width() / 2, v + 3, f"{v:.0f}", ha="center", va="bottom", fontsize=7)

    fig.tight_layout()
    return _fig_to_png(fig)


# ─── TAYLOR PLOT ─────────────────────────────────────────────────────────────

def plot_taylor(
    dates: list,
    co_euler: list,
    co_taylor: list,
    co_historical: list,
    mae_euler: float,
    mae_taylor: float,
    rmse_euler: float,
    rmse_taylor: float,
    pct_euler: float,
    pct_taylor: float,
) -> bytes:
    dt_dates = _to_dt(dates)

    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(16, 5))
    fig.patch.set_facecolor(C["bg"])

    for ax in (ax1, ax2, ax3):
        ax.set_facecolor("white")

    ax1.plot(dt_dates, co_historical, color=C["hist"], lw=1.1, alpha=0.6, label="Real")
    ax1.plot(dt_dates, co_euler, color=C["euler"], lw=1.5, ls="--", label="Euler")
    ax1.plot(dt_dates, co_taylor, color=C["taylor"], lw=2.0, label="Taylor 2°")
    ax1.set_title("Euler vs Series de Taylor\n(período histórico)", fontweight="bold")
    ax1.set_xlabel("Fecha")
    ax1.set_ylabel("CO (µg/m³)")
    ax1.legend(fontsize=8)
    ax1.grid(alpha=0.3)
    ax1.tick_params(axis="x", rotation=30)

    err_e = np.abs(np.array(co_euler) - np.array(co_historical))
    err_t = np.abs(np.array(co_taylor) - np.array(co_historical))
    ax2.plot(dt_dates, err_e, color=C["euler"], lw=1.2, alpha=0.7, label=f"Euler  MAE={mae_euler:.1f}")
    ax2.plot(dt_dates, err_t, color=C["taylor"], lw=1.8, label=f"Taylor MAE={mae_taylor:.1f}")
    ax2.fill_between(dt_dates, err_e, alpha=0.13, color=C["euler"])
    ax2.fill_between(dt_dates, err_t, alpha=0.13, color=C["taylor"])
    ax2.set_title("Error Absoluto Comparativo", fontweight="bold")
    ax2.set_xlabel("Fecha")
    ax2.set_ylabel("|Pred − Real| (µg/m³)")
    ax2.legend(fontsize=8)
    ax2.grid(alpha=0.3)
    ax2.tick_params(axis="x", rotation=30)

    mets = ["MAE", "RMSE", "Error %"]
    ev = [mae_euler, rmse_euler, pct_euler]
    tv = [mae_taylor, rmse_taylor, pct_taylor]
    x = np.arange(3)
    w = 0.35
    ax3.bar(x - w / 2, ev, w, color=C["euler"], alpha=0.85, edgecolor="white", label="Euler")
    ax3.bar(x + w / 2, tv, w, color=C["taylor"], alpha=0.85, edgecolor="white", label="Taylor")
    ax3.set_xticks(x)
    ax3.set_xticklabels(mets)
    ax3.set_title("Métricas Comparativas\n(menor = mejor)", fontweight="bold")
    ax3.set_ylabel("Valor")
    ax3.legend(fontsize=8)
    ax3.grid(alpha=0.3, axis="y")
    for i, (e, tv_) in enumerate(zip(ev, tv)):
        ax3.text(i - w / 2, e + 0.5, f"{e:.2f}", ha="center", fontsize=8, color=C["euler"])
        ax3.text(i + w / 2, tv_ + 0.5, f"{tv_:.2f}", ha="center", fontsize=8, color=C["taylor"])

    fig.tight_layout()
    return _fig_to_png(fig)


# ─── TRAPECIO PLOT ───────────────────────────────────────────────────────────

def plot_trapecio(
    monthly_hist_labels: list,
    monthly_hist_doses: list,
    total_hist: float,
    days_over_hist: int,
    oms_limit: float,
    df_dates: list,
    df_pm25: list,
) -> bytes:
    dt_dates = _to_dt(df_dates)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    fig.patch.set_facecolor(C["bg"])
    ax1.set_facecolor("white")
    ax2.set_facecolor("white")

    ax1.plot(dt_dates, df_pm25, color=C["pm25"], lw=1.3, label="PM2.5 histórico")
    ax1.axhline(oms_limit, color=C["oms"], lw=2, ls="--", label=f"Límite OMS = {oms_limit} µg/m³")
    ax1.fill_between(
        dt_dates, df_pm25, oms_limit,
        where=(np.array(df_pm25) > oms_limit),
        color="#e74c3c", alpha=0.35, label="Excede OMS",
    )
    ax1.fill_between(
        dt_dates, 0, df_pm25,
        where=(np.array(df_pm25) <= oms_limit),
        color=C["pm25"], alpha=0.12, label="Bajo límite OMS",
    )
    ax1.set_title(
        r"PM2.5 Histórico — Área Bajo la Curva" "\n"
        r"Dosis = $\int C(t)\,dt$  (Regla del Trapecio)",
        fontweight="bold",
    )
    ax1.set_xlabel("Fecha")
    ax1.set_ylabel("PM2.5 (µg/m³)")
    ax1.legend(fontsize=8)
    ax1.grid(alpha=0.3)
    ax1.tick_params(axis="x", rotation=30)

    oms_m = oms_limit * 28
    colors = ["#e74c3c" if d > oms_m else C["pm25"] for d in monthly_hist_doses]
    ax2.bar(range(len(monthly_hist_labels)), monthly_hist_doses, color=colors, alpha=0.85, edgecolor="white")
    ax2.axhline(oms_m, color=C["oms"], lw=2, ls="--", label=f"Límite mensual OMS ≈ {oms_m:.0f} µg/m³·días")
    step = max(1, len(monthly_hist_labels) // 12)
    ax2.set_xticks(range(0, len(monthly_hist_labels), step))
    ax2.set_xticklabels(
        [monthly_hist_labels[i] for i in range(0, len(monthly_hist_labels), step)],
        rotation=45, ha="right", fontsize=8,
    )
    ax2.set_title(
        f"Dosis Mensual Acumulada de PM2.5\n"
        f"Total: {total_hist:.0f} µg/m³·días  |  Días > OMS: {days_over_hist}",
        fontweight="bold",
    )
    ax2.set_xlabel("Período")
    ax2.set_ylabel("Dosis (µg/m³·días)")
    ax2.legend(fontsize=8)
    ax2.grid(alpha=0.3, axis="y")
    fig.tight_layout()
    return _fig_to_png(fig)


# ─── DOUBLE INTEGRAL PLOT ────────────────────────────────────────────────────

def plot_double_integral(
    heatmap: list,
    lon_range: list,
    lat_range: list,
    mass_kg: float,
    mass_ton: float,
    c0_ug: float,
    lon0: float,
    lat0: float,
    target_date: str,
) -> bytes:
    Z_ug = np.array(heatmap) * 1e9  # kg/m³ → µg/m³
    rows, cols = Z_ug.shape
    lon_arr = np.linspace(lon_range[0], lon_range[1], cols)
    lat_arr = np.linspace(lat_range[0], lat_range[1], rows)
    X, Y = np.meshgrid(lon_arr, lat_arr)

    fig = plt.figure(figsize=(17, 6))
    fig.patch.set_facecolor(C["bg"])

    # ── 1. 2D Heatmap
    ax1 = fig.add_subplot(1, 3, 1)
    cf = ax1.contourf(X, Y, Z_ug, levels=60, cmap="YlOrRd")
    ax1.contour(X, Y, Z_ug, levels=10, colors="white", linewidths=0.4, alpha=0.5)
    plt.colorbar(cf, ax=ax1, label="CO (µg/m³)")
    ax1.scatter([lon0], [lat0], color="black", s=100, zorder=6, marker="*", label="Centro Quito")
    ax1.set_title("Mapa de Calor 2D\nDistribución Espacial de CO", fontweight="bold")
    ax1.set_xlabel("Longitud (°)")
    ax1.set_ylabel("Latitud (°)")
    ax1.legend(fontsize=8)

    # ── 2. 3D Surface
    ax2 = fig.add_subplot(1, 3, 2, projection="3d")
    surf = ax2.plot_surface(X, Y, Z_ug, cmap="YlOrRd", alpha=0.9, linewidth=0, antialiased=True)
    fig.colorbar(surf, ax=ax2, shrink=0.5, label="CO (µg/m³)")
    ax2.set_title(
        "Superficie 3D de Concentración\n"
        r"$C(x,y)=C_0 e^{-\alpha(x-x_0)^2}e^{-\beta(y-y_0)^2}$",
        fontsize=9, fontweight="bold",
    )
    ax2.set_xlabel("Lon")
    ax2.set_ylabel("Lat")
    ax2.set_zlabel("CO (µg/m³)")
    ax2.view_init(elev=30, azim=-60)

    # ── 3. Isometric with peak
    ax3 = fig.add_subplot(1, 3, 3, projection="3d")
    ax3.plot_surface(X, Y, Z_ug, cmap="plasma", alpha=0.88, linewidth=0, antialiased=True)
    pi = np.unravel_index(np.argmax(Z_ug), Z_ug.shape)
    ax3.scatter(
        [X[pi]], [Y[pi]], [Z_ug[pi]],
        color="cyan", s=90, zorder=10,
        label=f"Pico: {Z_ug[pi]:.1f} µg/m³",
    )
    ax3.set_title(
        f"Vista Isométrica / Relieve\n"
        f"Masa total: {mass_ton:.3f} toneladas de CO",
        fontsize=9, fontweight="bold",
    )
    ax3.set_xlabel("Lon")
    ax3.set_ylabel("Lat")
    ax3.set_zlabel("CO (µg/m³)")
    ax3.view_init(elev=45, azim=45)
    ax3.legend(fontsize=8)

    fig.tight_layout()
    return _fig_to_png(fig)
