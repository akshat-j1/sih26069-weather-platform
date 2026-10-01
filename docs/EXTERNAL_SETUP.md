# External Services, Credentials & Configuration Guide

**Platform**: National Weather Big Data Analytics Platform (`SIH26069`)
**Status**: **SYNCHRONIZED WITH CURRENT CODE & WORKER TOPOLOGY**

---

## 1. Local Automated Setup vs. Deferred Cloud Actions

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTOMATED LOCAL MVP SERVICES                │
│  - Local PostgreSQL 16 + PostGIS (Port 5432)                │
│  - Local Redis 7 Container (Port 6379)                      │
│  - Local MinIO S3 Object Storage (Ports 9000/9001)          │
│  - Local Alembic Migrations (0001 -> 0020)                  │
│  - 6 Standalone Worker Processes                            │
│  - Deterministic Seed Feeds & IMD/CWC/NDMA Local Adapters   │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ Isolated Boundary
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               DEFERRED PRODUCTION CLOUD ACTIONS             │
│  - Production Managed PostgreSQL with PostGIS (RDS/Neon)    │
│  - Production Managed Redis (AWS ElastiCache / Upstash)     │
│  - Production Cloud Storage (AWS S3 with Private IAM Bucket)│
│  - Production JWT Token Secret & OAuth2 Provider (Keycloak) │
│  - OpenTelemetry / Prometheus APM Monitoring Exporters      │
│  - Process Supervision Units (systemd / Kubernetes Pods)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. External Provider Status & Verification Matrix

| Source Provider | Provider Type | Local Simulation / Test | Live Provider Status | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Demo Seed Feed** | Local Synthetic Feed | **Fully Verified** | **Development Utility** | Deterministic generator for Mumbai/Delhi/Bengaluru weather incidents (development/testing utility; not scheduled in production). |
| **IMD Nowcast** | Official Weather Feed | **Fully Verified (Mock)** | Not Live Verified | Ingests IMD AWS/CAP alert format; official gateway access requires official credentials/IP whitelisting (returns 401 gracefully). |
| **NDMA SACHET** | National Disaster Alerts | **Unit & Live Verified** | **LIVE PROVIDER VERIFIED** | Ingests official CAP/JSON disaster alert feeds via `https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails`; real HTTP POST verified with 66 parsed alerts. |
| **CWC NWDP** | Central Water Commission | **Unit & Live Verified** | **LIVE PROVIDER VERIFIED** | Ingests hydrological river water level telemetry via NWDP CKAN DataStore API (`https://nwdp.nwic.gov.in/api/3/action/datastore_search`); real HTTP GET verified with 5 live telemetry records parsed in the controlled Phase 18 proof (adapter default fetch limit: 50). |
| **GDELT Project** | Global News Feed | **Unit & Live Verified** | **LIVE PROVIDER VERIFIED** | Ingests disaster news via GDELT DOC 2.0 API (`http://api.gdeltproject.org/api/v2/doc/doc`); rate limit interval $\ge 5.0\text{s}$; snippets only in `ArtList` mode. |
| **Mastodon** | Social Emergency Feed | **Unit & Live Verified** | **LIVE PROVIDER VERIFIED** | Queries public disaster hashtags via `https://mastodon.social`; rate limit interval $\ge 1.0\text{s}$; text keyword matching without coordinate fabrication. |

---

## 3. Configuration Reference

All application settings are defined in [app/core/config.py](back-end/app/core/config.py) and populated from `.env`:

### 3.1 Database & Core Infrastructure

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://postgres:postgres@localhost:5432/weather_platform` | Asynchronous PostgreSQL + PostGIS connection URI |
| `DATABASE_ECHO` | No | `False` | SQLAlchemy SQL statement logging flag |
| `REDIS_URL` | **Yes** | `redis://localhost:6379/0` | Redis connection URI for streams and caching |
| `REALTIME_STREAM_NAME` | No | `stream:weather:realtime` | Redis Stream key for browser SSE events |
| `REALTIME_STREAM_MAXLEN` | No | `10000` | Approximate cap on Redis Stream retention |

