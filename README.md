# 🚀 CloudOps — Modern Cloud Observability & SRE Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.30+-326ce5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-v2.54-e6522c?logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-v11-F46800?logo=grafana&logoColor=white)](https://grafana.com/)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Jaeger-f5a800?logo=opentelemetry&logoColor=white)](https://opentelemetry.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**CloudOps** is a production-grade, multi-tenant Site Reliability Engineering (SRE) observability and operations platform. It combines synthetic uptime monitoring, multi-region latency probing, distributed log exploration, automated AI root cause diagnosis, Kubernetes cluster health analytics, and CI/CD deployment rollback management into a unified pane of glass.

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["Users & Clients"]
        User["Web Browser (React 18 + Vite)"]
        PublicUser["Public Status Page Visitor (/status)"]
    end

    subgraph ApplicationLayer["Application Tier"]
        API["Node.js Express Server :5000"]
        AuthMid["Tenant Isolation & JWT Middleware"]
        SocketServer["Socket.IO Real-Time Event Engine"]
        HealthEngine["Synthetic Health Checker & Prober"]
        AICopilot["AI Incident Copilot (Gemini AIOps)"]
        SSLService["SSL/TLS Certificate Scanner (tls.connect)"]
        GeoService["Global Multi-Region Edge Prober"]
        LogEngine["Distributed Log Stream & Query Engine"]
    end

    subgraph DatabaseLayer["Data Persistence"]
        PG[("PostgreSQL 17 Primary Database")]
    end

    subgraph ObservabilityLayer["Telemetry Stack"]
        Prometheus["Prometheus Time-Series Scraper :9091"]
        Alertmanager["Prometheus Alertmanager :9093"]
        Grafana["Grafana Dashboards :3002"]
        Jaeger["Jaeger Distributed Tracing (OTel) :16686"]
    end

    subgraph InfrastructureLayer["Infrastructure & Integrations"]
        K8s["Kubernetes Control Plane & Pods"]
        Slack["Slack & Discord Incident Webhooks"]
    end

    User -->|HTTP / REST| API
    User <-->|WebSockets| SocketServer
    PublicUser -->|Public Status API| API
    API --> AuthMid
    AuthMid --> PG
    SocketServer <--> API
    HealthEngine -->|Periodic Probes| API
    HealthEngine -->|Dispatches Alerts| Slack

    API -->|Distributed Traces| Jaeger
    API -->|PromQL Exporter| Prometheus
    Prometheus --> Alertmanager
    Grafana --> Prometheus

    API <--> K8s
    API --> AICopilot
    API --> SSLService
    API --> GeoService
    API --> LogEngine
```

---

## 🌟 Top 5 Enterprise SRE Features

### 1. 🤖 AI Incident Copilot (AIOps Root Cause Engine)
* **Automated Diagnostic Engine**: Correlates telemetry spikes, error logs, Kubernetes pod restarts, and recent CI/CD deployments to pinpoint the root cause of outages in seconds.
* **Confidence & Blast Radius**: Calculates diagnostic confidence (e.g. 96%), estimated impacted traffic percentage, and SLA breach risk.
* **1-Click Remediation Actions**:
  * `1-Click Rollback`: Reverts to the previous stable release with zero dropped requests.
  * `Scale Replicas`: Scales pod counts dynamically to distribute degraded load.
  * `Recycle Pod`: Gracefully recycles crashed containers and clears saturated memory buffers.

### 2. 🌐 Public Status Page Generator (`/status/:slug`)
* **Standalone Public Portal**: Unauthenticated, shareable public status page for customers and stakeholders.
* **90-Day Interactive Uptime Bars**: Daily uptime tiles with tooltip inspection (Date, Uptime %, Downtime Minutes).
* **Incident Notifications & Subscriptions**: Visitors can subscribe via **Email** or **Webhook (Slack/Discord)** to receive instant outage and recovery updates.
* **Live SLA Transparency**: Displays 90-day overall uptime (99.98%), average response time, and active notices.

### 3. 🔒 SSL / TLS Certificate Expiry Tracker & Security Audit
* **Real-time Node.js TLS Scanner**: Directly connects via `tls.connect` to port 443 to extract live certificate metadata without third-party paid APIs.
* **Security Grading**: Evaluates cipher suites, TLS 1.3 protocol support, and validity to assign security grades (`A+`, `A`, `B`, `F`).
* **Expiration Countdown & Warning System**:
  * 🟢 **Valid** (> 30 days remaining)
  * 🟡 **Renewal Due** (≤ 30 days remaining)
  * 🔴 **Critical Expiry** (≤ 7 days remaining or Expired)
* **Scan Any External Domain**: Built-in tool to audit any domain (e.g., `google.com`, `stripe.com`, `github.com`).

### 4. 🗺️ Global Multi-Region Latency & Waterfall Probing
* **5 Global Edge Locations**:
  * 🇺🇸 **US-East** (N. Virginia, USA)
  * 🇩🇪 **EU-Central** (Frankfurt, Germany)
  * 🇮🇳 **AP-South** (Mumbai, India)
  * 🇯🇵 **AP-Northeast** (Tokyo, Japan)
  * 🇧🇷 **SA-East** (São Paulo, Brazil)
* **Full Network Waterfall Breakdown**:
  * **DNS Lookup** ➔ **TCP Handshake** ➔ **TLS 1.3 Setup** ➔ **TTFB (Time to First Byte)** ➔ **Content Download**.
* **24-Hour Regional Trend Chart**: Hourly comparative graph tracking diurnal performance across global markets.

### 5. 📜 Live Distributed Log Stream & Query Explorer (`/logs`)
* **Live Tailing Stream**: Auto-streaming log viewer with animated pulse indicator.
* **Multi-Dimensional Filtering**: Filter by log level (`ALL`, `ERROR`, `WARN`, `INFO`, `DEBUG`), target service, or time range.
* **Search Query Parser**: Supports syntax queries (e.g., `status:500`, `timeout`, `pod:api-service-xyz`, `database`).
* **Expandable Structured Payloads**: Click any log to inspect formatted JSON metadata, trace IDs, pod instances, and stack traces.
* **1-Click AI Log Explanation**: Instant AI analysis explaining the error line and providing immediate remediation steps.
* **Export Options**: 1-click export to **JSON** and **CSV**.

---

## ☸️ Kubernetes Health Center & Microservices

The Kubernetes module monitors cluster infrastructure, deployments, and pods:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Kubernetes Pod Cluster                          │
├────────────────────────────────┬───────────────────────────────────────┤
│ Pod Name                       │ Role / Responsibility                 │
├────────────────────────────────┼───────────────────────────────────────┤
│ • cloudops-api                 │ Main API Gateway & Controller         │
│ • cloudops-frontend            │ React 18 / Vite Production Client     │
│ • postgres-0                   │ PostgreSQL 17 Relational Database     │
│ • redis-master                 │ In-Memory Cache & WebSockets Broker   │
│ • payments-service             │ Revenue-Critical Transaction Engine   │
└────────────────────────────────┴───────────────────────────────────────┘
```

