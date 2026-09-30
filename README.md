# 🚀 CloudOps — Multi-Tenant Observability & SRE Operations Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.30+-326ce5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-v2.54-e6522c?logo=prometheus&logoColor=white)](https://prometheus.io/)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Jaeger-f5a800?logo=opentelemetry&logoColor=white)](https://opentelemetry.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**CloudOps** is a production-ready, multi-tenant Site Reliability Engineering (SRE) observability and operations platform. It provides unified monitoring for external websites, REST APIs, and connected cloud infrastructure with real-time alerting, incident response management, automated CI/CD deployment tracking, and Kubernetes cluster health diagnostics — all from a single pane of glass.

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["Users & Clients"]
        User["Browser Client (React 18 + Vite + Tailwind)"]
    end

    subgraph Gateway["Ingress & Gateway"]
        Nginx["Nginx Reverse Proxy / Load Balancer"]
    end

    subgraph ApplicationLayer["Application Tier"]
        AuthMid["Auth & Tenant Isolation Middleware"]
        API["Node.js Express Server (Cluster Engine)"]
        SocketServer["Socket.IO Real-Time Event Hub"]
        HealthEngine["Synthetic Health Checker & Prober"]
    end

    subgraph DatabaseLayer["Data Persistence"]
        PG[(PostgreSQL 17 Primary Database)]
    end

    subgraph ObservabilityLayer["Telemetry & Monitoring Stack"]
        Prometheus["Prometheus Time-Series Scraper (:9091)"]
        Alertmanager["Prometheus Alertmanager (:9093)"]
        Grafana["Grafana Provisioned Dashboards (:3002)"]
        Jaeger["Jaeger Distributed Tracing (OTel :16686)"]
        Loki["Loki & Promtail Log Aggregator (:3100)"]
    end

    subgraph InfrastructureLayer["Connected Infrastructure & CI/CD"]
        K8s["Kubernetes Cluster (Nodes, Pods, HPA, Events)"]
        Jenkins["Jenkins CI/CD Pipeline (Builds & Rollbacks)"]
        Slack["Slack & Discord Webhooks"]
    end

    User <-->|HTTP / REST| Nginx
    User <-->|WebSockets (Bi-directional)| SocketServer
    Nginx --> API
    API --> AuthMid
    AuthMid --> PG
    SocketServer <--> API
    HealthEngine -->|Periodic Probes| API
    HealthEngine -->|Trigger Alerts| Slack

    API -->|Distributed Traces| Jaeger
    API -->|Metrics Exporter| Prometheus
    Prometheus --> Alertmanager
    Alertmanager -->|Alert Webhooks| API
    Grafana --> Prometheus

    API <-->|Cluster API / kubeconfig| K8s
    Jenkins -->|Deployment Webhook| API
```

---

## 🌟 Core Platform Capabilities

```text
                                CLOUDOPS SAAS PLATFORM
                                          │
                                     User Signup
                                          ↓
                                 Create Workspaces
                    ┌─────────────────────┴─────────────────────┐
                    ↓                                           ↓
           External Websites & APIs                   Connected Infrastructure
           ├── HTTP GET / POST / HEAD                 ├── Kubernetes Kind / EKS Cluster
           ├── Custom Headers & Payloads              ├── OpenTelemetry Traces (Jaeger)
           ├── Rolling Uptime & Latency               └── Node Exporter / Prometheus
           └── SSL Certificate Check
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          ↓
                              User Alert Rule Engine
                                (No YAML Required)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ↓                     ↓                     ↓
             Live Dashboard         Incidents 2.0        Slack & Discord
             (WebSockets)          (Timeline & MTTR)      (Webhooks)
```

---

### 1. 🏢 Multi-Tenant Workspaces & Strict Isolation
* **User Accounts**: Authentication with bcrypt password hashing and JSON Web Tokens (JWT).
* **Workspace Scoping**: Each user organizes their monitoring targets into distinct projects (e.g. *E-Commerce Production*, *Payment Gateway*, *Portfolio*).
* **Data Privacy**: Tenant isolation is enforced at the database level across services, metrics, incidents, deployments, and alerts. User A can never access User B's targets, credentials, or telemetry logs.
* **Workspace Switcher**: Switch between projects or create new workspaces on the fly directly from the top navigation bar.

---

### 2. 🌐 Dual-Mode Monitoring Engine

| Capability | External Websites & REST APIs | Connected Cloud Infrastructure |
| :--- | :--- | :--- |
| **Target Types** | Public URLs, Microservices, API endpoints | Kubernetes Clusters (Kind, EKS, GKE), Docker hosts |
| **Methods** | `GET`, `POST`, `HEAD`, `PUT`, `PATCH` | Kubernetes API Client, OTLP Traces, Prometheus Scrapes |
| **Inspection** | HTTP status codes, latency, JSON bodies, headers | CPU/Memory limits, Pod restarts, Node pressures |
| **SSL Security** | Certificate expiry tracking & proactive warnings | Cluster certificate authority validation |
| **Frequency** | Every `30s`, `1m`, or `5m` | Continuous Prometheus & OpenTelemetry streams |

* **Live Test Probe**: Test any external endpoint (e.g. `https://instagram.com`, `https://google.com`) directly from the creation modal to verify latency and status before saving.
* **Custom Headers & Payloads**: Support for JSON request bodies and authentication headers (e.g. `Authorization: Bearer <token>`).

---

