# Platform Setup & Operational Runbook

**Platform**: National Weather Big Data Analytics Platform (SIH26069)  
**Document Status**: **ACTIVE SOURCE OF TRUTH FOR REPOSITORY SETUP**  
**Last Verified**: 2026-10-02  

---

## 1. Overview & Architecture

The platform is an event-driven big data ingestion and situational awareness system consisting of:
1. **Frontend Web Client**: React 18 + Vite SPA with Leaflet GIS mapping, Recharts analytics, and role-based shells (Citizen & Staff).
2. **Backend REST & SSE API**: FastAPI async server running on Python 3.11+ providing 52 operations across 48 paths, JWT authentication, and real-time Server-Sent Events.
3. **Primary System of Record**: PostgreSQL 16 with PostGIS 3.4+ spatial extension (`SRID 4326`) across 22 tables.
4. **Buffer & Event Streaming**: Redis 7 managing 6 dedicated stream topics and operational caching.
5. **Object Storage**: S3-compatible MinIO storing citizen report media attachments (photos/videos).
6. **Background Worker Topology**: 6 asynchronous Python workers handling transactional outbox relays, orchestration dispatching (5-stage intelligence pipeline), external feed ingestion, observation processing, and evidence linking.

### Network Port & Service Map

| Subsystem | Service Name in Compose | Docker Demo Mode (`docker-compose.demo.yml`) | Local Dev / Hybrid Mode (`docker-compose.yml` + Local) | Protocol / Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Web Frontend** | `web` | `http://localhost:8080` (Nginx + SPA) | `http://localhost:5173` (Vite dev server) | HTTP / Static assets |
| **Backend API** | `api` | Internal only (proxied via `http://localhost:8080/api`) | `http://localhost:8000` | HTTP REST / FastAPI |
| **Realtime SSE** | `api` | `http://localhost:8080/api/v1/events/stream` | `http://localhost:8000/api/v1/events/stream` | Server-Sent Events |
| **PostgreSQL + PostGIS** | `postgres` | Internal network (`postgres:5432`) | `localhost:5432` | TCP / PostgreSQL Wire Protocol |
| **Redis Streams** | `redis` | Internal network (`redis:6379`) | `localhost:6379` | TCP / RESP Protocol |
| **MinIO API** | `minio` | Internal network (`minio:9000`) | `http://localhost:9000` | S3 REST API |
| **MinIO Console** | `minio` | Internal network (`minio:9001`) | `http://localhost:9001` | Web Admin UI |
| **Background Workers** | `worker-*` (6 services) | 6 containerized supervisor tasks | Standalone python processes or `dev_orchestrator.py` | CLI async tasks |

---

## 2. Prerequisites

Ensure your host environment meets the following minimum tool versions:

| Tool | Minimum Version | Verified In | Check Command |
| :--- | :---: | :--- | :--- |
| **Git** | `2.38+` | All platforms | `git --version` |
| **Docker Engine** | `24.0+` | macOS / Linux / WSL2 | `docker --version` |
| **Docker Compose** | `v2.20+` | Built-in Compose v2 | `docker compose version` |
| **Node.js** | `v20.x` or `v22.x LTS` | `front-end/Dockerfile` (`node:20-alpine`) | `node --version` |
| **npm** | `v10+` | Bundled with Node | `npm --version` |
| **Python** | `3.11+` to `3.14` | `back-end/Dockerfile` (`python:3.11-slim`) | `python3 --version` |

*Hardware Recommendation*: 4+ CPU cores, 8 GB+ RAM available (16 GB recommended for full local LLM/evaluation suites). Minimum 3.5 GB free RAM required for the 11 Docker demo containers.

---

## 3. Quick Start (Demo Mode with Docker)

The fastest path from a fresh clone to a fully functional, seeded evaluation stack using Docker Compose:

### Step 1: Clone and Enter Repository
```bash
git clone https://github.com/akshat-j1/sih26069-weather-platform.git
cd sih26069-weather-platform
```

### Step 2: Launch Demo Stack
Run the automated launch script. This creates a secure, randomized `.env.demo` file if absent, builds the container images, and starts all 11 services in the background:
```bash
./scripts/demo-up.sh
```

### Step 3: Seed Initial Accounts and Demo Data
Once containers are healthy, execute the seeding script to create default operator/admin accounts, emergency shelters, cyclone advisories, and ~500 pre-populated demo weather reports:
```bash
./scripts/demo-seed.sh
```

### Step 4: Access Applications & Verify

