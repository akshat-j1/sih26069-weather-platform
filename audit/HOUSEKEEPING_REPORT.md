# Housekeeping Audit Report & Phase 1 Analysis

**Branch**: `chore/housekeeping`  
**Generated**: 2026-10-02  
**Repository**: `akshat-j1/sih26069-weather-platform`  
**Commit Baseline**: `bca2f30` (HEAD)  
**Scope**: Safe repo hygiene pass — (1) junk/log/generated files, (2) markdown docs accuracy, (3) duplicate files.  
*Strictly excluded from editing: `back-end/app/`, `front-end/src/`, `back-end/alembic/`, `back-end/tests/`, Dockerfiles, docker-compose files, `alembic.ini`, `.env*.example`, lockfiles, CI configs.*

---

## 1. Phase 0: Baseline Metrics (Pre-Modification State)

Before inspecting or proposing any changes, the full baseline verification suite was executed:

| Verification Metric | Baseline Result | Details / Output |
| :--- | :---: | :--- |
| **Git Branch & Status** | `chore/housekeeping` | Branch created off `main` at `bca2f30`. Working tree clean (0 untracked files). |
| **Tracked File Count** | **725 files** | Measured via `git ls-files \| wc -l` |
| **Repository Disk Size** | **717 MB total** (689 MB excluding `.git` 28 MB) | Dominated by `back-end/.venv` (320 MB) and `front-end/node_modules` (230 MB). Code & assets ~139 MB (`audit/` 24 MB, `logs/` 680 KB, `design-reference/` 5.8 MB). |
| **Backend Test Suite (`pytest`)** | **609 passed, 0 failed** | Ran across 66 test files in 125.59s (5,697 third-party deprecation warnings). |
| **Backend Static Gates** | `alembic heads` clean | `0020_image_forensics (head)` |
| **Frontend Typecheck (`tsc --noEmit`)** | **0 errors** | Passed cleanly (`npm run typecheck`). |
| **Frontend Tests (`vitest run`)** | **197 passed, 0 failed** | Ran across 19 test files in 1.80s. |
| **Frontend Build (`npm run build`)** | **Built in 2.20s** | Zero bundling errors, chunks emitted cleanly to `front-end/dist/`. |
| **Docker Compose Config (`docker-compose.yml`)** | **VALID** | Validated via `docker compose -f docker-compose.yml config > /dev/null`. |
| **Docker Compose Demo Config (`docker-compose.demo.yml`)** | **VALID** | Validated via `docker compose -f docker-compose.demo.yml config > /dev/null`. |

*Pre-existing issues noted*: None. All tests, builds, and compose configurations validate.

---

## 2. Section A: Junk / Log / Generated Files Audit

### Summary Matrix

