# 🌫️ Sistema de Predicción de Calidad del Aire — Quito, Ecuador

Sistema completo de predicción de calidad del aire utilizando **cuatro métodos numéricos clásicos encadenados**, con visualización interactiva en 2D y 3D.

## 📋 Metodos Implementados

| # | Metodo | Descripcion | Output |
|---|--------|-------------|--------|
| ① | **Euler** | Resuelve la EDO `dC/dt = −kC + S(t)` para predecir CO futuro | Serie temporal de CO |
| ② | **Taylor 2°** | Correccion de precision con serie de Taylor de segundo orden | CO corregido + metricas |
| ③ | **Trapecio** | Calcula dosis acumulada de PM2.5 via integral numerica | Dosis mensual + alertas OMS |
| ④ | **Integral Doble** | Masa de CO sobre el area urbana de Quito (Gaussiana 2D) | Mapa de calor + masa total |

## 🗺️ Mapa 3D de Parroquias

Visualizacion interactiva de las **32 parroquias de Quito** (8 urbanas + 24 rurales) con niveles de contaminacion calculados usando el modelo gaussiano.

- Poligonos 3D extruidos (Deck.gl + MapLibre)
- Colores por indice de contaminacion (verde → rojo)
- Filtros: Todas / Urbanas / Rurales
- Hover tooltips con CO, PM2.5, poblacion

## 🛠️ Tecnologias

### Backend
- **Python 3.12** + **FastAPI**
- **NumPy** / **Pandas** — computo numerico
- **Matplotlib** — generacion de graficas (PNG base64)
- **Pydantic** — validacion de schemas

### Frontend
- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS 4** — estilos
- **Recharts** — graficas interactivas
- **Deck.gl** + **MapLibre** — mapa 3D
- **Axios** — cliente HTTP

## 🚀 Como Ejecutar

### Prerequisitos
- Python 3.12+
- Node.js 18+
- npm

### 1. Clonar el repositorio

```bash
git clone git@github.com:MathiasFer/Metodos.git
cd Metodos
```

### 2. Backend

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
cd backend
uvicorn main:app --reload --port 8000
```

El backend estara disponible en: `http://localhost:8000`

Documentacion API (Swagger): `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend estara disponible en: `http://localhost:5173`

### 4. Usar el sistema

1. Abrir `http://localhost:5173` en el navegador
2. Seleccionar una fecha objetivo en el sidebar
3. Hacer clic en **"Ejecutar Simulacion"**
4. Navegar por las pestañas para ver resultados:
   - 🏠 Resumen general
   - ① Metodo de Euler
   - ② Series de Taylor
   - ③ Regla del Trapecio
   - ④ Integral Doble
   - 🗺️ Mapa 3D de Parroquias
   - 📋 Reporte final

## 📁 Estructura del Proyecto

```
├── air_quality_historical.csv    # Datos historicos de calidad del aire
├── city_info.csv                 # Informacion de Quito
├── parroquias_quito.csv          # 32 parroquias con poligonos
├── requirements.txt              # Dependencias Python
│
├── backend/
│   ├── main.py                   # FastAPI entry point
│   ├── config.py                 # Constantes y configuracion
│   ├── models/
│   │   └── schemas.py            # Pydantic schemas
│   ├── routers/
│   │   ├── simulation.py         # Endpoints /api/*
│   │   └── plots.py              # Endpoints /api/plots/*
│   └── services/
│       ├── data_loader.py        # Carga de CSVs + parroquias
│       ├── euler.py              # Metodo 1
│       ├── taylor.py             # Metodo 2
│       ├── trapezoid.py          # Metodo 3
│       ├── double_integral.py    # Metodo 4
│       └── plots.py              # Generacion matplotlib
│
└── frontend/
    ├── src/
    │   ├── App.tsx               # Componente principal
    │   ├── api/simulation.ts     # Cliente API
    │   ├── types/index.ts        # Interfaces TypeScript
    │   └── components/
    │       ├── Sidebar.tsx       # Panel lateral
    │       ├── Dashboard.tsx     # Resumen
    │       ├── EulerPanel.tsx    # Metodo 1
    │       ├── TaylorPanel.tsx   # Metodo 2
    │       ├── TrapezoidPanel.tsx# Metodo 3
    │       ├── DoubleIntegralPanel.tsx # Metodo 4
    │       ├── ParishMap3D.tsx   # Mapa 3D
    │       └── ReportPanel.tsx   # Reporte final
    └── package.json
```

## 📊 Endpoints API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/info` | Info de la ciudad y resumen del dataset |
| POST | `/api/simulate` | Ejecutar simulacion completa (4 metodos + graficas) |
| GET | `/api/parishes` | Datos de parroquias con niveles de contaminacion |
| POST | `/api/plots/euler` | Grafica matplotlib del Metodo de Euler (PNG) |
| POST | `/api/plots/taylor` | Grafica matplotlib de Taylor (PNG) |
| POST | `/api/plots/trapezoid` | Grafica matplotlib del Trapecio (PNG) |
| POST | `/api/plots/double` | Grafica matplotlib de Integral Doble (PNG) |

## 📈 Datos

El dataset contiene **1,297 registros** de calidad del aire en Quito:
- **Periodo**: 2022-08-03 → 2026-02-18
- **Variables**: CO (monoxido de carbono) y PM2.5 (material particulado)
- **Ubicacion**: Coordenadas lat/lon del punto de monitoreo

## 📄 Licencia

Proyecto academico — Universidad Central del Ecuador
