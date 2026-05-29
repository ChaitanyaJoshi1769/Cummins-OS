# Cummins OS

**AI-native industrial operating system for fleet intelligence, engine diagnostics, and predictive maintenance.**

[![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.3.2-blue.svg)](https://www.typescriptlang.org/)

## Overview

Cummins OS is an **enterprise-grade industrial platform** that unifies:
- 🚛 **Fleet Intelligence** - Real-time fleet monitoring and geospatial analytics
- 🔧 **Engine Diagnostics** - ECU data, fault code detection, sensor telemetry
- 🤖 **Predictive Maintenance** - AI-powered failure prediction and RUL estimation
- ⚡ **Electrification** - EV fleet monitoring, battery health, charging infrastructure
- 🔬 **Hydrogen Systems** - Fuel cell analytics, storage monitoring, safety alerts
- 🌐 **Digital Twins** - 3D visualization, simulation, failure modeling
- 🤝 **Enterprise Integration** - SAP, ServiceNow, SCADA, MES connectors
- 🛡️ **Industrial Safety** - Compliance tracking, incident management, hazard detection

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Fleet Command Center                     │
│                   (Next.js Frontend)                     │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│            Enterprise API Gateway                        │
│               (NestJS Backend)                           │
└────┬──────────┬──────────┬──────────┬─────────┬─────────┘
     │          │          │          │         │
┌────▼──┐  ┌────▼──┐  ┌────▼──┐  ┌───▼───┐  ┌─▼──────┐
│ Fleet │  │Engine │  │Predict│  │Electr │  │Hydrogen│
│Intell │  │Diagno │  │ Maint │  │ifi    │  │Systems │
└────┬──┘  └────┬──┘  └────┬──┘  └───┬───┘  └─┬──────┘
     │          │          │          │        │
┌────▼──────────▼──────────▼──────────▼────────▼────┐
│        Kafka Event Bus (Real-time Streams)        │
└────┬──────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────┐
│  Data Layer (PostgreSQL, TimescaleDB, Redis)      │
└───────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────┐
│    Edge Gateways (MQTT, CAN, OPC-UA, J1939)      │
└───────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with SSR/SSG
- **React 18** - Component library
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - High-quality components
- **Mapbox GL** - Fleet geospatial intelligence
- **Three.js** - Digital twin visualization
- **Recharts** - Data visualization
- **Redux Toolkit** - State management

### Backend
- **NestJS** - Enterprise Node.js framework
- **TypeScript** - Type-safe backend code
- **PostgreSQL** - Relational database
- **TimescaleDB** - Time-series telemetry
- **Redis** - Caching & sessions
- **Kafka** - Event streaming
- **Elasticsearch** - Diagnostic search

### Industrial Stack
- **MQTT** - Device communication
- **OPC-UA** - Industrial protocols
- **CAN Bus** - Vehicle networks
- **J1939** - Engine diagnostics protocol
- **Modbus** - Industrial automation

### AI/ML
- **Python** - Model training & serving
- **LangChain** - AI agent framework
- **XGBoost/LSTM** - Predictive models
- **Scikit-learn** - Machine learning
- **FastAPI** - Model serving

### Observability
- **OpenTelemetry** - Distributed tracing
- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboards
- **Loki** - Log aggregation
- **Pino** - Structured logging

### Infrastructure
- **AWS** - Cloud platform (ECS, RDS, MSK, S3)
- **Terraform** - Infrastructure-as-code
- **Docker** - Container runtime
- **Kubernetes** - Container orchestration
- **GitHub Actions** - CI/CD pipelines

## Project Structure

```
cummins-os/
├── apps/
│   ├── api/                    # NestJS backend API
│   ├── web/                    # Next.js frontend
│   ├── edge-gateway/           # Industrial edge gateway
│   └── ai-services/            # Python ML services
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared UI components
│   ├── db/                     # Database layer
│   ├── auth/                   # Authentication
│   ├── observability/          # Logging & tracing
│   ├── config/                 # Shared config
│   └── integrations/           # Third-party integrations
├── infrastructure/
│   ├── terraform/              # AWS infrastructure
│   ├── k8s/                    # Kubernetes manifests
│   └── docker/                 # Docker configurations
├── docs/                       # Documentation
├── scripts/                    # Automation scripts
└── .github/
    └── workflows/              # CI/CD pipelines
```

## Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or yarn/pnpm)
- **Docker** & **Docker Compose**
- **PostgreSQL** 14+
- **Redis** 7+
- **Kafka** 3.5+

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/ChaitanyaJoshi1769/Cummins-OS.git
cd Cummins-OS
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start development services (Docker):**
```bash
npm run docker:up
```

5. **Run development servers:**
```bash
npm run dev
```

Services will be available at:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Edge Gateway:** http://localhost:4000
- **Grafana:** http://localhost:3000/grafana

## Development

### Building
```bash
npm run build          # Build all workspaces
npm run build --filter=api  # Build specific workspace
```

### Testing
```bash
npm run test           # Run all tests
npm run test:coverage  # With coverage report
```

### Linting & Formatting
```bash
npm run lint           # Check code style
npm run format         # Auto-format code
npm run type-check     # TypeScript type checking
```

## Deployment

### Development
```bash
npm run docker:up
```

### Production
```bash
# Initialize infrastructure
npm run infra:init

# Plan deployment
npm run infra:plan

# Apply infrastructure
npm run infra:apply
```

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Guide](docs/SECURITY.md)
- [Database Schema](docs/DATABASE.md)
- [Industrial Protocols](docs/INDUSTRIAL_PROTOCOLS.md)
- [AI/ML Pipeline](docs/AI_ML.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 12-Phase Implementation Roadmap

Complete roadmap and progress tracking: **[12_PHASE_ROADMAP.md](12_PHASE_ROADMAP.md)**

### Phase Status
- **Phase 1:** ✅ Foundation (100%)
- **Phase 2:** ✅ Auth & Multi-tenancy (100%)
- **Phase 3:** 🔄 Telemetry Ingestion (40% - schema complete)
- **Phase 4:** 📋 Diagnostics (20% - schema complete)
- **Phase 5:** 📋 Predictive Maintenance (20% - schema complete)
- **Phase 6:** 📋 Electrification (20% - schema complete)
- **Phase 7:** 📋 Hydrogen Systems (20% - schema complete)
- **Phase 8:** 📋 Edge IoT (40% - gateway implemented)
- **Phase 9:** 📋 Digital Twins (0%)
- **Phase 10:** 📋 Autonomous Fleet Ops (0%)
- **Phase 11:** 📋 Safety & Compliance (20% - schema complete)
- **Phase 12:** 📋 Enterprise Integration (20% - schema complete)

### Quick Feature Summary
- ✅ **Phase 1-2:** Enterprise auth, multi-tenancy, RBAC, audit logging
- 🔄 **Phase 3:** Telemetry ingestion, real-time dashboards, Kafka streaming
- 🔄 **Phase 4:** ECU diagnostics, fault detection, health scoring
- 🔄 **Phase 5:** Predictive AI, RUL estimation, maintenance planning
- 📋 **Phase 6-7:** EV & Hydrogen system monitoring
- 📋 **Phase 8:** Edge gateway, offline-first, device management
- 📋 **Phase 9:** 3D digital twins, fleet visualization, replay
- 📋 **Phase 10:** Fleet routing, autonomous operations, safety zones
- 📋 **Phase 11:** Incident tracking, compliance management
- 📋 **Phase 12:** SAP/ServiceNow integration, production hardening

## API Overview

### Authentication
```bash
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Fleet Intelligence
```bash
GET  /fleet
GET  /fleet/:id
POST /fleet
GET  /fleet/:id/vehicles
GET  /fleet/:id/analytics
```

### Engine Diagnostics
```bash
GET  /diagnostics
POST /diagnostics/raw-telemetry
GET  /diagnostics/:vehicleId/latest
GET  /diagnostics/:vehicleId/history
```

### Predictive Maintenance
```bash
GET  /maintenance/predictions
GET  /maintenance/:vehicleId/risk-score
POST /maintenance/work-orders
```

See [API Documentation](docs/API.md) for complete endpoint reference.

## Security

- ✅ JWT-based authentication
- ✅ MFA-ready architecture
- ✅ RBAC/ABAC authorization
- ✅ Encrypted communications (TLS)
- ✅ Network segmentation
- ✅ Audit logging
- ✅ OT/ICS security controls
- ✅ Vault-ready secret management

See [Security Guide](docs/SECURITY.md) for detailed security architecture.

## Performance

Designed for:
- **Millions of telemetry events/sec** (Kafka + TimescaleDB)
- **Sub-second diagnostics processing** (Real-time streaming)
- **Multi-region deployment** (AWS across regions)
- **Horizontal scaling** (Kubernetes auto-scaling)
- **99.9% uptime** (Multi-AZ redundancy)

## Monitoring & Observability

- **OpenTelemetry** - Distributed tracing
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards
- **Loki** - Log aggregation
- **Custom Dashboards** - Fleet command center

Access dashboards:
- **Grafana:** http://localhost:3000/grafana
- **Prometheus:** http://localhost:9090
- **Cummins OS Command Center:** http://localhost:3000

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

**PROPRIETARY** - Cummins Corporation. All rights reserved.

## Support

For technical support or questions:
- 📧 Email: [support@cummins-os.com]
- 📖 Docs: https://docs.cummins-os.com
- 🐛 Issues: https://github.com/ChaitanyaJoshi1769/Cummins-OS/issues

---

**Built with ❤️ by the Cummins OS Team**

Cummins OS leverages decades of Cummins expertise in engines, power systems, and industrial technologies, combined with cutting-edge AI, cloud computing, and real-time analytics to revolutionize fleet intelligence and predictive maintenance.
