# Cummins OS Deployment Guide

**Production-ready deployment instructions for Cummins OS on Kubernetes**

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Scaling & Performance](#scaling--performance)
7. [Disaster Recovery](#disaster-recovery)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Docker & Docker Compose (v20+)
- Kubernetes (v1.24+) or AWS EKS
- kubectl (v1.24+)
- Helm (v3.0+)
- AWS CLI (for AWS deployment)
- Terraform (for infrastructure)

### System Requirements

**Development:**
- 8GB RAM minimum
- 20GB disk space
- Modern CPU with virtualization

**Production:**
- 64GB+ RAM
- 500GB+ SSD storage
- Multi-node Kubernetes cluster (3+ nodes)
- Load balancer (AWS ALB/NLB)
- Auto-scaling groups

---

## Local Development

### 1. Clone Repository

```bash
git clone https://github.com/ChaitanyaJoshi1769/Cummins-OS.git
cd Cummins-OS
```

### 2. Install Dependencies

```bash
npm install
npm run bootstrap
```

### 3. Start Infrastructure

```bash
npm run docker:up
```

This starts all 14 services:
- PostgreSQL (5432)
- TimescaleDB (5432)
- Redis (6379)
- Kafka (9092)
- Zookeeper (2181)
- Elasticsearch (9200)
- MQTT (1883)
- Prometheus (9090)
- Grafana (3000)
- Jaeger (6831/UDP, 16686)
- OpenTelemetry Collector (4317)

### 4. Run Services

```bash
# Terminal 1: API
npm run dev --workspace=@cummins-os/api

# Terminal 2: Frontend
npm run dev --workspace=@cummins-os/web

# Terminal 3: ML Service
cd services/ml-service
python -m uvicorn main:app --reload
```

### 5. Access Services

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Grafana:** http://localhost:3100 (admin/admin)
- **Prometheus:** http://localhost:9090
- **Jaeger:** http://localhost:16686

### 6. Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

---

## Kubernetes Deployment

### 1. Create Kubernetes Secrets

```bash
# Create namespace
kubectl create namespace cummins-os

# Create PostgreSQL secret
kubectl create secret generic postgres-secret \
  --from-literal=password=$(openssl rand -base64 32) \
  -n cummins-os

# Create Redis secret
kubectl create secret generic redis-secret \
  --from-literal=password=$(openssl rand -base64 32) \
  -n cummins-os

# Create API secret
kubectl create secret generic api-secret \
  --from-literal=jwt-secret=$(openssl rand -base64 64) \
  -n cummins-os
```

### 2. Build and Push Docker Images

```bash
# Build images
docker build -t cummins-os-api:latest apps/api/
docker build -t cummins-os-web:latest apps/web/
docker build -t cummins-os-ml-service:latest services/ml-service/

# Push to registry (e.g., AWS ECR)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

docker tag cummins-os-api:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/cummins-os-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/cummins-os-api:latest

# Repeat for web and ml-service
```

### 3. Update Image References

Edit `infrastructure/k8s/deployment.yaml`:

```yaml
image: <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/cummins-os-api:latest
```

### 4. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f infrastructure/k8s/deployment.yaml

# Verify deployment
kubectl get all -n cummins-os
kubectl logs -f deployment/api -n cummins-os

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=api -n cummins-os --timeout=300s
```

### 5. Setup Ingress

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Install cert-manager for TLS
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# Apply ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@cummins-os.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Apply ingress
kubectl apply -f infrastructure/k8s/deployment.yaml
```

---

## AWS Deployment

### 1. Create EKS Cluster

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

### 2. Configure kubectl

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name cummins-os-prod

kubectl get nodes
```

### 3. Create RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier cummins-os-prod \
  --db-instance-class db.r6i.2xlarge \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --allocated-storage 500 \
  --storage-type gp3 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx
```

### 4. Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id cummins-os-redis \
  --cache-node-type cache.r6g.xlarge \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 3 \
  --automatic-failover-enabled \
  --multi-az
```

### 5. Create MSK Kafka Cluster

```bash
aws kafka create-cluster \
  --cluster-name cummins-os-kafka \
  --broker-node-group-info \
    InstanceType=kafka.m5.2xlarge,\
    ClientSubnets=subnet-xxxxx,\
    StorageInfo='{EBSStorageInfo={VolumeSize=500}}' \
  --kafka-version 3.4.0 \
  --number-of-broker-nodes 3
```

### 6. Deploy to EKS

```bash
kubectl apply -f infrastructure/k8s/deployment.yaml

# Update environment variables for AWS resources
kubectl set env deployment/api \
  DATABASE_HOST=cummins-os-prod.xxxxx.us-east-1.rds.amazonaws.com \
  REDIS_HOST=cummins-os-redis.xxxxx.ng.0001.use1.cache.amazonaws.com \
  KAFKA_BROKERS=b-1.cummins-os-kafka.xxxxx.kafka.us-east-1.amazonaws.com:9092 \
  -n cummins-os
```

---

## Monitoring & Alerting

### 1. Deploy Prometheus

```bash
kubectl apply -f infrastructure/monitoring/prometheus.yaml

# Port forward for access
kubectl port-forward svc/prometheus 9090:9090 -n cummins-os
```

### 2. Deploy Grafana

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
  --namespace cummins-os \
  --set adminPassword=<PASSWORD>

# Import dashboard
kubectl cp infrastructure/monitoring/grafana-dashboard.json \
  cummins-os/grafana-xxxxx:/var/lib/grafana/dashboards/
```

### 3. Configure Alert Manager

```bash
kubectl apply -f infrastructure/monitoring/alerts.yaml

# Configure notification channels (Slack, PagerDuty, etc.)
kubectl patch configmap alertmanager-config -n cummins-os \
  --patch='{"data":{"alertmanager.yml":"..."}}'
```

### 4. Distributed Tracing (Jaeger)

```bash
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install jaeger jaegertracing/jaeger \
  --namespace cummins-os \
  --set elasticsearch.enabled=true

# Access Jaeger UI
kubectl port-forward svc/jaeger-query 16686:16686 -n cummins-os
```

---

## Scaling & Performance

### 1. Horizontal Pod Autoscaling

Already configured in `deployment.yaml`:

```yaml
HorizontalPodAutoscaler:
  minReplicas: 3
  maxReplicas: 10
  targetCPU: 70%
  targetMemory: 80%
```

### 2. Vertical Pod Autoscaling (optional)

```bash
kubectl apply -f - <<EOF
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
  namespace: cummins-os
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: api
  updatePolicy:
    updateMode: "Auto"
EOF
```

### 3. Network Policies

```bash
kubectl apply -f infrastructure/k8s/network-policies.yaml
```

### 4. Resource Quotas

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: cummins-os-quota
  namespace: cummins-os
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "256Gi"
    limits.cpu: "200"
    limits.memory: "512Gi"
    pods: "200"
EOF
```

---

## Disaster Recovery

### 1. Database Backup Strategy

```bash
# Automated daily backups
aws rds modify-db-instance \
  --db-instance-identifier cummins-os-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"

# Cross-region replication
aws rds create-db-instance-read-replica \
  --db-instance-identifier cummins-os-prod-replica \
  --source-db-instance-identifier cummins-os-prod \
  --region us-west-2
```

### 2. Snapshot Strategy

```bash
# Daily application snapshots
# Configured via EBS snapshot lifecycle policies
```

### 3. RTO/RPO Targets

- **RTO (Recovery Time Objective):** 5 minutes
- **RPO (Recovery Point Objective):** 1 minute

### 4. Failover Testing

```bash
# Test database failover
aws rds failover-db-cluster \
  --db-cluster-identifier cummins-os-prod

# Verify recovery
kubectl logs -f deployment/api -n cummins-os
```

---

## Troubleshooting

### Check Service Status

```bash
# View all resources
kubectl get all -n cummins-os

# Check pod status
kubectl describe pod <pod-name> -n cummins-os

# View logs
kubectl logs <pod-name> -n cummins-os
kubectl logs -f <pod-name> -n cummins-os

# Execute commands in pod
kubectl exec -it <pod-name> -n cummins-os -- bash
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:16 \
  --restart=Never -- psql -h postgres -U postgres

# Check database status
kubectl exec -it postgres-xxxxx -n cummins-os -- \
  psql -U postgres -c "SELECT version();"
```

### API Service Issues

```bash
# Check metrics
kubectl top pod -n cummins-os
kubectl top nodes

# View resource requests/limits
kubectl describe deployment api -n cummins-os

# Check recent events
kubectl get events -n cummins-os --sort-by='.lastTimestamp'
```

### Memory Leaks

```bash
# Monitor memory usage
kubectl exec -it <pod-name> -n cummins-os -- \
  top -b -n 1 | head -20

# Collect heap dumps
kubectl exec <pod-name> -n cummins-os -- \
  jmap -heap <pid>
```

### Network Issues

```bash
# Test network connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot \
  --restart=Never -- bash

# Inside debug container:
nslookup api.cummins-os.svc.cluster.local
ping api.cummins-os.svc.cluster.local
```

### Kafka Consumer Lag

```bash
# Check consumer groups
kafka-consumer-groups.sh --bootstrap-server kafka:9092 \
  --list

# Describe consumer group
kafka-consumer-groups.sh --bootstrap-server kafka:9092 \
  --describe --group cummins-os-telemetry
```

---

## Performance Tuning

### Database

```sql
-- Create indexes for common queries
CREATE INDEX idx_vehicle_health_score 
  ON vehicles(fleet_id, health_score);

CREATE INDEX idx_telemetry_timestamp 
  ON telemetry(vehicle_id, timestamp DESC);

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Redis

```
# Update redis.conf for optimal performance
maxmemory 16gb
maxmemory-policy allkeys-lru
appendfsync everysec
```

### API

```typescript
// Enable caching in NestJS
app.useGlobalInterceptors(new CacheInterceptor());

// Connection pooling
const pool = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Support

**Issues:** https://github.com/ChaitanyaJoshi1769/Cummins-OS/issues  
**Documentation:** https://github.com/ChaitanyaJoshi1769/Cummins-OS/wiki

**Production Status:** Ready for enterprise deployment ✅
