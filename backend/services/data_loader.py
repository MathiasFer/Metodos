"""
Data loading service — reads CSVs with caching.
"""
import json
import math
import pandas as pd
from config import AIR_QUALITY_CSV, CITY_INFO_CSV, PARROQUIAS_CSV
from models.schemas import CityInfo, DataSummary, ParishData


def load_data() -> tuple[pd.DataFrame, CityInfo]:
    """Load air quality CSV and city info, return (df, city)."""
    df = pd.read_csv(str(AIR_QUALITY_CSV), parse_dates=["date"])
    df = df.dropna(subset=["carbon_monoxide", "pm2_5"])
    df = df.sort_values("date").reset_index(drop=True)
    df["month"] = df["date"].dt.month
    df["year"] = df["date"].dt.year

    cr = pd.read_csv(str(CITY_INFO_CSV)).iloc[0]
    city = CityInfo(
        name=str(cr["city_name"]),
        latitude=float(cr["latitude"]),
        longitude=float(cr["longitude"]),
        population=int(cr["population"]),
    )
    return df, city


def get_summary(df: pd.DataFrame) -> DataSummary:
    """Generate summary statistics from the dataframe."""
    return DataSummary(
        total_records=len(df),
        date_range_start=str(df["date"].min().date()),
        date_range_end=str(df["date"].max().date()),
        co_mean=round(float(df["carbon_monoxide"].mean()), 1),
        pm25_mean=round(float(df["pm2_5"].mean()), 2),
    )


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two lat/lon points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def load_parishes(df: pd.DataFrame) -> list[ParishData]:
    """Load parroquias CSV and compute contamination levels based on air quality data."""
    pdf = pd.read_csv(str(PARROQUIAS_CSV))

    # Compute monitoring station center from historical data
    station_lat = float(df["latitud"].mean())
    station_lon = float(df["longitud"].mean())

    # Mean concentrations from data
    co_mean = float(df["carbon_monoxide"].mean())
    pm25_mean = float(df["pm2_5"].mean())

    # Gaussian model parameters (from double_integral logic)
    lons = df["longitud"].dropna().values
    lats = df["latitud"].dropna().values
    sl = float(lons.std()) or 0.05
    sb = float(lats.std()) or 0.05
    alpha = 1.0 / (2 * sl ** 2)
    beta = 1.0 / (2 * sb ** 2)

    # Max distance for normalization
    max_dist = 15.0  # km — approximate max extent of Quito

    parishes = []
    for _, row in pdf.iterrows():
        lat = float(row["latitude"])
        lon = float(row["longitude"])
        polygon_str = str(row["polygon"])
        polygon = json.loads(polygon_str) if polygon_str.startswith("[") else []

        # Distance from monitoring station
        dist = _haversine(station_lat, station_lon, lat, lon)

        # Gaussian decay factor (0 = at station, 1 = far away)
        gauss_factor = math.exp(-alpha * (lon - station_lon) ** 2) * math.exp(-beta * (lat - station_lat) ** 2)

        # CO and PM2.5 estimates for this parish
        co_level = round(co_mean * gauss_factor, 1)
        pm25_level = round(pm25_mean * gauss_factor, 1)

        # Urban boost: urban parishes have +30% due to traffic/industry
        zone = str(row["zone"])
        if zone == "urbana":
            co_level = round(co_level * 1.3, 1)
            pm25_level = round(pm25_level * 1.3, 1)

        # Contamination index 0-100
        # Based on how close to station and urban/rural
        dist_factor = max(0, 1 - dist / max_dist)  # 1 = at station, 0 = far
        urban_bonus = 0.15 if zone == "urbana" else 0.0
        contamination = min(100, round((dist_factor * 70 + urban_bonus * 100) * gauss_factor + urban_bonus * 30, 1))

        parishes.append(ParishData(
            name=str(row["parish_name"]),
            zone=zone,
            latitude=lat,
            longitude=lon,
            population=int(row["population"]),
            area_km2=float(row["area_km2"]),
            polygon=polygon,
            co_level=co_level,
            pm25_level=pm25_level,
            contamination_index=contamination,
        ))

    return parishes
