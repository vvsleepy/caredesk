# CareDesk — Clinic Appointment Booking Dashboard ⋆˚꩜｡

> Customized frontend for Ankita Tripathi. See [START-HERE.md](START-HERE.md) for VS Code setup. Original deployment evidence and grading claims below are retained reference material, not verification of this customized copy.

[![CareDesk CI/CD](https://github.com/vvsleepy/caredesk/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/vvsleepy/caredesk/actions/workflows/ci-cd.yml)

CareDesk is a SaaS-style clinic appointment dashboard used as a DevOps capstone: a **React + Vite** frontend, a **FastAPI** backend, **PostgreSQL**, and a complete path to production — Docker, GitHub Actions + Trivy + GHCR, Terraform (VPC + EKS), Helm, ingress-nginx, HPA, and Prometheus + Grafana.

- **Author**: Ankita Tripathi (Student ID: 24bcs10062)  
- **Email**: ankita.24bcs10062@sst.scaler.com
- **Repository**: [https://github.com/vvsleepy/caredesk](https://github.com/vvsleepy/caredesk)
- **Verified Pipeline Run**: [GitHub Actions Run](https://github.com/vvsleepy/caredesk/actions/runs/39012046511)
- **Recorded Walkthrough Video**: [Watch on Loom](/DEMO%20caredesk.mov)
- **Grading Verification Checklist**: [SUBMISSION.md](SUBMISSION.md)

## Architecture

```text
                    +---------------- GitHub Actions ----------------+
                    | test -> build -> Trivy scan -> push to GHCR    |
                    +----------- SHA-tagged images ------------------+
                                     |      |
 Developer -> Docker Compose (local) |      | Helm upgrade --install (EKS)
                                     v      v
                          +-------------------------+
                          |  ingress-nginx          |
                          |  caredesk.local          |
                          +---+-------------+-------+
                              | /           | /api
                              v             v
                        +-----------+  +-----------+
                        | frontend  |  | backend   |---+
                        | nginx:8080|  | FastAPI   |   |
                        +-----------+  +-----+-----+   |
                                             |         v
                                        +----+----+ +----------+
                                        | Postgres| | /metrics |
                                        | PVC     | | Prom+Graf|
                                        +---------+ +----------+
```

### Application Dashboard Preview

![CareDesk Application Dashboard](images/m1-app-dashboard.png)

## Tech Stack

| Layer | Choice | Description |
|---|---|---|
| **Frontend** | React 18 + Vite 6 | Responsive clinic appointment SPA with plain CSS theme |
| **Backend** | FastAPI 0.140 + SQLAlchemy 2.0 | Async Python API, Alembic DB migrations, Pydantic v2 |
| **Database** | PostgreSQL 16 | Relational store with `appointments` table and seed data |
| **Testing** | pytest 8.3 + httpx | 12 automated test cases on an isolated temp SQLite DB |
| **Containers** | Multi-stage Dockerfiles | Non-root users (`USER 10001` backend, `USER 101` nginx frontend) |
| **CI/CD** | GitHub Actions | Test $\to$ Docker build $\to$ Trivy scan $\to$ Push SHA tags to GHCR |
| **Security** | Aqua Security Trivy | Container image vulnerability scan gating on HIGH and CRITICAL |
| **IaC** | Terraform | AWS VPC (2 public + 2 private subnets, NAT) + EKS 1.34 cluster |
| **Orchestration** | Kubernetes + Helm 3 | Custom Helm chart managing Deployments, Services, Ingress, HPA |
| **Observability** | Prometheus + Grafana | `kube-prometheus-stack`, `/metrics` ServiceMonitor, custom dashboard |

## 1. Local Development & Testing

### Running Tests (Pytest)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```

![Pytest Test Suite Output](images/m2-pytest.png)

### Running Full Local Stack (Docker Compose)

```bash
# Starts Postgres (:5432), FastAPI Backend (:8000), and React Frontend (:3000)
docker compose up --build
```

![Docker Compose Build & Running Containers](images/m4-docker-compose-build.png)

![Docker Compose Services Status](images/m4-docker-compose.png)

Access the running application in your browser:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: `curl http://localhost:8000/health`
- **Readiness Check**: `curl http://localhost:8000/ready`

![Application Loaded at localhost:3000](images/m4-localhost-browser.png)

## 2. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Service root and version info |
| `GET` | `/health` | Cheap liveness probe (no DB query) |
| `GET` | `/ready` | Database connectivity readiness probe (returns 503 if down) |
| `GET` | `/metrics` | Prometheus exposition endpoint |
| `GET` | `/api/appointments?status=` | List all appointments or filter by status (`scheduled`, `completed`, `cancelled`) |
| `GET` | `/api/appointments/stats` | Summary statistics (total, by status, and today's load) |
| `GET` | `/api/appointments/{id}` | Get appointment by ID (404 if missing) |
| `POST` | `/api/appointments` | Create new appointment (201 Created) |
| `PUT` | `/api/appointments/{id}` | Partial update of appointment details / status |
| `DELETE` | `/api/appointments/{id}` | Delete appointment (204 No Content) |

## 3. Git & GitHub

- **Repository**: [https://github.com/vvsleepy/caredesk](https://github.com/vvsleepy/caredesk)
- Granular, descriptive commit history following continuous delivery progression.
- `.gitignore` strictly excludes credentials, secrets, virtual environments (`.venv`), temporary SQLite caches, node modules, and Terraform states.

![Git Commit History](images/m3-git-log.png)

## 4. CI/CD Pipeline (GitHub Actions + GHCR)

Configured in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml), triggering automatically on every push to `main`:

1. **`test` job**: Runs `pytest -v` for Python backend and `npm ci && npm run build` for React frontend.
2. **`build-scan-push` job**: Builds AMD64 Docker images for both services, scans both with Trivy, and pushes SHA-tagged images to GitHub Container Registry (GHCR).
3. **`deploy` job**: Automated Helm upgrade deployment to AWS EKS (gated by repository variable `DEPLOY_ENABLED=true`).
- **Verified Green Pipeline Run**: [GitHub Actions Run](https://github.com/vvsleepy/caredesk/actions/runs/39012046511)

![GitHub Actions Pipeline Run](images/m5-ci-pipeline.png)

### Published Container Images in GHCR

Images are pushed with immutable Git commit SHA tags for complete traceability:

- `ghcr.io/vvsleepy/caredesk-backend:<commit-sha>`
- `ghcr.io/vvsleepy/caredesk-frontend:<commit-sha>`

![GHCR Published Packages Overview](images/m5-ghcr-packages.png)

![GHCR Published Packages with SHA-based Tags](images/m5-ghcr-sha-tags.png)

## 5. DevSecOps: Trivy Container Vulnerability Scan

Trivy scans both container images in the CI pipeline with:

- `severity: HIGH,CRITICAL`
- `exit-code: "1"` (fails pipeline on unmitigated vulnerabilities)
- `ignore-unfixed: true`

Both images pass with **0 blocking HIGH or CRITICAL CVEs** through minimal, hardened base images (`python:3.12-slim-trixie` and `nginx-unprivileged:1.31-alpine`) and pinned dependencies.

![Trivy Security Scan Pipeline Step](images/m6-trivy-scan.png)

![Trivy Security Scan Expanded Clean Output](images/m6-trivy-scan-clean.png)

## 6. Infrastructure as Code (Terraform on AWS)

Terraform modules located in [`terraform/`](terraform/) provision:

- **VPC (`10.30.0.0/16`)**: 2 public subnets and 2 private subnets across availability zones with an internet-facing NAT Gateway.
- **EKS Cluster (`caredesk-eks`)**: AWS EKS 1.34 managed cluster with a managed worker node group.
- **EBS CSI Driver & IRSA**: IAM OIDC role for dynamic Kubernetes Persistent Volume Claims (`gp3`).
- **Security**: Variables configured via [`terraform.tfvars.example`](terraform/terraform.tfvars.example); zero credentials stored in Git.
- **Idempotency**: Clean `terraform plan` execution confirming zero drift (`No changes. Your infrastructure matches the configuration.`).
- **Teardown**: Automated `terraform destroy` cleanly decommissioning all 59 AWS cloud resources with 0 orphan load balancers.

### AWS Console Verification: EKS & VPC

![AWS EKS Console Cluster](images/m7-aws-eks.png)

![AWS VPC and Subnets Console](images/m7-aws-vpc.png)

### Terraform Plan Idempotency & Teardown Verification

The initial plan showed **59 resources to add**, followed by a later no-drift plan after apply.

![Terraform Initial Plan — 59 resources to add](images/m7-terraform-plan-create.png)

![Terraform Plan Idempotent Verification](images/m7-terraform-plan.png)

![Terraform Destroy Complete and ELB Verification](images/m7-terraform-destroy.png)

## 7. Kubernetes & Helm Deployment

The application is packaged as a Helm chart in [`helm/caredesk/`](helm/caredesk/):

- **Deployments**: 2 replicas each for frontend and backend with non-root security contexts.
- **Services**: `ClusterIP` exposing frontend (:8080) and backend (:8000).
- **Ingress**: AWS Network Load Balancer Ingress routing `/` to the React frontend and `/api` to FastAPI.
- **Autoscaling**: Horizontal Pod Autoscaler (HPA) scaling backend from 2 to 4 pods based on CPU utilization.

Before installing the chart, create the database credential Secret in the target namespace. Keep the password out of chart values and Git:

```bash
kubectl create namespace caredesk --dry-run=client -o yaml | kubectl apply -f -
read -s -p 'PostgreSQL password (letters/numbers only): ' POSTGRES_PASSWORD; echo
kubectl create secret generic caredesk-postgres-credentials -n caredesk \
  --from-literal=username=caredesk \
  --from-literal=password="$POSTGRES_PASSWORD" \
  --from-literal=database_url="postgresql+psycopg://caredesk:${POSTGRES_PASSWORD}@caredesk-caredesk-postgres:5432/caredesk"
unset POSTGRES_PASSWORD
```

The same Secret is used by PostgreSQL and the backend. The CI deploy job expects it to exist in the cluster before Helm runs.

```bash
# Verify running pods, services and ingress
kubectl get pods,svc,ingress -n caredesk
helm list -n caredesk
```

![Kubernetes Pods, Services, and Helm Release](images/m8-k8s-pods.png)

### Live Application via AWS Load Balancer

The application is publicly reachable via the provisioned AWS Load Balancer URL:

![Live Application via AWS Load Balancer DNS](images/m8-aws-ingress.png)

## 8. Observability (Prometheus + Grafana)

- **Metrics Exposition**: FastAPI backend exports Prometheus-formatted telemetry on `/metrics` via `prometheus-fastapi-instrumentator`.
- **Prometheus Scrape**: `kube-prometheus-stack` scrapes `/metrics` every 15s via a Kubernetes `ServiceMonitor`. Targets report status **`UP (2/2)`**.
- **Grafana Dashboard**: Custom `CareDesk Backend` dashboard tracking Request Rate (req/s), p95 latency, 5xx error rate, and container CPU utilization under load.

### Prometheus `/metrics` Terminal Output

```bash
curl -i http://localhost:8000/metrics | head -n 30
```

![Prometheus Metrics Endpoint Output](images/m9-curl-metrics.png)

### Prometheus Targets (UP)

![Prometheus Targets UP](images/m9-prometheus-targets.png)

### Live Grafana Dashboard

![Grafana Live Dashboard](images/m9-grafana-dashboard.png)

The Grafana chart reads its administrator credentials from the pre-created `caredesk-grafana-admin` Secret (`admin-user` and `admin-password` keys). Create this Secret in the monitoring namespace before installing `kube-prometheus-stack`; credentials are not stored in this repository.

```bash
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
read -s -p 'Grafana admin password: ' GRAFANA_ADMIN_PASSWORD; echo
kubectl create secret generic caredesk-grafana-admin -n monitoring \
  --from-literal=admin-user=admin \
  --from-literal=admin-password="$GRAFANA_ADMIN_PASSWORD"
unset GRAFANA_ADMIN_PASSWORD
```

## 9. Final Presentation & Walkthrough Demo

- **Recorded Walkthrough Video**: [Demo-video](/DEMO%20caredesk.mov) (Full demonstration of App $\to$ Git Commit $\to$ CI/CD Pipeline $\to$ Trivy Scan $\to$ GHCR $\to$ Kubernetes Deployment $\to$ Prometheus/Grafana)
- **Slide Deck**: [`CareDesk DevOps Capstone.pptx`](CareDesk%20DevOps%20Capstone.pptx) (available in repository root)
- **Detailed Rubric Checklist**: See [SUBMISSION.md](SUBMISSION.md) for 1-to-1 grading verification across all 10 modules.

## Project Demo ⋆˚࿔

Watch the CareDesk project walkthrough:

[Watch or download the demo](./DEMO%20caredesk.mov)
⋆˚࿔
