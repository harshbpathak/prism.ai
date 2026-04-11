<p align="center">
  <h1 align="center">🔷 PRISM.ai</h1>
  <p align="center"><strong>Product Route Intelligence and Supply Mapping</strong></p>
  <p align="center">
    An AI-powered (IQ AI ADK) supply chain digital twin platform with <strong>ML-driven risk prediction (XGBoost)</strong>, real-time risk analysis, forecasting, scenario simulation (Requestly), and strategic decision-making.
  </p>
</p>

---

## ✨ Overview

**PRISM.ai** is a next-generation supply chain intelligence platform that combines **AI agents**, **digital twin visualization**, **ML-powered risk prediction**, and **multi-agent orchestration** to help businesses proactively identify, assess, and mitigate supply chain risks.

Built on **Next.js 15** with **Google Gemini AI** and an **XGBoost ML risk engine**, the platform provides an immersive experience for supply chain professionals to model their networks, predict delivery risks, simulate disruptions, and receive actionable intelligence — all in real time.

---

## 🚀 Key Features

### 🗺️ Digital Twin
- Interactive supply chain network visualization using **React Flow**
- Drag-and-drop node management (suppliers, factories, warehouses, distributors, retailers)
- Real-time connection mapping with transport modes, costs, and risk multipliers
- Geographic mapping with **Leaflet** integration
- **Live Status Monitoring**: Nodes change state and appearance based on real-time intelligence and risk levels.

### 🤖 Multi-Agent AI System
Six specialized AI agents powered by **Google Gemini** via the **IQ AI ADK** framework:

| Agent | Purpose |
|-------|---------|
| **Intelligence** | Gathers real-time news, weather, and market intelligence via **Tavily** web search |
| **Forecast** | Predictive analytics and trend analysis using historical data |
| **Scenario** | What-if modeling and disruption simulation |
| **Impact** | Quantitative risk assessment and financial impact scoring |
| **Strategy** | Mitigation planning and strategic recommendations |
| **Orchestrator** | Coordinates all agents for comprehensive multi-step analysis |

### 🧠 Memory & Trend Analysis
- **Mem0 Integration**: Remembers past disruptions and intelligence to identify longitudinal patterns.
- **Delta Risk Calculation**: Compares current risk levels against historical baselines to highlight escalating threats.
- **Pattern Recognition**: Detects recurring failure points in the supply chain lifecycle.

### 💬 AI Chat Interface
- **CopilotKit**-powered conversational interface embedded in the digital twin
- Context-aware suggestions based on supply chain topology
- Natural language queries for supply chain analysis

### 📊 Dashboard & Analytics
- Real-time supply chain health metrics
- Risk score visualization with **Recharts**
- Cascading failure analysis maps
- Strategy execution tracking

### 🔬 Simulation Engine (Chaos Simulation)
- Monte Carlo risk simulations
- Disruption scenario modeling
- Multi-variable sensitivity analysis
- **Requestly Integration**: Inject artificial disruptions (latency, API failures, price spikes) to test supply chain resilience. Simulated disruptions are reflected instantly on the Digital Twin (pulsing red states) to help planners visualize impact chains.

### 🧠 ML Risk Prediction
- **XGBoost-powered** binary classifier (High Risk / Low Risk) trained on the **DataCo Supply Chain** dataset (180K orders)
- **59 engineered features** from 30 raw columns — target encoding, temporal, interaction, and financial features
- **Model Performance**: ROC-AUC 0.885, Accuracy 79.4%, F1 0.794
- **FastAPI backend** for real-time single-order and batch CSV predictions (< 1ms inference)
- Animated risk gauge, top contributing factors visualization, and confidence scoring in the UI
- Top predictors: Shipping Mode, schedule tightness, mode×region interactions

### 📰 News Room
- Curated supply chain news and intelligence
- Web scraping with metadata extraction
- Impact correlation to supply chain nodes

---

## 🏗️ Architecture