### 3.2 Outbox & Worker Settings

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `OUTBOX_WORKER_ENABLED` | No | `True` | Enables/disables outbox worker poll loop |
| `OUTBOX_WORKER_BATCH_SIZE` | No | `50` | Number of outbox rows claimed per batch |
| `OUTBOX_WORKER_POLL_INTERVAL_SECONDS` | No | `1.0` | Active polling loop frequency / idle sleep (seconds) |
| `OUTBOX_WORKER_MAX_ATTEMPTS` | No | `5` | Maximum delivery attempts before moving to `DEAD_LETTER` |
| `OUTBOX_WORKER_PRUNE_INTERVAL_SECONDS` | No | `3600` | Interval in seconds between historical prune runs |
| `OUTBOX_WORKER_RETENTION_HOURS` | No | `72` | Retention window in hours before pruning `PUBLISHED` rows |

### 3.3 Media Storage (MinIO / S3)

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `S3_ENDPOINT_URL` | No | `http://localhost:9000` | MinIO / S3 API endpoint |
| `S3_ACCESS_KEY_ID` | No | `minioadmin` | S3 / MinIO access key ID |
| `S3_SECRET_ACCESS_KEY` | No | `minioadmin` | S3 / MinIO secret access key |
| `S3_BUCKET_NAME` | No | `weather-media` | Object storage bucket for report attachments |
| `S3_REGION` | No | `us-east-1` | S3 region identifier |

### 3.4 External Feed Settings

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `IMD_API_ENDPOINT` | No | `https://api.imd.gov.in/api/v1` | IMD official API base URL |
| `IMD_API_KEY` | No | `""` | IMD API key (requires official IP whitelisting / credentials) |
| `NDMA_SACHET_RSS_URL` | No | `https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails` | NDMA SACHET CAP alert URL (Public POST) |
| `CWC_NWDP_API_ENDPOINT`| No | `https://nwdp.nwic.gov.in/api/3/action/datastore_search` | CWC river telemetry API endpoint |
| `CWC_NWDP_RESOURCE_ID` | No | `d80798b9-4b11-4626-8b63-964202ba7216` | NWDP CKAN DataStore resource identifier |
| `CWC_FETCH_LIMIT` | No | `50` | Default record fetch limit for CWC queries |
| `GDELT_DOC_ENDPOINT` | No | `http://api.gdeltproject.org/api/v2/doc/doc` | GDELT 2.0 Document API endpoint (Public GET) |
| `GDELT_MIN_REQUEST_INTERVAL_SECONDS` | No | `5.0` | Monotonic rate limit spacing between outbound GDELT requests |
| `MASTODON_INSTANCE_URL`| No | `https://mastodon.social` | Mastodon instance URL (Public GET) |
| `MASTODON_MIN_REQUEST_INTERVAL_SECONDS` | No | `1.0` | Monotonic rate limit spacing between outbound Mastodon requests |
| `MASTODON_HASHTAGS` | No | `["mumbairains","delhirains",...]` | JSON array of monitored disaster hashtags |

---

## 4. Local Execution & Operational Runbook

All platform execution instructions, terminal commands, service topologies, and troubleshooting workflows are consolidated in the central setup guide:

👉 **[docs/SETUP.md](SETUP.md)**

Please consult [docs/SETUP.md](SETUP.md) for:
- **One-Command Docker Demo Launch**: Fastest path to an isolated, seeded stack via `./scripts/demo-up.sh` and `./scripts/demo-seed.sh`.
- **Development Infrastructure Setup**: Running Postgres, Redis, and MinIO in Docker with local hot-reloading code.
- **Manual Setup Without Docker**: Native virtualenv configuration, background worker commands, and the unified developer orchestrator (`scripts/dev_orchestrator.py`).
- **Database Migrations & Seeding**: Alembic upgrade/downgrade commands and `seed_demo_data.py` usage.
- **Verification & Troubleshooting**: Health checks, port allocation conflicts, and connection pool sizing.

For interactive browser testing steps, see **[docs/MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md)**. For live presentation walkthroughs, see **[docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md)**.
