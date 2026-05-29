# Cummins OS - Architecture Documentation

## System Overview

Cummins OS is built as a **scalable, distributed enterprise platform** using a microservices-inspired monorepo architecture. The system is designed to handle millions of telemetry events per second while providing real-time insights into fleet operations, engine diagnostics, and predictive maintenance.

```
┌─────────────────────────────────────────────────────────────┐
│                   Client Layer                              │
│         (Web, Mobile, Third-party Integrations)             │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              API Gateway Layer (NestJS)                      │
│  - Authentication & Authorization                           │
│  - Request routing & validation                             │
│  - Rate limiting & throttling                               │
│  - CORS & security headers                                  │
└────┬──────────┬──────────┬──────────┬─────────┬─────────────┘
     │          │          │          │         │
┌────▼──┐  ┌────▼──┐  ┌────▼──┐  ┌───▼───┐  ┌─▼─────┐
│ Fleet │  │Engine │  │Predict│  │Electr │  │Safety &│
│ Intell│  │Diagno │  │ Maint │  │ifi    │  │Compli │
│Service│  │Service│  │Service│  │Service│  │Service│
└────┬──┘  └────┬──┘  └────┬──┘  └───┬───┘  └─┬─────┘
     │          │          │          │        │
┌────▼──────────▼──────────▼──────────▼────────▼────┐
│        Event Bus (Kafka)                           │
│  - Fleet telemetry topic                           │
│  - Engine diagnostics topic                        │
│  - Alerts topic                                    │
│  - Commands topic                                  │
│  - Analytics topic                                 │
└────┬──────────────────────────────────────────────┘
     │
┌────▼─────────────────────────────────────────────┐
│          Data Layer                               │
│  ┌─────────────────────────────────────────┐     │
│  │ PostgreSQL (Relational)                 │     │
│  │ - Organizations, Fleets, Vehicles       │     │
│  │ - Users, Roles, Permissions             │     │
│  │ - Maintenance records, Work orders      │     │
│  │ - Configuration                         │     │
│  └─────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────┐     │
│  │ TimescaleDB (Time-series)               │     │
│  │ - Raw telemetry streams                 │     │
│  │ - Sensor readings                       │     │
│  │ - High-frequency diagnostics            │     │
│  └─────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────┐     │
│  │ Redis (Cache & Session Store)           │     │
│  │ - Session management                    │     │
│  │ - Real-time metrics cache               │     │
│  │ - Rate limit counters                   │     │
│  └─────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────┐     │
│  │ Elasticsearch (Search & Analytics)      │     │
│  │ - Diagnostics search                    │     │
│  │ - Audit logs                            │     │
│  │ - Full-text search                      │     │
│  └─────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────┐
│      Edge Layer (Industrial IoT)               │
│  ┌────────────────────────────────────────┐   │
│  │ Edge Gateways (Node.js/Express)        │   │
│  │ - MQTT broker integration              │   │
│  │ - Offline-first operation              │   │
│  │ - Local caching & sync                 │   │
│  │ - Device management                    │   │
│  └────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────┐   │
│  │ Industrial Protocols                   │   │
│  │ - MQTT (device telemetry)              │   │
│  │ - OPC-UA (industrial automation)       │   │
│  │ - CAN (vehicle networks)               │   │
│  │ - J1939 (engine diagnostics)           │   │
│  │ - Modbus (industrial devices)          │   │
│  └────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────┐   │
│  │ Edge AI (ONNX Runtime)                 │   │
│  │ - Local anomaly detection              │   │
│  │ - Edge inference                       │   │
│  └────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────┐
│      Physical Devices Layer                    │
│  - Industrial vehicles                        │
│  - Power generation systems                   │
│  - Charging infrastructure                    │
│  - Hydrogen systems                           │
│  - IoT sensors & controllers                  │
└───────────────────────────────────────────────┘
```

## Core Services

### 1. Fleet Intelligence Service
**Purpose:** Real-time fleet monitoring and analytics

