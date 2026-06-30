"""
Air Quality Prediction API — FastAPI entry point.

Backend for the Quito air quality prediction system.
Replaces the original Streamlit monolith with a clean REST API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from routers.simulation import router as simulation_router
from routers.plots import router as plots_router

app = FastAPI(
    title="Air Quality Prediction API — Quito",
    description=(
        "API for predicting air quality in Quito, Ecuador using "
        "classical numerical methods: Euler, Taylor, Trapezoid, and Double Integral."
    ),
    version="2.0.0",
)

# ─── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────
app.include_router(simulation_router)
app.include_router(plots_router)


@app.get("/")
def root():
    return {
        "service": "Air Quality Prediction API",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
