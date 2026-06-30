"""
Data loading service — reads CSVs with caching.
"""
import pandas as pd
from config import AIR_QUALITY_CSV, CITY_INFO_CSV
from models.schemas import CityInfo, DataSummary


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