**Responsibilities:**
- Track vehicle locations and movement patterns
- Calculate utilization metrics
- Monitor fuel consumption
- Generate fleet dashboards
- Route optimization

**Data Flow:**
```
Telemetry → Kafka → Fleet Service → PostgreSQL + Redis
           ↓
        Analytics Engine → Dashboards
```

### 2. Engine Diagnostics Service
**Purpose:** ECU data processing and fault detection

**Responsibilities:**
- Ingest ECU telemetry (J1939, CAN)
- Detect fault codes
- Monitor sensor thresholds
- Correlate diagnostic events
- Generate health scores

**Protocols Supported:**
- **J1939** - Heavy-duty vehicle diagnostics
- **CAN 2.0** - Vehicle networks
- **MQTT** - Generic device communication
- **OPC-UA** - Industrial systems

### 3. Predictive Maintenance Service
**Purpose:** AI-powered failure forecasting

**Responsibilities:**
- Train ML models on historical data
- Generate failure predictions
- Estimate remaining useful life (RUL)
- Recommend maintenance actions
- Track model performance

**Models:**
- XGBoost - Failure prediction
- LSTM - Time-series RUL estimation
- Isolation Forest - Anomaly detection
- Statistical methods - Threshold-based alerts

### 4. Electrification Service
**Purpose:** EV fleet management and battery health

**Responsibilities:**
- Monitor EV battery status
- Optimize charging schedules
- Track energy consumption
- Manage charging infrastructure
- Calculate efficiency metrics

### 5. Hydrogen Systems Service
**Purpose:** Fuel cell and hydrogen safety monitoring

**Responsibilities:**
- Monitor fuel cell performance
- Track hydrogen storage
- Safety alerts & notifications
- Efficiency analytics
- Maintenance scheduling

### 6. Safety & Compliance Service
**Purpose:** Operational safety and regulatory compliance

**Responsibilities:**
- Incident tracking
- Hazard detection
- Compliance monitoring
- Audit logging
- Safety KPI tracking

### 7. Authentication & Authorization Service
**Purpose:** Identity and access management

**Responsibilities:**
- JWT token generation & validation
- MFA (TOTP) support
- Role-based access control (RBAC)
- Attribute-based access control (ABAC)
- Audit logging

**Security Features:**
- JWT with HS256/RS256
- Refresh token rotation
- Session management
- Rate limiting
- IP whitelisting (optional)

## Data Layer Architecture

### PostgreSQL (Primary Relational Database)

**Core Tables:**
```
organizations
├── id (UUID)
├── name
├── subscription_tier
├── settings
└── created_at

fleets
├── id (UUID)
├── organization_id (FK)
├── name
├── region
├── vehicle_count
└── created_at

vehicles
├── id (UUID)
├── fleet_id (FK)
├── vin
├── engine_type (diesel/gas/electric/hydrogen)
├── make/model/year
├── location (GIS point)
├── last_telemetry_at
└── created_at

users
├── id (UUID)
├── organization_id (FK)
├── email (unique)
├── password_hash
├── mfa_enabled
├── last_login_at
└── created_at

roles
├── id (UUID)
├── organization_id (FK)
├── name
├── permissions (JSONB array)
└── created_at

maintenance_work_orders
├── id (UUID)
├── vehicle_id (FK)
├── type (repair/inspection/preventive)
├── status (open/in-progress/completed)
├── priority
├── scheduled_at
├── completed_at
└── created_at

incidents
├── id (UUID)
├── vehicle_id (FK)
├── incident_type
├── severity
├── description
├── resolved_at
└── created_at
```

### TimescaleDB (Time-Series Database)