```
prism.ai/
├── app/
│   ├── (main)/                    # Authenticated routes
│   │   ├── dashboard/             # Analytics dashboard
│   │   ├── digital-twin/          # Supply chain visualization
│   │   ├── risk-prediction/       # ML risk prediction UI       ← NEW
│   │   ├── simulation/            # Simulation engine
│   │   ├── news-room/             # Intelligence news feed
│   │   └── profile/               # User profile
│   ├── api/
│   │   ├── agent/                 # AI Agent endpoints
│   │   │   ├── forecast/          # Forecasting agent
│   │   │   ├── impact/            # Impact assessment agent
│   │   │   ├── info/              # Intelligence gathering agent
│   │   │   ├── orchestrator/      # Multi-agent orchestrator
│   │   │   ├── scenario/          # Scenario generation agent
│   │   │   ├── strategy/          # Strategy planning agent
│   │   │   └── strategy-execution/# Strategy execution agent
│   │   ├── risk-prediction/       # ML model proxy              ← NEW
│   │   │   ├── route.ts           # GET meta + POST predict
│   │   │   └── batch/route.ts     # POST batch CSV predict
│   │   ├── coordination/          # Agent coordination layer
│   │   ├── copilotkit*/           # CopilotKit chat endpoints
│   │   ├── suggestions/           # AI suggestion engine
│   │   └── ...                    # Other API routes
│   ├── auth/                      # Auth callback handlers
│   └── signin/                    # Authentication UI
├── components/
│   ├── digital-twin/              # Twin visualization components
│   ├── risk-prediction/           # ML prediction components    ← NEW
│   │   ├── risk-prediction-page.tsx
│   │   ├── risk-gauge.tsx         # Animated SVG radial gauge
│   │   └── factor-bars.tsx        # Top factor bar chart
│   ├── simulation/                # Simulation UI components
│   ├── dashboard/                 # Dashboard widgets
│   ├── orchestrator/              # Agent orchestration UI
│   ├── copilot/                   # Chat interface components
│   └── ui/                        # Shared UI components (shadcn/ui)
├── lib/
│   ├── ai-config.ts               # Centralized AI model & key config
│   ├── supabase/                  # Supabase client setup
│   ├── monitoring.ts              # Logging & observability
│   ├── stores/                    # Zustand state stores
│   └── agents/                    # Agent utilities
└── types/                         # TypeScript type definitions
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript |
| **AI Models** | Google Gemini 2.0 via `@ai-sdk/google` |
| **Agent Framework** | IQ AI ADK (`@iqai/adk`) |
| **ML Model** | XGBoost (GPU-accelerated, 59 features, AUC 0.885) |
| **ML API** | FastAPI (Python) — single & batch prediction |
| **ML Libraries** | scikit-learn, pandas, numpy, SHAP |
| **Chat Interface** | CopilotKit |
| **Database** | Supabase (PostgreSQL) |
| **Caching** | Upstash Redis |
| **Web Search** | Tavily API |
| **Memory** | Mem0 AI |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Visualization** | React Flow, Recharts, D3.js, Leaflet |
| **State Management** | Zustand |
| **Monitoring** | Sentry |
| **Simulation Testing**| Requestly (Fault Injection) |
| **Validation** | Zod |

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10 (for the ML risk prediction API)
- **pnpm** (recommended) or npm/yarn
- API keys for required services (see Environment Variables)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd prism.ai

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### ML Risk Prediction API

```bash
# Navigate to the Market-Supply directory
cd ../Market-Supply

# Install Python dependencies
pip install xgboost scikit-learn pandas numpy fastapi uvicorn python-multipart joblib shap

# Train the model (first time only, ~7s on GPU)
python ml/train.py

# Start the FastAPI server
uvicorn api.main:app --reload --port 8001
```

The Next.js app at **http://localhost:3000** and the ML API at **http://localhost:8001** must run simultaneously.

### Environment Setup

Create a `.env.local` or `.env` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (Required)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Web Search
TAVILY_API_KEY=your_tavily_key

# Weather
OPENWEATHER_API_KEY=your_openweather_key

# Memory
MEM0_API_KEY=your_mem0_key

# Caching
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# CopilotKit
NEXT_PUBLIC_COPILOTKIT_ENABLED=true

# ML Risk Prediction API (Optional — defaults to localhost:8001)
RISK_MODEL_API_URL=http://localhost:8001
```

---

## 📡 API Reference

### Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agent/forecast` | Generate predictive supply chain forecasts |
| `GET`  | `/api/agent/forecast` | Retrieve cached forecasts |
| `POST` | `/api/agent/orchestrator` | Multi-agent coordinated analysis |
| `GET`  | `/api/agent/orchestrator` | Orchestrator health check |
| `POST` | `/api/agent/impact` | Quantitative risk impact assessment |
| `POST` | `/api/agent/scenario` | Disruption scenario generation |
| `POST` | `/api/agent/strategy` | Mitigation strategy planning |
| `POST` | `/api/agent/info` | Intelligence gathering & node analysis |

### ML Risk Prediction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/risk-prediction` | Model metadata + dropdown options |
| `POST` | `/api/risk-prediction` | Single-order risk prediction |
| `POST` | `/api/risk-prediction/batch` | Batch CSV file prediction |

---

## 🤝 Roadmap

- [x] ML-powered delivery risk prediction (XGBoost + FastAPI)
- [ ] Geographic Event Correlation (Mapping events to physical routes).
- [ ] Predictive Demand Forecasting using historical Supabase data.
- [ ] Multi-Model LLM Ensemble for risk verification.
- [ ] Automated mitigation execution via IQAI ADK.

## 📄 License

This project is developed for the **Prism Hackathon**.

---
*Built with ❤️ by the PRISM Team.*