### 3. 🔔 No-Code Dynamic Alert Rules
* **UI-Driven Configuration**: Create and manage alert rules directly in the interface without writing Prometheus YAML or modifying server configs.
* **Condition Triggers**:
  * **Latency Threshold**: Trigger alerts when response time exceeds a specified limit (e.g. `Response Time > 500ms for 1m`).
  * **Availability**: Trigger critical alerts when an endpoint is unreachable or down.
  * **Status Code**: Trigger warnings when HTTP responses do not match the expected status (e.g. `Status != 200`).
* **Severities**: `Critical`, `Warning`, and `Info`.
* **Automated Evaluation**: Evaluated continuously on every probe cycle by the synthetic health engine.

---

### 4. 🚨 Incident Management 2.0 & SRE Operations
* **Lifecycle State Machine**: Supports `OPEN` ➔ `ACKNOWLEDGED` ➔ `RESOLVED`, with automatic resolution when targets recover.
* **Interactive Timeline**: Every incident includes a chronological audit log tracking alert triggers, notifications dispatched, engineer acknowledgments, and resolution events.
* **Automated SRE Metrics**:
  * **MTTR (Mean Time to Resolution)**: Calculates real-time recovery duration.
  * **MTTD (Mean Time to Detection)**: Evaluates response speed.
  * **Incident Counters**: Real-time badges across sidebars and dashboard KPIs.

---

### 5. 💬 Multi-Channel Notification Dispatcher
* **Slack Webhooks**: Delivers rich alert cards to dedicated workspace channels (e.g. `#production-alerts`) detailing the affected target, rule triggered, latency, and timestamp.
* **Discord Webhooks**: Broadcasts incident notifications and recovery updates to Discord channels.
* **Email Summaries**: Toggles daily SRE health digests and critical outage reports.
* **Live Test Verification**: Dedicated "Test Ping" buttons in workspace settings verify webhook delivery immediately.

---

### 6. ⚡ Real-Time WebSocket Streaming (Socket.IO)
* **Zero-Refresh UI**: The dashboard, incident lists, and telemetry charts update instantaneously via WebSockets when events occur.
* **Live Connection Indicator**: Pulsing status badge indicating real-time socket connectivity.
* **Response Time Trends**: Interactive visual graphs tracking multi-target latency over time.
* **Health Distribution Donut Chart**: Visual breakdown of operational vs degraded services.
* **Live Activity Ticker**: Real-time stream of cluster events, deployment rollouts, and alert changes.

---

### 7. 🚢 CI/CD Deployment Tracking & Rollback Engine
* **Flexible Ingestion**: Track software releases from **Jenkins Pipelines**, **GitHub Actions**, **GitLab CI**, or direct UI triggers.
* **DORA Metrics**:
  * **Deployments Today** & Total Release Volume.
  * **Change Failure Rate (%)**.
  * **Mean Deployment Duration**.
  * **Rollback Frequency (%)**.
* **Release Metadata**: Records Git commit SHA, branch, author, build duration, Docker image tag, and CI build URL.
* **One-Click Rollbacks**: Revert to previous stable versions with an automated audit log entry.

---

### 8. ☸️ Kubernetes Health Center
* **Cluster Overview**: Live monitoring of control plane status, total worker nodes, CPU/Memory resource utilization, and active deployments.
* **Pod Explorer**: Complete list of running pods across all namespaces (`production`, `staging`, `kube-system`), replica counts, restarts, and node assignments.
* **Failure Simulator**: Built-in Chaos testing to simulate `CrashLoopBackOff`, `OOMKilled`, or `Failed` states to validate self-healing architectures.
* **HPA & Autoscaling**: Monitor Horizontal Pod Autoscalers (min/max replicas and target CPU percentages).

---

### 9. 🔭 Distributed Observability Trio

| Component | Port | Purpose |
| :--- | :--- | :--- |
| **Prometheus** | `:9091` | High-performance time-series metric collection and scraping. |
| **Alertmanager** | `:9093` | Alert routing, deduplication, and notification webhooks. |
| **Grafana** | `:3002` | Provisioned dashboards for multi-dimensional data visualization. |
| **Jaeger (OTel)** | `:16686` | Distributed request tracing across HTTP endpoints and DB queries. |
| **Loki & Promtail** | `:3100` | Centralized log ingestion, indexing, and stream querying. |
| **Node Exporter** | `:9100` | Host hardware and OS metric monitoring. |

---

## 🔒 Security & Data Isolation Architecture

```text
┌────────────────────────────────────────────────────────┐
│                      Tenant Isolation                  │
├────────────────────────────┬───────────────────────────┤
│ User A (Workspace: Store)  │ User B (Workspace: API)   │
├────────────────────────────┼───────────────────────────┤
│ • https://myshop.com       │ • https://myapi.io/health │
│ • Store Alert Rules        │ • API Alert Rules         │
│ • User A Slack Webhooks    │ • User B Discord Webhooks │
│ • Isolated DB Records      │ • Isolated DB Records     │
└────────────────────────────┴───────────────────────────┘
```

* **Password Security**: Bcrypt with salted rounds.
* **Token Verification**: Stateless JSON Web Tokens validated on every protected API route.
* **Database Constraints**: Foreign key constraints and query-level `project_id` scoping prevent cross-tenant data leaks.
* **Backend Probe Engine**: Synthetic probes execute securely from backend Node.js workers to prevent browser sandbox restrictions (CORS).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
