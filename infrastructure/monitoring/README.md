# Cummins OS Production Monitoring

**Comprehensive observability stack for enterprise fleet operations**

## Overview

The monitoring stack combines:
- **Prometheus** - Metrics collection & alerting
- **Grafana** - Visualization dashboards
- **Jaeger** - Distributed tracing
- **Loki** - Log aggregation
- **AlertManager** - Alert routing & notification

## Components

### Prometheus

Collects metrics from all services with 15-second scrape intervals.

**Key metrics scraped:**
- API HTTP requests/latency/errors
- Database connections/queries/performance
- Redis memory/operations
- Kafka consumer lag/producer errors
- ML service prediction latency
- Node CPU/memory/disk/network
- Kubernetes pod/node metrics

**Configuration:** `prometheus.yaml`

### Grafana Dashboards

Pre-built dashboards for:
- **API Performance** - Request rate, latency, error rate
- **Database Health** - Connections, slow queries, disk usage
- **Cache Performance** - Redis memory, hit rate, operations
- **Messaging** - Kafka lag, producer/consumer performance
- **ML Service** - Prediction latency, model accuracy
- **Infrastructure** - Node CPU, memory, disk, network
- **Kubernetes** - Pod status, resource usage, restarts

**Dashboard:** `grafana-dashboard.json`

### Alert Rules

Production-grade alerts for:
- **API** - High error rate, high latency, service down
- **Database** - Connection exhaustion, slow queries, disk space
- **Cache** - High memory usage, service down
- **Messaging** - Consumer lag, producer errors
- **ML** - High latency, service down
- **Telemetry** - Processing backlog, packet drops
- **Infrastructure** - High CPU, high memory, low disk space
- **Kubernetes** - Pod crash loops, node not ready

**Configuration:** `alerts.yaml`

### Notification Channels

Configure AlertManager to route alerts to:
- Email
- Slack
- PagerDuty
- Opsgenie
- Webhook endpoints

## Setup Instructions

### 1. Local Development

```bash
# Start monitoring stack with docker-compose
npm run docker:up

# Access services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3100 (admin/admin)
# Jaeger: http://localhost:16686
```

### 2. Kubernetes Deployment

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Deploy Prometheus
kubectl apply -f prometheus.yaml

# Deploy Grafana
helm install grafana grafana/grafana \
  --namespace monitoring \
  --values grafana-values.yaml

# Deploy Jaeger
helm install jaeger jaegertracing/jaeger \
  --namespace monitoring

# Deploy AlertManager
kubectl apply -f alertmanager.yaml
```

### 3. Configure Alerting

Edit `alertmanager.yaml`:

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

receivers:
  - name: 'default'
    slack_configs:
      - api_url: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
        channel: '#cummins-os-alerts'
        send_resolved: true

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: YOUR_PAGERDUTY_KEY
        description: '{{ .GroupLabels.alertname }}'
```

### 4. Import Dashboards

```bash
# Access Grafana
# http://localhost:3100

# Import dashboard:
# + > Import > Paste grafana-dashboard.json content

# Or via API:
curl -X POST http://admin:admin@localhost:3100/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @grafana-dashboard.json
```

## Key Metrics

### API Service

```promql
# Request rate
rate(http_requests_total{service="api"}[5m])

# Error rate
sum(rate(http_requests_total{service="api",status=~"5.."}[5m])) /
sum(rate(http_requests_total{service="api"}[5m]))

# p95 Latency
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket{service="api"}[5m]))
```

### Database

```promql
# Active connections
pg_stat_activity_count{state="active"}

# Slow queries
rate(pg_slow_queries_total[5m])

# Cache hit ratio
(sum(rate(pg_stat_io_heap_blks_hit[5m])) /
 (sum(rate(pg_stat_io_heap_blks_hit[5m])) +
  sum(rate(pg_stat_io_heap_blks_read[5m]))) * 100)
```

### Telemetry Pipeline

```promql
# Ingestion rate (events/sec)
rate(telemetry_ingestion_total[5m])

# Processing latency
histogram_quantile(0.95,
  rate(telemetry_processing_duration_seconds_bucket[5m]))

# Kafka consumer lag
kafka_consumer_lag_sum{topic="cummins.telemetry.raw"}
```

### ML Service

```promql
# Prediction latency
histogram_quantile(0.95,
  rate(ml_prediction_duration_seconds_bucket[5m]))

# Model accuracy
ml_model_accuracy{model_version="v1.0"}

# Prediction volume
rate(ml_predictions_total[5m])
```

## Alert Severity Levels

| Severity | Response Time | Impact |
|----------|:-------------:|--------|
| Critical | Immediate (<5min) | Service down, data loss risk |
| Warning | Within 30min | Performance degradation, errors |
| Info | Next business day | Low impact, informational |

## SLOs & SLIs

### Availability

- **Target:** 99.9% uptime
- **Error Budget:** 43.2 minutes/month
- **SLI:** (successful requests / total requests) * 100

### Latency

- **Target:** p95 < 100ms
- **SLI:** (requests with latency < 100ms / total requests) * 100

### Throughput

- **Target:** 1M+ events/sec
- **SLI:** telemetry_ingestion_rate

## Troubleshooting

### No Metrics in Prometheus

1. Check Prometheus targets: http://localhost:9090/targets
2. Verify service is exposing `/metrics` endpoint
3. Check network connectivity between Prometheus and services

### Alerts Not Firing

1. Verify alert rules syntax: `promtool check rules alerts.yaml`
2. Check AlertManager config: `promtool check config alertmanager.yaml`
3. View AlertManager UI: http://localhost:9093

### High Prometheus Memory Usage

```yaml
# Reduce retention in prometheus.yaml
command: ["--storage.tsdb.retention.time=7d"]
```

### Missing Traces in Jaeger

1. Verify OpenTelemetry SDK integration
2. Check Jaeger collector logs
3. Verify sample rate is > 0

## Best Practices

1. **Alert Fatigue** - Set appropriate thresholds to avoid false positives
2. **Alert Routing** - Route alerts by severity and service
3. **Runbooks** - Link alerts to runbooks for on-call engineers
4. **Dashboards** - Keep dashboards focused on actionable insights
5. **Testing** - Regularly test alert rules and notification channels

## Capacity Planning

### Storage

- **Prometheus:** ~15GB/month at 500K series
- **Jaeger:** ~5GB/month at 1M spans/day
- **Loki:** ~2GB/month at 100K events/sec

### Compute

- **Prometheus:** 1 CPU, 2GB RAM (single instance)
- **Grafana:** 500m CPU, 1GB RAM
- **Jaeger:** 2 CPU, 4GB RAM
- **AlertManager:** 250m CPU, 512MB RAM

## Resources

- **Prometheus Docs:** https://prometheus.io/docs/
- **Grafana Docs:** https://grafana.com/docs/
- **Jaeger Docs:** https://www.jaegertracing.io/docs/
- **PromQL Guide:** https://prometheus.io/docs/prometheus/latest/querying/basics/

---

**Production Monitoring Ready** ✅
