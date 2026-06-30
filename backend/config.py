"""
Configuration for the Air Quality Prediction API.
"""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR

# CSV files
AIR_QUALITY_CSV = DATA_DIR / "air_quality_historical.csv"
CITY_INFO_CSV = DATA_DIR / "city_info.csv"
PARROQUIAS_CSV = DATA_DIR / "parroquias_quito.csv"

# OMS limits
OMS_PM25_LIMIT = 15.0  # µg/m³ daily limit

# Physical constants for Quito
QUITO_ALTITUDE = 2850  # msnm
AIR_DENSITY = 0.90     # kg/m³ at 2850m
MIXING_HEIGHT = 800.0  # m

# Integration grid
GRID_SIZE = 80
LON_RANGE = 0.30
LAT_RANGE = 0.40

# CORS
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