| Path / Pattern | Disk Size | Git-Tracked? | In `.gitignore`? | Referenced By | Proposed Verdict |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **`audit/logs/` (10 empty 0-byte files)** | 0 bytes | **Yes (10 files)** | **Yes** (`audit/logs/`) | 0 references across entire codebase | **DELETE** |
| **`audit/logs/` (129 non-empty log files)** | ~5.1 MB | **Yes (129 files)** | **Yes** (`audit/logs/`) | 77 cited in older audit scripts / `logs/C_5.log`; 52 unreferenced | **UNTRACK+IGNORE** (keep on disk, `git rm --cached`) |
| **`audit/logs/b4_cprofile.pstats`** | 1.6 MB | No | Yes (`*.pstats`, `audit/logs/`) | `audit/c3_profiler.py`, `c3_baseline.json` | **KEEP ON DISK** (Already untracked & ignored) |
| **`logs/C_2.log`, `C_3.log`, `C_4.log`, `C_7.log`** | ~92 KB | Yes | No | **Active evidence**: `README.md`, `docs/PITCH.md`, `docs/DEMO_SCRIPT.md` | **KEEP** |
| **`logs/A_6.log`, `C_8.log`, `L5_1.log`** | ~17 KB | Yes | No | `docs/PROJECT_PROGRESS.md`, `l5_baseline.py` | **KEEP** |
| **`logs/` (remaining 45 execution run logs)** | ~570 KB | Yes | No | Only referenced by `logs/C_5.log` (audit roll-up) or unreferenced | **UNTRACK+IGNORE** (`.gitignore` `logs/` + `git rm --cached`) |
| **`audit/*.json, *.csv, *.jsonl` (9 files)** | ~503 KB | Yes | No | Active evaluation datasets (`s1_labelled_events_TEMPLATE.csv`, `holdout_r4_v2.jsonl`, `rss_snapshot_k1.json`, etc.) | **KEEP** |
| **`audit/s1_hindi_review_needed.txt`** | 2.5 KB | Yes | No | 0 code/doc references (standalone review notes) | **MOVE** to `docs/` or **KEEP** |
| **`audit/test_media/` (4 media files)** | 16 MB | 3 files tracked (`large_16mb.jpg` is untracked & ignored) | Yes (`large_16mb.jpg`) | `back-end/tests/test_reports.py` (upload limit & security tests) | **KEEP** |
| **`design-reference/` (14 PNG files)** | 5.8 MB | Yes (14 files) | No | **0 references** across all code, tests, scripts, and docs | **NEEDS HUMAN DECISION** (Untrack / Move to archive / Delete) |
| **`design-reference/.DS_Store`** | 6.1 KB | No | Yes (`.DS_Store`) | OS metadata | **DELETE FROM DISK** |
| **`front-end/.gitkeep`, `back-end/.gitkeep`** | 136 bytes | Yes | No | 0 references (superfluous, directories have hundreds of files) | **DELETE** |
| **`back-end/alembic/versions/.gitkeep`** | 0 bytes | Yes | No | Alembic migration folder | **KEEP** (Under hard rule: do not touch `back-end/alembic/`) |
| **`.mypy_cache/`, `back-end/.mypy_cache/`** | ~2.4 MB | No | **No (Missing from `.gitignore`)** | MyPy static analysis cache | **ADD TO `.gitignore`** |
| **`.ruff_cache/`, `back-end/.ruff_cache/`** | ~1.1 MB | No | **No (Missing from `.gitignore`)** | Ruff linter cache | **ADD TO `.gitignore`** |
| **`front-end/dist/`** | ~2.5 MB | No | Yes (`dist/`) | Vite production build artifact | **KEEP ON DISK** (Already ignored) |

---

### Tracked Files That `.gitignore` Says Should Be Ignored (Safest Wins)

Line 56 of `.gitignore` explicitly declares `audit/logs/`. However, **all 139 files** in `audit/logs/` were previously force-committed into git. 

- **Total tracked files matching `.gitignore`**: **139 files** in `audit/logs/`.
- **Recommended Action**:
  1. Delete the 10 empty 0-byte files via `git rm`.
  2. Untrack the remaining 129 generated audit logs via `git rm --cached audit/logs/*` so they remain preserved on the local developer disk but no longer bloat git history or clones.

### The 10 Empty 0-Byte Log Files (Zero References, Safe Deletion)

| File Path | Disk Size | Git Tracked? | References Found | Reference Proof Status |
| :--- | :---: | :---: | :---: | :---: |
| `audit/logs/A10_gzip.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A10_ssl.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A3_grep.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A6_test.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A9_metrics.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A10_react_lazy.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A10_xclaim.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A9_worker_health.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A10_pool.txt` | 0 B | Yes | 0 | **PASSED** |
| `audit/logs/A5_create_report.txt` | 0 B | Yes | 0 | **PASSED** |

---

## 3. Section B: Markdown Accuracy Check

Every `.md` file in the repository (22 total) was audited against active code, file trees, router registries, Alembic migrations, and test runs:

| Markdown File | Purpose | Last Git Modified | Verified Status | Specific Wrong Lines / Issues | Proposed Fix |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`README.md`** | Primary project overview, architecture, demo quickstart, and benchmarks. | 2026-10-01 (`1ee1d66`) | **PARTIAL** | **L121**: Claims `190 tests passed` (now 197 after role shell tests in `bca2f30`). | Update frontend test count to `197 tests passed`. |
| **`AGENTS.md`** | Architecture rules and developer operating boundaries. | 2026-10-01 (`7ac88c5`) | **UP TO DATE** | None. All references and stack rules are consistent with code. | None needed. |
| **`.agents/rules/project-rules.md`** | Persistent behavioral rules and strict guardrails. | 2026-08-29 (`afed4c7`) | **UP TO DATE** | None. Guardrails strictly conform to architecture. | None needed. |
| **`.agents/workflows/checkpoint.md`** | Atomic commit and hygiene protocol. | 2026-10-01 (`7ac88c5`) | **UP TO DATE** | None. Pre-commit checklist matches repository structure. | None needed. |
| **`.agents/workflows/verify.md`** | Verification commands and gates for backend and frontend. | 2026-08-29 (`afed4c7`) | **UP TO DATE** | All commands (`mypy`, `ruff`, `pytest`, `npm run typecheck`, `npm run build`) valid. | None needed. |
| **`audit/REPORT.md`** | Initial historical repository audit report (Round 9a). | 2026-09-30 (`162c8f6`) | **UP TO DATE** (Historical) | Historical record documenting initial failures that were resolved in later rounds. | Add header note clarifying it is an immutable historical audit record. |
| **`docs/API_CONTRACT.md`** | REST API specifications and endpoint catalog. | 2026-09-30 (`b4a74c9`) | **PARTIAL** | **L6 vs L71**: L6 states `31 operations across 30 canonical paths` while L71 header states `22 Paths / 23 Operations`. | Harmonize catalog count to actual registered endpoints (31 operations). |
| **`docs/ARCHITECTURE.md`** | High-level system design, data flow, and stream topologies. | 2026-09-30 (`b4a74c9`) | **UP TO DATE** | All 6 Redis streams and worker roles accurately reflect code. | None needed. |
| **`docs/DATA_MODEL.md`** | Database schema, table relationships, and Alembic mapping. | 2026-09-30 (`b4a74c9`) | **OUTDATED** | **L4**: States `Alembic Head: 0017_report_is_demo` (Head is `0020_image_forensics`). **L11**: States `15 authoritative tables` (now 21 tables including relief centers, advisories, physical corroboration, and forensics). | Update Alembic Head to `0020_image_forensics` and update table catalog to include migrations 0018–0020. |
| **`docs/DEMO_SCRIPT.md`** | Live hackathon demo presentation script and failure recovery drill. | 2026-10-01 (`b7b104e`) | **UP TO DATE** | All cited scripts (`./scripts/demo-up.sh`, `./scripts/demo-seed.sh`) and logs exist. | None needed. |
| **`docs/EXTERNAL_SETUP.md`** | Local vs cloud services, env vars, and adapter credentials. | 2026-10-01 (`f911a29`) | **PARTIAL** | **L16**: States `Alembic Migrations (0001 -> 0004)` in ASCII diagram. | Update to `0001 -> 0020`. |
| **`docs/IMPLEMENTATION_PLAN.md`** | Implementation history and completed phases. | 2026-09-30 (`b4a74c9`) | **UP TO DATE** (Historical) | Covers Phases 0 through 19 accurately. | None needed. |
| **`docs/LOAD_REPORT.md`** | Locust load benchmark report and latency percentiles. | 2026-10-01 (`3dff6d5`) | **UP TO DATE** | Citations match `logs/C_4.log` exactly. | None needed. |
| **`docs/MANUAL_TESTING_GUIDE.md`** | Step-by-step UI and API verification guide. | 2026-10-01 (`1cbcc3e`) | **UP TO DATE** | Documented URLs (`:5173`, `:8000`, `:8001`) and steps match code. | None needed. |
| **`docs/PITCH.md`** | Hackathon pitch deck, architecture defense, and hard Q&A. | 2026-10-01 (`b7b104e`) | **UP TO DATE** | Citations to `logs/C_2.log`, `logs/C_3.log`, `logs/C_4.log` exist. | None needed. |
| **`docs/PRD.md`** | Product Requirements Document and problem statement scope. | 2026-10-01 (`2d687b9`) | **UP TO DATE** | Accurately describes platform scope and deliverables. | None needed. |
| **`docs/PROJECT_PROGRESS.md`** | Master audit log, issue tracking, and workstream status. | 2026-10-02 (`bca2f30`) | **UP TO DATE** | Recently updated with N1-N7 navigation items. | None needed. |
| **`docs/PROJECT_STATUS.md`** | Authoritative subsystem synchronization matrix. | 2026-10-01 (`f911a29`) | **OUTDATED** | **L15**: HEAD commit cited as `ba4d349` (now `bca2f30`).<br>**L18**: Backend test baseline says `479 passed` (now `609 passed`).<br>**L19**: Frontend test baseline says `180 passed` (now `197 passed`).<br>**L30**: Broken path `front-end/src/pages/ReportTrackingPage.tsx` (real file: `TrackReportPage.tsx`).<br>**L43**: Broken path `back-end/app/intelligence/pipeline.py` (real file: `back-end/app/orchestration/incident_pipeline.py`).<br>**L58**: Broken path `front-end/src/components/common/LocationGateModal.tsx` (real file: `front-end/src/components/location/LocationGateModal.tsx`).<br>**L60**: Broken path `back-end/app/services/osrm_service.py` (real file: `back-end/app/services/route_service.py`).<br>**L60**: Broken path `front-end/src/components/common/RouteBlockageChecker.tsx` (real file: `front-end/src/components/route/RouteBlockageChecker.tsx`).<br>**L63**: Broken path `Navbar.tsx` (refactored to `CitizenNavbar.tsx` / `StaffNavbar.tsx`). | Update HEAD commit, test baselines (609/197), and correct all 6 broken path links. |
| **`docs/S1_PHYSICAL_CORROBORATION.md`** | S1 physical weather corroboration architecture and evaluation. | 2026-10-01 (`4646f6e`) | **UP TO DATE** | Accurately describes Open-Meteo model evaluators and IMD mock fixtures. | None needed. |
| **`docs/S2_IMAGE_FORENSICS.md`** | S2 image forensics and perceptual hashing specifications. | 2026-10-01 (`2d687b9`) | **UP TO DATE** | pHash DCT-II and dHash Hamming distance thresholds align with code. | None needed. |
| **`docs/TECH_STACK.md`** | Technology stack reference and Architecture Decision Records (ADRs). | 2026-09-01 (`63cb018`) | **UP TO DATE** | Stack tables match active dependencies. | None needed. |
| **`docs/USER_GUIDE.md`** | Comprehensive end-user and operator manual. | 2026-09-01 (`0167e34`) | **PARTIAL** | **L33**: States `10 user-facing screens` (now 15 screens with `/citizen-dashboard`, `/my-reports`, `/national-map`, `/welcome`, `/signup`, `/admin/audit-log`). | Update screen inventory to reflect role-based shell navigation. |