**High-Volume Telemetry Tables:**
```
vehicle_telemetry_raw
├── time (TIMESTAMPTZ, indexed)
├── vehicle_id (UUID)
├── engine_rpm
├── oil_pressure
├── coolant_temp
├── fuel_level
├── speed
├── odometer
└── (1000+ sensor fields)

sensor_events
├── time (TIMESTAMPTZ)
├── vehicle_id (UUID)
├── sensor_type
├── sensor_id
├── reading
├── unit
└── quality_flag

diagnostic_events
├── time (TIMESTAMPTZ)
├── vehicle_id (UUID)
├── fault_code
├── description
├── severity
├── status (active/resolved)
└── context (JSONB)
```

### Redis (Cache & Session Store)

**Key Patterns:**
```
session:{session_id} → User session data
vehicle:{vehicle_id}:latest → Latest telemetry cache
metrics:{fleet_id}:daily → Daily aggregated metrics
rate_limit:{user_id}:{endpoint} → Rate limit counter
broadcast:alerts → Real-time alerts (pub/sub)
```

### Elasticsearch (Search & Aggregation)

**Index Patterns:**
```
diagnostics-{YYYY.MM.DD}
├── vehicle_id
├── fault_code
├── timestamp
├── description
├── context
└── (searchable fields)

audit-logs-{YYYY.MM.DD}
├── user_id
├── action
├── resource_type
├── changes
├── timestamp
└── ip_address
```

## Message Queue Architecture (Kafka)

**Topic Design:**

```
cummins.telemetry.raw
├── Partitions: 100 (by vehicle_id)
├── Retention: 24 hours
├── Schema: RawTelemetryEvent
└── Consumers: Analytics, Storage, Real-time dashboards

cummins.diagnostics.events
├── Partitions: 50
├── Retention: 7 days
├── Schema: DiagnosticEvent
└── Consumers: Alerting, Predictive models, Search indexing

cummins.alerts.events
├── Partitions: 20
├── Retention: 30 days
├── Schema: AlertEvent
└── Consumers: Notifications, Web sockets, Audit logs

cummins.fleet.commands
├── Partitions: 50
├── Retention: 1 hour
├── Schema: CommandEvent
└── Consumers: Edge gateways, Vehicle controllers

cummins.maintenance.events
├── Partitions: 20
├── Retention: 90 days
├── Schema: MaintenanceEvent
└── Consumers: Work order management, Analytics
```

## Frontend Architecture

### Next.js App Structure
```
pages/
├── index.tsx                 # Dashboard
├── fleet/
│   ├── index.tsx            # Fleet list
│   └── [id]/
│       ├── index.tsx        # Fleet detail
│       └── vehicles/        # Fleet vehicles
├── vehicles/
│   └── [id]/
│       ├── telemetry.tsx    # Real-time telemetry
│       ├── diagnostics.tsx  # Fault history
│       └── maintenance.tsx  # Work orders
├── diagnostics/
│   ├── search.tsx           # Fault code search
│   └── analytics.tsx        # Diagnostic trends
├── maintenance/
│   ├── predictions.tsx      # Predictive insights
│   └── work-orders.tsx      # Work order management
└── admin/
    ├── users.tsx            # User management
    └── settings.tsx         # System configuration
```

### State Management
- **Redux Toolkit** for global state
- **React Query** for server state
- **Zustand** for UI-specific state

## Edge Gateway Architecture

**Responsibilities:**
- MQTT broker integration
- Offline-first operation
- Local data caching
- Device discovery & management
- Firmware update orchestration
- Telemetry buffering & synchronization

**Connection Flow:**
```
Physical Devices
    ↓
MQTT Protocol
    ↓
Edge Gateway (Node.js)
    ├─ Local Cache (SQLite)
    ├─ Offline Queue
    └─ Sync Engine
         ↓
    Telemetry API (REST/WebSocket)
         ↓
    Kafka Broker
```

## Security Architecture

### Authentication Flow
```
User Credentials
       ↓
[POST /auth/login]
       ↓
Hash verification (bcrypt)
       ↓
JWT Generation (exp: 24h)
       ↓
Refresh Token (exp: 7d)
       ↓
Return to Client
```

### Authorization Flow
```
HTTP Request + JWT
       ↓
Extract Claims
       ↓
Load User Roles
       ↓
Check Permissions
       ↓
RBAC/ABAC Evaluation
       ↓
Allow/Deny
```

