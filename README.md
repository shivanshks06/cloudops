# 🚀 CloudOps - Observability & SRE Incident Management Platform

CloudOps is an enterprise-grade SRE (Site Reliability Engineering) observability dashboard and incident management platform. It includes real-time health metrics, automated chaos testing endpoints, Prometheus/Grafana monitoring with auto-provisioned dashboards, a multi-container Docker Compose architecture, Kubernetes manifests with HPA auto-scaling, and a full Jenkins CI/CD pipeline with automated zero-downtime rollouts and failure rollbacks.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS / Vanilla CSS, Lucide Icons
- **Backend**: Node.js, Express.js, PostgreSQL (`pg`), `prom-client` telemetry metrics
- **Database**: PostgreSQL 17 (with automated `node-pg-migrate` execution)
- **Monitoring & Observability**: Prometheus, Grafana (with auto-provisioned Prometheus datasource & JSON dashboards), Node Exporter
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (Kind / Minikube) with Kustomize, HPA, Ingress, and PVC
- **CI/CD Pipeline**: Jenkins (Automated build, test, Docker Hub push, Kubernetes rollout/rollback, and health validation)

```mermaid
flowchart TD
    subgraph Clients["User & Admin Access"]
        Browser["React Client (Vite: 5173 / Nginx: 8081)"]
    end

    subgraph ReverseProxy["Ingress / Gateway"]
        Nginx["Nginx Reverse Proxy (8081)"]
    end

    subgraph BackendServices["Application Tier"]
        API["Node.js Express API (5000)"]
        DB[(PostgreSQL 17: 5432)]
    end

    subgraph Observability["Monitoring & Telemetry"]
        Prometheus["Prometheus (9090)"]
        Grafana["Grafana Dashboard (3001)"]
        NodeExporter["Node Exporter (9100)"]
    end

    subgraph Pipeline["CI/CD Automation"]
        Jenkins["Jenkins Server (8082)"]
        K8sCluster["Kubernetes Cluster (Kind / Minikube)"]
    end

    Browser --> Nginx
    Nginx --> API
    API --> DB
    Prometheus --> API
    Prometheus --> NodeExporter
    Grafana --> Prometheus
    Jenkins --> K8sCluster
```

---

## 📌 Service Port Mapping

| Service Name | Container Port | Host Port | Description |
|---|---|---|---|
| **CloudOps Client** | `5173` | `http://localhost:5173` | Frontend SRE Dashboard |
| **CloudOps API** | `5000` | `http://localhost:5000` | Backend REST API & Telemetry (`/health`, `/metrics`) |
| **Nginx Gateway** | `80` | `http://localhost:8081` | Reverse Proxy Entry Endpoint |
| **PostgreSQL DB** | `5432` | `localhost:5432` | Primary Database |
| **Prometheus** | `9090` | `http://localhost:9090` | Telemetry Metrics Scraper |
| **Grafana** | `3000` | `http://localhost:3001` | Provisioned Dashboards (`admin`/`admin`) |
| **Node Exporter** | `9100` | `http://localhost:9100` | System Metrics Exporter |
| **Jenkins CI/CD** | `8080` | `http://localhost:8082` | Continuous Delivery Server |

---

## 📋 Prerequisites

Before running the project on a new computer, ensure you have installed:

1. **Git**: [git-scm.com](https://git-scm.com/)
2. **Node.js** (v18+ & npm): [nodejs.org](https://nodejs.org/)
3. **Docker Desktop** or **Docker Engine**: [docker.com](https://www.docker.com/)
4. **kubectl** (Kubernetes CLI): [kubernetes.io](https://kubernetes.io/docs/tasks/tools/)
5. **Kind** or **Minikube** (Optional, for Kubernetes deployment): [kind.sigs.k8s.io](https://kind.sigs.k8s.io/)

---

## 🚀 Option 1: Quick Start with Docker Compose (Recommended)

Run the entire platform (Client, API, Database, Nginx, Prometheus, Grafana, Node Exporter, Jenkins) with a single command:

### 1. Clone the repository
```bash
git clone https://github.com/shivanshks06/cloudops.git
cd cloudops
```

### 2. Start all services
```bash
docker compose up -d --build
```

### 3. Verify running containers
```bash
docker ps
```

### 4. Access the platform
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173) or [http://localhost:8081](http://localhost:8081)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Prometheus Metrics**: [http://localhost:5000/metrics](http://localhost:5000/metrics)
- **Prometheus Scraper**: [http://localhost:9090](http://localhost:9090)
- **Grafana Dashboards**: [http://localhost:3001](http://localhost:3001) *(Login: `admin` / `admin`)*
- **Jenkins CI/CD**: [http://localhost:8082](http://localhost:8082)

---

## 💻 Option 2: Native Local Development (Node.js)

If you wish to modify the code locally with live hot-reloading:

### 1. Start PostgreSQL Database
```bash
docker compose up -d db
```

### 2. Configure & Start Backend API
```bash
cd server
npm install
npm run migrate # Runs database migrations
npm run dev     # Starts Express server on port 5000
```

### 3. Configure & Start Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev     # Starts Vite server on port 5173
```

---

## ☸️ Option 3: Deploy to Kubernetes

Deploy the CloudOps application stack to a local Kubernetes cluster using Kustomize.

### 1. Start your local Kubernetes cluster
Using **Kind**:
```bash
kind create cluster --name cloudops
```
Or using **Minikube**:
```bash
minikube start
```

### 2. Apply all Kubernetes manifests
```bash
kubectl apply -k k8s/
```

### 3. Verify deployment status
```bash
kubectl get all -n cloudops
```

### 4. Access the application in Kubernetes
Port-forward the client service:
```bash
kubectl port-forward svc/cloudops-client-service 5173:80 -n cloudops
```
Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🔄 Jenkins CI/CD Pipeline Setup

The project includes a production-grade declarative `Jenkinsfile` that automates testing, building Docker images with dynamic build numbers, pushing to Docker Hub, updating Kubernetes deployments, and executing rollbacks on failure.

### 1. Access Jenkins
Open [http://localhost:8082](http://localhost:8082) in your browser.

### 2. Configure Credentials in Jenkins (Optional)
Go to **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials**:
- **Docker Hub Credentials**:
  - **Kind**: `Username with password`
  - **ID**: `dockerhub-creds`
  - **Username/Password**: Your Docker Hub credentials.
- **Kubernetes Config**:
  - **Kind**: `Secret file`
  - **ID**: `kubeconfig`
  - **File**: Upload your cluster's `kubeconfig` file.

### 3. Pipeline Stages
1. **Checkout**: Pulls latest repository code.
2. **Verify Tools**: Validates Git, Node, Docker, and Docker Compose versions.
3. **Dependencies & React Build**: Installs node modules and builds frontend assets.
4. **Backend Verification**: Syntax and structural checks.
5. **Docker Build & Push**: Builds tagged images (`cloudops-api:BUILD_NUMBER` & `cloudops-client:BUILD_NUMBER`) and pushes to Docker Hub.
6. **Deploy Application**: Applies Kubernetes manifests or updates Docker Compose services.
7. **Health Verification**: Runs end-to-end HTTP health checks (`/health`).
8. **Automated Rollback**: Triggers `kubectl rollout undo` if deployment or health verification fails.

---

## 📈 Observability & Grafana Dashboard Provisioning

Grafana is pre-configured with auto-provisioned datasources and dashboards:
- **Datasource Config**: `monitoring/grafana/provisioning/datasources/datasource.yml` (Connects Grafana directly to `http://prometheus:9090`).
- **Dashboard JSON**: `monitoring/grafana/provisioning/dashboards/cloudops-dashboard.json` (Pre-loads dashboard `adj2xlj` featuring Total Services, Active Alerts, Active Incidents, and Service Response Time).
- **Anonymous Embedding**: Enabled (`GF_AUTH_ANONYMOUS_ENABLED=true`, `GF_SECURITY_ALLOW_EMBEDDING=true`) for seamless iframe viewing in the React frontend.

---

## 🔧 Troubleshooting

- **Database Connection Failure**: Ensure the database health check passes. Run `docker compose logs db` to inspect PostgreSQL logs.
- **Jenkins cannot reach Kubernetes**: Ensure `server` URL in `kubeconfig` uses `https://cloudops-control-plane:6443` or `https://host.docker.internal:<port>` depending on your container setup.
- **Port Conflict**: If port `5000`, `5173`, `8081`, `5432`, `9090`, `3001`, or `8082` is already in use on your system, update the host port mappings in `compose.yml`.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).