* **Chaos Pod Failure Simulator**: Trigger simulated `Crash` on any pod to verify self-healing restart loops, Prometheus alert triggers, and instant Slack/Discord webhook alerts.
* **Why Redis?**: In-memory caching, API rate limiting, and pub/sub message distribution across WebSocket connections.
* **Why Payments Service?**: Simulates revenue-critical microservices with high SLA priorities in SRE incident management.

---

## 📊 Complete Observability & Telemetry Ports

| Component | Port | Description |
| :--- | :--- | :--- |
| **CloudOps Web Client** | `http://localhost:5173` | React 18 SRE Management Dashboard |
| **Public Status Page** | `http://localhost:5173/status` | Unauthenticated public uptime portal |
| **CloudOps REST API** | `http://localhost:5000` | Core Express Backend API |
| **Prometheus Server** | `http://localhost:9091` | Time-series scraper (`/metrics`) |
| **Grafana Dashboards** | `http://localhost:3002` | Metrics & infrastructure visualization |
| **Alertmanager** | `http://localhost:9093` | Alert grouping & webhook dispatcher |
| **Jaeger UI (OTel)** | `http://localhost:16686` | Distributed end-to-end trace viewer |

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** v20.x or higher
* **PostgreSQL** 16 or 17
* **Docker & Docker Compose** (for Prometheus, Grafana, Jaeger)

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Shivansh-212/cloudops.git
cd cloudops

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Configuration

Create `server/.env`:
```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cloudops
JWT_SECRET=super_secret_jwt_key_cloudops_2026
NODE_ENV=development
```

### 4. Start Infrastructure Containers

```bash
docker-compose -f monitoring/docker-compose.yml up -d
```

### 5. Launch & Shutdown (1-Command Up / Down)

#### 🟢 To Start Everything:
```bash
# Option A: From root directory
npm run up

# Option B (Windows): Double-click or run:
.\up.bat

# Option C (Linux/macOS):
./up.sh
```
*This starts the Backend API (`:5000`), Vite Frontend (`:5173`), and automatically opens `http://localhost:5173` in your default browser.*

---

#### 🔴 To Stop Everything:
```bash
# Option A: From root directory
npm run down

# Option B (Windows): Double-click or run:
.\down.bat

# Option C (Linux/macOS):
./down.sh
```
*This cleanly terminates all node processes and frees ports `5000` and `5173`.*

---

## 📡 API Endpoint Reference

### Monitoring & Probing
* `GET /api/v1/services` — List all monitored services for the active workspace.
* `POST /api/v1/services` — Create a new synthetic monitor.
* `POST /api/v1/services/test-probe` — Probe an external URL live without saving.
* `GET /api/v1/services/:id/ssl-check` — Real-time SSL certificate inspection.
* `POST /api/v1/services/ssl-scan` — Audit SSL for an arbitrary domain.
* `GET /api/v1/services/:id/geo-latency` — 5-region multi-continent latency probe.

### Public Status Page
* `GET /api/v1/public/status/:slug` — Unauthenticated public status & 90-day history.
* `POST /api/v1/public/subscribe` — Subscribe email or webhook to incident updates.

### Incidents & AI Copilot
* `GET /api/v1/incidents` — List recent incidents and SRE metrics (MTTR/MTTD).
* `GET /api/v1/incidents/:id` — Get incident details, timeline, and deployments.
* `GET /api/v1/incidents/:id/ai-diagnose` — Run Gemini AIOps root cause diagnosis.
* `POST /api/v1/incidents/:id/ai-remediate` — Execute 1-click remediation action.
* `POST /api/v1/incidents/:id/acknowledge` — Acknowledge an active incident.
* `POST /api/v1/incidents/:id/resolve` — Mark incident as resolved.

### Distributed Logs
* `GET /api/v1/logs` — Query distributed log streams with keyword and level filters.

### Kubernetes & Deployments
* `GET /api/v1/kubernetes/overview` — Cluster control plane and node metrics.
* `GET /api/v1/kubernetes/pods` — List pods, CPU/memory, and restart counts.
* `POST /api/v1/kubernetes/pods/:name/simulate` — Chaos crash simulation.
* `POST /api/v1/deployments/:id/rollback` — Trigger automated release rollback.

---

## 📜 License
This project is open-source software licensed under the [MIT License](LICENSE).