---

## 4. Section C: Duplicate Files Audit

### Exact Duplicates (Identical SHA-256 Hash)

| Content Hash (SHA-256) | File Size | Duplicate Files Group | Canonical File | Resolution |
| :--- | :---: | :--- | :--- | :--- |
| `b2fc16cc1569...` | 3,927 B | `audit/logs/K0_observation_after_truncate.log`<br>`audit/logs/K0_observation_repeat_1.log` | `K0_observation_after_truncate.log` | Untrack & ignore per `audit/logs/` rule. |
| `3633ba58f0df...` | 263 B | `audit/logs/K1_7_audit_upgrade_0018_again.log`<br>`audit/logs/K1_7_audit_upgrade_0018.log`<br>`audit/logs/K1_7_test_upgrade_0018.log` | `K1_7_audit_upgrade_0018.log` | Untrack & ignore per `audit/logs/` rule. |
| `445570109520...` | 155 B | `audit/logs/K0_alembic_audit_current.log`<br>`audit/logs/K0_alembic_dev_current.log`<br>`audit/logs/K0_alembic_test_current.log` | `K0_alembic_audit_current.log` | Untrack & ignore per `audit/logs/` rule. |
| `1aeeb2c4ee77...` | 45 B | `audit/logs/K0_mypy_after_fix.log`<br>`audit/logs/K0_mypy_initial.log`<br>`audit/logs/K0_mypy_final.log` | `K0_mypy_final.log` | Untrack & ignore per `audit/logs/` rule. |
| `82b3e6a6c090...` | 19 B | `audit/logs/K0_ruff_final.log`<br>`audit/logs/K0_ruff_after_fix.log` | `K0_ruff_final.log` | Untrack & ignore per `audit/logs/` rule. |
| `79977a934228...` | 68 B | `front-end/.gitkeep`<br>`back-end/.gitkeep` | Neither | **DELETE BOTH** (Directories contain dozens of files; `.gitkeep` is redundant). |
| `c979b00eeebb...` | 1,295 B | `front-end/public/static/eez_india_boundary.geojson`<br>`front-end/dist/static/eez_india_boundary.geojson` | `front-end/public/static/eez_india_boundary.geojson` | **KEEP BOTH** (`dist/` is the generated build copy, ignored in `.gitignore`). |

### Near Duplicates & Variant Groups