- **Web Dashboard**: [http://localhost:8080](http://localhost:8080)
- **Health Check**: `curl -s http://localhost:8080/health` (returns `{"status":"healthy"}`)
- **Readiness Check**: `curl -s http://localhost:8080/ready` (checks DB, Redis, and Alembic head)

### Default Demonstration Logins

| Role | Email Address | Password | Intended Workflow |
| :--- | :--- | :--- | :--- |
| **Emergency Operator** | `operator@weather-platform.gov.in` | `EmergencyOps2026!` | Triage queue, bulk verification, sensor inspection, audit logs |
| **System Administrator** | `admin@weather-platform.gov.in` | `EmergencyAdmin2026!` | Full administrative access, schema management, user roles |
| **Citizen User** | `citizen@example.com` | `CitizenPassword2026!` | Citizen dashboard, localized alerts, incident submission |

---

## 4. Full Docker Setup (Development Stack with `docker-compose.yml`)

Use this workflow to run stateful infrastructure (Postgres, Redis, MinIO) in Docker while developing the backend and frontend locally with hot reloading.

### Step 1: Start Core Infrastructure Containers
```bash
# From repository root
docker compose up -d
```
Verify the 3 containers are healthy:
```bash
docker compose ps
```

### Step 2: Configure Backend Environment
```bash
cp back-end/.env.example back-end/.env
```
Generate a secure 64-character hex secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
Open `back-end/.env` and update:
```dotenv
SECRET_KEY=<generated-64-character-hex>
ENVIRONMENT=development
DEBUG=true
```

### Step 3: Initialize Virtual Environment & Apply Migrations
```bash
cd back-end
python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -e ".[dev]"

# Apply all 20 Alembic migrations
PYTHONPATH=. alembic upgrade head
```

### Step 4: Seed Initial Data
```bash
python3 scripts/seed_demo_data.py
```

### Step 5: Start Backend API and Workers
Option A: Start the unified developer orchestrator (runs API, workers, and frontend):
```bash
# From repository root
python3 scripts/dev_orchestrator.py
```

Option B: Start manually in dedicated terminals:
- **Terminal 1 (API Server)**:
  ```bash
  cd back-end && source .venv/bin/activate
  uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Terminal 2 (Outbox Worker)**:
  ```bash
  cd back-end && source .venv/bin/activate
  python -m app.workers.run_outbox_worker
  ```
- **Terminal 3 (Orchestration Dispatcher)**:
  ```bash
  cd back-end && source .venv/bin/activate
  python -m app.workers.run_dispatcher
  ```

### Step 6: Start Frontend Development Server
```bash
cd front-end
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Manual Setup Without Docker (Native Host Installation)

If you are running native PostgreSQL with PostGIS, Redis, and MinIO installed directly on macOS/Linux:

### 1. Host Service Prerequisites
Ensure native services are running:
- PostgreSQL 16+ on port `5432` with PostGIS extension enabled:
  ```sql
  CREATE DATABASE weather_platform;
  \c weather_platform;
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```
- Redis 7+ running on port `6379`:
  ```bash
  redis-cli ping  # Expect PONG
  ```
- MinIO or local S3 emulator on port `9000` with default bucket `weather-media`:
  ```bash
  mc alias set local http://localhost:9000 minioadmin minioadmin
  mc mb local/weather-media
  ```

### 2. Configure Backend `.env`
Ensure connection strings match host configuration in `back-end/.env`:
```dotenv
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/weather_platform
REDIS_URL=redis://localhost:6379/0
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=weather-media
```

### 3. Initialize Database & Run Services
```bash
cd back-end
source .venv/bin/activate
PYTHONPATH=. alembic upgrade head
python3 scripts/seed_demo_data.py

# Launch development orchestrator
cd ..
python3 scripts/dev_orchestrator.py
```

---

## 6. Environment Variables Reference

All application configurations are defined in `back-end/app/core/config.py` and sourced from environment files.

### 6.1 Application & Security Core

| Variable Name | Required? | Default Value | Target Subsystem | Description & Guidance |
| :--- | :---: | :--- | :--- | :--- |
| `ENVIRONMENT` | No | `production` | Backend / API | Execution mode: `development`, `test`, `production`. |
| `DEBUG` | No | `false` | Backend / API | Enables detailed error traces. Set `false` in production. |
| `PROJECT_NAME` | No | `National Weather Big Data...` | Metadata | Display name in OpenAPI specifications. |
| `API_V1_STR` | No | `/api/v1` | Router | Canonical API prefix. |
| `SECRET_KEY` | **Yes** | *None* | Authentication | 64-char random hex key used for signing JWT tokens. |
| `ALGORITHM` | No | `HS256` | Authentication | Cryptographic signing algorithm for bearer tokens. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` (24h) | Authentication | JWT token validity window in minutes. |
| `ALLOWED_ORIGINS` | No | `["http://localhost:5173", ...]` | CORS Middleware | JSON list or comma-separated allowed web origins. |

### 6.2 PostgreSQL Database & Connection Pooling

| Variable Name | Required? | Default Value | Target Subsystem | Description & Guidance |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://...` | SQLAlchemy ORM | Asynchronous PostgreSQL connection URI. |
| `POSTGRES_DB` | No | `weather_platform` | Database | Database name. |
| `POSTGRES_USER` | No | `postgres` | Database | Database username. |
| `POSTGRES_PASSWORD` | **Yes** | `postgres` | Database | Database password. |
| `DATABASE_ECHO` | No | `false` | SQLAlchemy | Echoes generated SQL queries to stdout. |
| `DB_POOL_SIZE` | No | `10` (Dev) / `3` (Demo) | Connection Pool | Base persistent connections per process. |
| `DB_MAX_OVERFLOW` | No | `20` (Dev) / `2` (Demo) | Connection Pool | Surge connections allowed beyond pool size. |
| `DB_POOL_TIMEOUT` | No | `30` | Connection Pool | Seconds to wait before timing out on pool exhaustion. |
| `DB_POOL_RECYCLE` | No | `1800` (30m) | Connection Pool | Interval in seconds to recycle stale connections. |
| `DB_DISABLE_POOL` | No | `false` | Testing / Migrations | Disables pooling and forces `NullPool`. |

### 6.3 Redis Event Streams & Caching

| Variable Name | Required? | Default Value | Target Subsystem | Description & Guidance |
| :--- | :---: | :--- | :--- | :--- |
| `REDIS_URL` | **Yes** | `redis://localhost:6379/0` | Streaming / Cache | Redis server connection URI. |
| `REALTIME_STREAM_NAME` | No | `stream:weather:realtime` | SSE Transport | Stream key for frontend real-time updates. |
| `REALTIME_STREAM_MAXLEN`| No | `10000` | Stream Retention | Max messages retained in real-time stream. |

### 6.4 Object Storage (MinIO / S3)

| Variable Name | Required? | Default Value | Target Subsystem | Description & Guidance |
| :--- | :---: | :--- | :--- | :--- |
| `S3_ENDPOINT_URL` | No | `http://localhost:9000` | Media Storage | S3 API endpoint URL. |
| `S3_ACCESS_KEY_ID` | No | `minioadmin` | Media Storage | MinIO / S3 access key ID. |
| `S3_SECRET_ACCESS_KEY` | No | `minioadmin` | Media Storage | MinIO / S3 secret access key. |
| `S3_BUCKET_NAME` | No | `weather-media` | Media Storage | Storage bucket for report photographs. |
| `S3_REGION` | No | `us-east-1` | Media Storage | AWS region identifier. |
| `S3_USE_SSL` | No | `false` | Media Storage | Set `true` if endpoint is HTTPS. |

### 6.5 Background Workers & Outbox Engine

| Variable Name | Required? | Default Value | Target Subsystem | Description & Guidance |
| :--- | :---: | :--- | :--- | :--- |
| `OUTBOX_WORKER_ENABLED` | No | `true` | Outbox Worker | Enables outbox relay polling loop. |
| `OUTBOX_WORKER_BATCH_SIZE` | No | `50` | Outbox Worker | Rows claimed per batch (`SKIP LOCKED`). |
| `OUTBOX_WORKER_POLL_INTERVAL_SECONDS` | No | `1.0` | Outbox Worker | Polling interval when active. |
| `OUTBOX_WORKER_MAX_ATTEMPTS` | No | `5` | Outbox Worker | Maximum delivery attempts before dead-lettering. |

### 6.6 Feature Flags & AI Intelligence

| Variable Name | Required? | Default Value | Target Subsystem | Description & Guidance |
| :--- | :---: | :--- | :--- | :--- |
| `PHYSICAL_CORROBORATION_ENABLED` | No | `false` (Code) / `true` (Demo) | Intelligence | Enables Open-Meteo numerical model checks. |
| `PHYSICAL_CORROBORATION_DEMO_FIXTURE_ENABLED` | No | `false` (Code) / `true` (Demo) | Intelligence | Enables mock IMD station observations. |
| `IMAGE_FORENSICS_ENABLED` | No | `false` (Code) / `true` (Demo) | Forensics | Enables pHash/dHash media reuse scanning. |
| `IMAGE_FORENSICS_DEMO_FIXTURE_ENABLED` | No | `false` (Code) / `true` (Demo) | Forensics | Injects simulated duplicate image matches. |
| `LOCATION_MISMATCH_ENABLED` | No | `false` | Intelligence | Penalizes reports where text contradicts GPS. |
| `DUPLICATE_SEMANTIC_METHOD` | No | `sparse_tfidf_ngram_v1` | Deduplication | Algorithm for text similarity scoring. |

### 6.7 External Feed Adapters (Optional)

| Variable Name | Required? | Default Value | Target Subsystem | Description & Guidance |
| :--- | :---: | :--- | :--- | :--- |
| `IMD_API_ENDPOINT` | No | `https://api.imd.gov.in/api/v1` | Ingestion | IMD AWS API base URL (requires MoES IP whitelist). |
| `IMD_API_KEY` | No | *None* | Ingestion | Official IMD API token. |
| `NDMA_SACHET_RSS_URL` | No | `https://sachet.ndma.gov.in/...` | Ingestion | National disaster CAP alerts (Public POST). |
| `CWC_NWDP_API_ENDPOINT` | No | `https://nwdp.nwic.gov.in/...` | Ingestion | Central Water Commission CKAN river API. |
| `CWC_NWDP_RESOURCE_ID` | No | `d80798b9-4b11-4626-8b63...` | Ingestion | Telemetry resource ID (Krishna Basin). |
| `GDELT_DOC_ENDPOINT` | No | `http://api.gdeltproject.org/...`| Ingestion | GDELT 2.0 disaster news API. |
| `MASTODON_INSTANCE_URL`| No | `https://mastodon.social` | Ingestion | Public Mastodon instance for hashtag monitoring. |
| `MASTODON_HASHTAGS` | No | `["mumbairains", "flood", ...]`| Ingestion | Monitored emergency weather hashtags. |
| `DATA_GOV_API_KEY` | No | *None* | Ingestion | data.gov.in open data API key. |

---

## 7. Database Migrations & Seeding Runbook

Database evolution is managed strictly via Alembic. All commands must be executed within `back-end/` with `PYTHONPATH=.`.

### Check Current Migration Revision
```bash
cd back-end && source .venv/bin/activate
PYTHONPATH=. alembic current
```

### Inspect Target Head Revision
```bash
PYTHONPATH=. alembic heads
# Output should display: 0020_image_forensics (head)
```

### Apply All Pending Migrations
```bash
PYTHONPATH=. alembic upgrade head
```

### Roll Back One Revision (Single Step)
```bash
PYTHONPATH=. alembic downgrade -1
```

### Seed Demonstration Fixtures
Populates official categories, user accounts, relief centers, advisories, and ~500 weather reports:
```bash
python3 scripts/seed_demo_data.py
```

### Full Clean Reset
To erase all local databases, Redis volumes, and uploaded media attachments:
```bash
# For Demo stack:
docker compose -f docker-compose.demo.yml -p sih-demo down -v
rm -f .env.demo

# For Dev infrastructure stack:
docker compose down -v
```

---

## 8. Running Tests & Quality Gates

The repository enforces strict static analysis and automated testing gates across backend and frontend matching `.agents/workflows/verify.md`:

### Backend Quality Suite (`back-end/`)
```bash
cd back-end && source .venv/bin/activate

# 1. Run full automated test suite (609 tests)
pytest

# 2. Check code formatting with Ruff
ruff format --check .

# 3. Check linting rules with Ruff
ruff check .

# 4. Run static type checking with MyPy
mypy app

# 5. Execute end-to-end stack verification probe
python3 scripts/verify_stack.py
```

### Frontend Quality Suite (`front-end/`)
```bash
cd front-end

# 1. Static typecheck with TypeScript compiler
npm run typecheck

# 2. Run unit & component tests with Vitest (197 tests)
npm run test

# 3. Validate production bundle compilation
npm run build

# 4. ESLint inspection
npm run lint
```

---

## 9. Verifying the Setup (End-to-End Checklist)

Confirm your environment is running properly using this 6-step checklist:

1. **System Health Probe**:
   ```bash
   curl -s http://localhost:8080/health
   # Expected: {"success":true,"data":{"status":"healthy",...}}
   ```
2. **Database & Stream Readiness Probe**:
   ```bash
   curl -s http://localhost:8080/ready
   # Expected: {"success":true,"data":{"status":"ready","checks":{"database":"ok","redis":"ok","alembic":"0020_image_forensics"}}}
   ```
3. **Web Portal UI**:
   Open [http://localhost:8080](http://localhost:8080) (or `http://localhost:5173`). The home page loads with navigation tabs and zero browser console errors.
4. **Realtime SSE Streaming**:
   ```bash
   curl -N http://localhost:8080/api/v1/events/stream
   # Expected: Connected stream receiving initial SSE heartbeat comment ': ping'
   ```
5. **Submit a Test Report**:
   Navigate to `/report`, fill in title *"Flash flood drill test"*, select category *"Flood / Waterlogging"*, click *"Use My Location"*, and submit. You receive a unique Tracking ID (`RPT-YYYYMMDD-XXXXXXXX`).
6. **Operator Queue Verification**:
   Navigate to `/login`, authenticate as `operator@weather-platform.gov.in` / `EmergencyOps2026!`. You are directed to `/admin/queue` where your newly submitted report is visible for triage.

---

## 10. Troubleshooting Common Issues

### 1. Port Already in Use (Address Already Bound)
- **Symptom**: `docker compose up` fails with `Bind for 0.0.0.0:5432 failed: port is already allocated` or `listen tcp :8080: bind: address already in use`.
- **Cause**: Local PostgreSQL, Redis, or an existing dev server is already running on the host machine.
- **Fix**: Identify the conflicting process and stop it:
  ```bash
  # Check which process holds port 5432 or 8080
  lsof -i :5432
  lsof -i :8080
  # Stop local postgres if installed via Homebrew
  brew services stop postgresql@16
  ```

### 2. Missing or Corrupted `.env.demo`
- **Symptom**: `scripts/demo-up.sh` fails with variable expansion errors or container authentication fails.
- **Fix**: Remove the old generated environment file and re-run the startup script:
  ```bash
  rm -f .env.demo
  ./scripts/demo-up.sh
  ```

### 3. Database Authentication Mismatch on Re-created Containers
- **Symptom**: Backend logs show `asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "weather_demo"`.
- **Cause**: A Docker volume `demo_postgres` already exists from an earlier run with a different random password.
- **Fix**: Tear down the stack and remove the stale volume:
  ```bash
  docker compose -f docker-compose.demo.yml -p sih-demo down -v
  ./scripts/demo-up.sh
  ./scripts/demo-seed.sh
  ```

### 4. Database Connection Pool Exhaustion under Load
- **Symptom**: `TimeoutError: QueuePool limit of size 10 overflow 20 reached, connection timed out, timeout 30.00`.
- **Fix**: Ensure background workers are configured with `DB_POOL_SIZE=1` and `DB_MAX_OVERFLOW=1`. The API server should use `DB_POOL_SIZE=3` to stay within the PostgreSQL `max_connections=100` ceiling.

### 5. MinIO Media Upload Failure
- **Symptom**: Uploading photos fails with `S3ConnectionError` or `BucketDoesNotExist`.
- **Cause**: The `minio-init` service did not finish creating the `weather-media` bucket.
- **Fix**: Manually ensure the bucket exists:
  ```bash
  docker compose -f docker-compose.demo.yml -p sih-demo exec minio \
    mc alias set local http://localhost:9000 demoadmin <MINIO_PASSWORD>
  docker compose -f docker-compose.demo.yml -p sih-demo exec minio \
    mc mb --ignore-existing local/weather-media
  ```

### 6. Script Permission or Windows Line Ending Errors
- **Symptom**: `./scripts/demo-up.sh: /bin/bash^M: bad interpreter: No such file or directory` or `Permission denied`.
- **Fix**: Ensure executable permissions and convert line endings from CRLF to LF:
  ```bash
  chmod +x scripts/*.sh
  sed -i '' -e 's/\r$//' scripts/*.sh  # macOS
  ```

---

## 11. Stopping, Resetting, and Cleanup

### Stop Demo Stack (Preserving Data)
```bash
docker compose -f docker-compose.demo.yml -p sih-demo stop
```

### Stop Demo Stack and Remove Containers
```bash
docker compose -f docker-compose.demo.yml -p sih-demo down
```

### Full Clean Reset (Erase All Demo Data & Volumes)
Use this command to guarantee a completely fresh evaluation environment:
```bash
docker compose -f docker-compose.demo.yml -p sih-demo down -v
rm -f .env.demo
```

### Stop Dev Infrastructure Stack
```bash
docker compose down
# Or to wipe local development volumes:
docker compose down -v
```
