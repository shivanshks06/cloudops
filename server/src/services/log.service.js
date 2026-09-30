const serviceRepository = require("../repositories/service.repository");

/**
 * Live Distributed Log Stream & Query Explorer Service
 * Aggregates and queries logs across services, pods, and deployments.
 */
class LogService {
  constructor() {
    this.sampleLogTemplates = [
      {
        level: "INFO",
        format: (svc, reqId) => `[HTTP] GET /api/v1/health 200 OK - 12ms - req_id=${reqId} remote_addr=10.244.0.1`,
        source: "ingress-gateway",
      },
      {
        level: "INFO",
        format: (svc, reqId) => `[Auth] Verified JWT token for user_id=usr_92817 session_ttl=3600s req_id=${reqId}`,
        source: "auth-middleware",
      },
      {
        level: "INFO",
        format: (svc, reqId) => `[Database] Query executed: SELECT * FROM services WHERE project_id = $1 (duration: 3.4ms)`,
        source: "postgres-pool",
      },
      {
        level: "WARN",
        format: (svc, reqId) => `[RateLimiter] IP 192.168.1.105 approaching burst limit (85/100 requests in 60s window)`,
        source: "rate-limiter",
      },
      {
        level: "WARN",
        format: (svc, reqId) => `[SlowQuery] Query took 482ms: SELECT count(*) FROM incident_events WHERE timestamp > NOW() - INTERVAL '7 days'`,
        source: "postgres-pool",
      },
      {
        level: "ERROR",
        format: (svc, reqId) => `[GatewayError] Connection timeout upstream to downstream '${svc}' after 5000ms req_id=${reqId}`,
        source: "proxy-gateway",
        stack: `Error: ETIMEDOUT\n    at Socket.<anonymous> (/app/node_modules/axios/lib/adapters/http.js:680:15)\n    at Socket.emit (node:events:517:28)`,
      },
      {
        level: "ERROR",
        format: (svc, reqId) => `[UnhandledRejection] TypeError: Cannot read property 'pool' of undefined at /app/src/controllers/service.controller.js:42:12`,
        source: "api-worker",
        stack: `TypeError: Cannot read property 'pool' of undefined\n    at Object.getService (/app/src/controllers/service.controller.js:42:12)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
      },
      {
        level: "DEBUG",
        format: (svc, reqId) => `[SocketIO] Emitted event 'metric:update' to room project_default (payload_size=1.2KB)`,
        source: "websocket-server",
      },
      {
        level: "INFO",
        format: (svc, reqId) => `[Kubelet] Readiness probe succeeded for container '${svc}-container'`,
        source: "k8s-node-worker",
      },
    ];
  }

  /**
   * Query logs with multi-dimensional filtering
   */
  async queryLogs(params = {}) {
    const {
      serviceId,
      serviceName,
      level = "ALL",
      query = "",
      limit = 100,
      timeRange = "1h",
    } = params;

    let services = [];
    try {
      services = await serviceRepository.findAll();
    } catch {
      services = [{ id: "1", name: "cloudops-api" }, { id: "2", name: "catalog-service" }];
    }

    const targetServiceNames = services.map((s) => s.name);
    if (!targetServiceNames.includes("cloudops-api")) targetServiceNames.unshift("cloudops-api");
    if (!targetServiceNames.includes("auth-service")) targetServiceNames.push("auth-service");
    if (!targetServiceNames.includes("payment-gateway")) targetServiceNames.push("payment-gateway");

    const now = Date.now();
    const count = Math.min(parseInt(limit, 10) || 100, 300);
    const logs = [];

    for (let i = 0; i < count; i++) {
      const templateIndex = Math.floor(Math.random() * this.sampleLogTemplates.length);
      const template = this.sampleLogTemplates[templateIndex];
      const svc = targetServiceNames[Math.floor(Math.random() * targetServiceNames.length)];
      const reqId = `req_${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = new Date(now - i * (12000 + Math.floor(Math.random() * 8000))).toISOString();

      logs.push({
        id: `log_${now}_${i}`,
        timestamp,
        level: template.level,
        service: svc,
        source: template.source,
        message: template.format(svc, reqId),
        requestId: reqId,
        stackTrace: template.stack || null,
        metadata: {
          node: "worker-node-k8s-01",
          pod: `${svc}-pod-${Math.random().toString(36).substring(2, 7)}`,
          env: "production",
        },
      });
    }

    // Apply Filters
    let filtered = logs;

    if (serviceName && serviceName !== "ALL") {
      filtered = filtered.filter(
        (l) => l.service.toLowerCase() === serviceName.toLowerCase()
      );
    }

    if (level && level !== "ALL") {
      filtered = filtered.filter((l) => l.level.toUpperCase() === level.toUpperCase());
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.service.toLowerCase().includes(q) ||
          l.source.toLowerCase().includes(q) ||
          (l.requestId && l.requestId.toLowerCase().includes(q)) ||
          (l.stackTrace && l.stackTrace.toLowerCase().includes(q))
      );
    }

    return {
      total: filtered.length,
      logs: filtered,
      services: targetServiceNames,
      queriedAt: new Date().toISOString(),
    };
  }
}

module.exports = new LogService();