1. **Audit Alembic Run Logs (`audit/logs/K0_alembic_check_*.log`)**:
   - `K0_alembic_check_initial.log` (108,504 B) vs `K0_alembic_check_final.log` (108,502 B) — 2 bytes difference in execution timestamps.
   - *Resolution*: Untrack both as part of `audit/logs/` untracking.
2. **Audit Pytest Run Logs (`audit/logs/K0_pytest_*.log`)**:
   - `K0_pytest_run1.log` (32 KB), `run2` (31 KB), `run3` (32 KB), `final_1` (31 KB), `final_2` (32 KB), `final_3` (31 KB).
   - *Resolution*: Untrack all as part of `audit/logs/` untracking.
3. **Format Run Logs (`audit/logs/K0_format_*.log`)**:
   - `K0_format_initial.log` (84.5 KB), `after_fix.log` (84.5 KB), `final.log` (86.2 KB).
   - *Resolution*: Untrack all as part of `audit/logs/` untracking.

### Overlapping Modules by Purpose (Report Only)

1. **`scripts/` vs `back-end/scripts/` vs `audit/scripts/`**:
   - `scripts/`: Platform-level deployment and demo orchestration (`demo-up.sh`, `demo-seed.sh`, `dev_orchestrator.py`).
   - `back-end/scripts/`: Backend database seeders and baseline probes (`seed_demo_data.py`, `l5_baseline.py`, `verify_stack.py`).
   - `audit/scripts/`: 29 specialized benchmark, load testing, and empirical evaluation harnesses (`c1_eval.py`, `e1_precision_analysis.py`, etc.).
   - *Finding*: Clean segregation of responsibilities. No accidental code collisions.
2. **`front-end` Component Pairs with Identical Names**:
   - `features/dashboard/EventDistributionCard.tsx` vs `features/analytics/EventDistributionCard.tsx` (Different props and data wiring).
   - `features/home/RecentReportsTable.tsx` vs `features/analytics/RecentReportsTable.tsx` (Different columns and click handlers).
   - *Finding*: Intentionally tailored for distinct views. Kept as-is per hard rules.

---

## 5. Reference Proof Checklist for Planned Removals

Before any removal in Phase 2, each candidate was audited:

- [x] **10 empty `audit/logs/A*.txt` files**: Grep across all code, tests, docs returned 0 matches. Not read by tests or scripts.
- [x] **`front-end/.gitkeep` and `back-end/.gitkeep`**: Grep returned 0 matches. Both directories have extensive tracked files.
- [x] **`design-reference/.DS_Store`**: OS metadata file. 0 references.
- [x] **Missing cache ignores (`.mypy_cache/`, `.ruff_cache/`)**: Not tracked; adding to `.gitignore` prevents future accidental commits.

---

## 6. Needs Human Decision (Flagged for Review Before Phase 2)

1. **`design-reference/` (14 PNG files, 5.8 MB)**:
   - Contains UI screenshots from earlier design sprints (`home-desktop.png`, `live-map-desktop.png`, etc.).
   - Zero references in code, tests, or documentation.
   - *Decision choices*:
     - **Option A (Recommended)**: Keep in repo for visual UI history.
     - **Option B**: Remove from git tracking (`git rm --cached design-reference/*`) to save 5.8 MB on fresh clones.
     - **Option C**: Delete entirely from repository.
2. **`audit/s1_hindi_review_needed.txt` (2.5 KB)**:
   - Standalone review notes for Hindi localization.
   - *Decision*: Keep in `audit/` or move to `docs/`? (Recommended: Keep in `audit/`).
3. **`logs/` (root folder, 52 files, 680 KB)**:
   - `C_2.log`, `C_3.log`, `C_4.log`, `C_7.log`, `A_6.log`, `C_8.log`, `L5_1.log` are active evidence cited in `README.md` and `docs/`.
   - The remaining 45 logs are historical run logs.
   - *Recommendation*: Keep all 52 files or untrack only the 45 unreferenced ones? (Recommended: Keep the 7 cited evidence logs firmly tracked, untrack the 45 stale execution dumps).

---

## 7. Out-of-Scope Code Observations (Report Only)

- `back-end/app/api/v1/dashboard.py` and `analytics.py`: 5 deprecation warnings regarding `HTTP_422_UNPROCESSABLE_ENTITY` (Starlette recommends `HTTP_422_UNPROCESSABLE_CONTENT`).
- `back-end/app/services/route_service.py`: OSRM routing client handles connection timeouts gracefully with great-circle fallback, but could benefit from a persistent retry circuit breaker.