### Data Protection
- **In Transit:** TLS 1.3
- **At Rest:** AES-256 encryption
- **Secrets:** Vault-ready pattern (env variables)
- **Audit:** All actions logged

## Scalability Considerations

### Horizontal Scaling
- **Kafka partitioning** by vehicle_id for parallel processing
- **Database sharding** by organization_id (future)
- **Load balancing** across API instances
- **Connection pooling** (PgBouncer)

### Performance Optimization
- **Read replicas** for analytical queries
- **Materialized views** for aggregate metrics
- **Redis caching** for frequently accessed data
- **TimescaleDB compression** for old telemetry
- **Elasticsearch sharding** for log retention

### High Availability
- **Multi-AZ deployment** (AWS)
- **RTO < 5 minutes** for critical services
- **RPO < 1 minute** for operational data
- **Circuit breakers** for external service failures
- **Graceful degradation** when non-critical services fail

## Deployment Architecture

### Development
```
docker-compose up
├── PostgreSQL (port 5432)
├── Redis (port 6379)
├── Kafka (port 9092)
├── MQTT (port 1883)
├── Elasticsearch (port 9200)
├── Prometheus (port 9090)
├── Grafana (port 3100)
├── Jaeger (port 16686)
├── API (port 3001)
└── Web (port 3000)
```

### Production (AWS)
```
Application Layer
├── ECS Fargate (Containers)
├── ALB (Load Balancing)
├── Auto Scaling Groups

Data Layer
├── RDS PostgreSQL (Multi-AZ)
├── ElastiCache Redis (Cluster)
├── MSK Kafka (Managed Streaming)

Storage
├── S3 (Telemetry archives)
├── EBS (Persistent volumes)

Observability
├── CloudWatch (Logs)
├── X-Ray (Tracing)
├── Prometheus/Grafana (Metrics)
```

## API Design Principles

### RESTful Conventions
- **GET** - Retrieve resources
- **POST** - Create resources
- **PUT/PATCH** - Update resources
- **DELETE** - Remove resources

### Pagination
```
GET /vehicles?limit=100&offset=0
GET /vehicles?page=1&page_size=100 (cursor-based)
```

### Filtering & Sorting
```
GET /vehicles?status=active&sort=-created_at
GET /diagnostics?severity=high&time_range=24h
```

### Error Handling
```json
{
  "error": "INVALID_REQUEST",
  "message": "Fleet not found",
  "statusCode": 404,
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/fleet/123"
}
```

## Integration Points

### Third-Party Integrations
- **ServiceNow** - Incident management
- **SAP** - ERP integration
- **Salesforce** - CRM integration
- **Slack** - Notifications
- **PagerDuty** - On-call management

### Data Export
- **CSV/Excel** - Fleet exports
- **PDF** - Reports
- **Parquet** - Analytics
- **S3** - Data lake

## Monitoring & Observability

### Key Metrics
- **API latency (p50, p95, p99)**
- **Kafka lag** per consumer group
- **Database query duration**
- **Redis hit rate**
- **Error rate** by service
- **Vehicle telemetry volume** (events/sec)

### Log Aggregation
- **Loki** for structured logs
- **Jaeger** for distributed tracing
- **Prometheus** for metrics

### Alerting
- **High API latency** (> 1s)
- **Service down** (health check failure)
- **Kafka consumer lag** (> 1 minute)
- **Database connection pool exhaustion**
- **High error rate** (> 1%)

## Future Enhancements

1. **GraphQL Gateway** - Alternative to REST
2. **WebSocket Streaming** - Real-time telemetry
3. **gRPC Services** - High-performance RPC
4. **CQRS Pattern** - Event sourcing
5. **Machine Learning** - Inline feature computation
6. **Digital Twins** - 3D simulation engine
7. **Blockchain** - Immutable audit trail
8. **5G/Edge** - Ultra-low latency processing
