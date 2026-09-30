const axios = require("axios");
const serviceRepository = require("../repositories/service.repository");
const incidentRepository = require("../repositories/incident.repository");
const incidentEventRepository = require("../repositories/incidentEvent.repository");
const alertRepository = require("../repositories/alert.repository");
const alertRuleRepository = require("../repositories/alertRule.repository");
const projectRepository = require("../repositories/project.repository");
const metricRepository = require("../repositories/metric.repository");
const {
  healthChecksTotal,
  activeAlerts,
  activeIncidents,
  totalServices,
  responseTimeHistogram,
  serviceStatus,
} = require("../config/customMetrics");

const socketService = require("../services/socket.service");
const logger = require("../config/logger");

const failureCounts = new Map();
const lastAlertTimes = new Map();
const COOLDOWN = 5 * 60 * 1000;

async function sendWebhookNotification(project, title, message, severity = "warning") {
  if (!project) return;

  // 1. Slack Webhook Notification
  if (project.slack_webhook_url) {
    try {
      const color = severity === "critical" ? "#EF4444" : severity === "warning" ? "#F59E0B" : "#10B981";
      const payload = {
        attachments: [
          {
            color,
            title: `[CloudOps] ${title}`,
            text: message,
            fields: [
              { title: "Project", value: project.name, short: true },
              { title: "Severity", value: severity.toUpperCase(), short: true },
              { title: "Timestamp", value: new Date().toISOString(), short: false },
            ],
            footer: "CloudOps Multi-Tenant Real-Time Engine",
          },
        ],
      };
      await axios.post(project.slack_webhook_url, payload, { timeout: 4000 });
      logger.info({ projectId: project.id }, "Slack notification delivered");
    } catch (err) {
      logger.warn({ err: err.message }, "Slack webhook delivery failed");
    }
  }

  // 2. Discord Webhook Notification
  if (project.discord_webhook_url) {
    try {
      const embedColor = severity === "critical" ? 15548997 : severity === "warning" ? 16103704 : 1099684;
      const payload = {
        embeds: [
          {
            title: `🚨 ${title}`,
            description: message,
            color: embedColor,
            fields: [
              { name: "Project", value: project.name, inline: true },
              { name: "Severity", value: severity.toUpperCase(), inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };
      await axios.post(project.discord_webhook_url, payload, { timeout: 4000 });
      logger.info({ projectId: project.id }, "Discord notification delivered");
    } catch (err) {
      logger.warn({ err: err.message }, "Discord webhook delivery failed");
    }
  }
}

async function triggerAlert(service, title, severity, project = null) {
  const lastTime = lastAlertTimes.get(`${service.id}-${severity}`) || 0;
  const lastAlertWithinCooldown = Date.now() - lastTime < COOLDOWN;

  if (lastAlertWithinCooldown) {
    return;
  }

  const alert = await alertRepository.createAlert(service.id, title, severity);
  lastAlertTimes.set(`${service.id}-${severity}`, Date.now());
  console.log(`[ALERT] ${severity.toUpperCase()}: ${title}`);

  socketService.emitAlertFiring({
    id: alert?.id,
    service_id: service.id,
    service_name: service.name,
    project_id: service.project_id,
    title,
    severity,
    alertname: title,
    created_at: new Date().toISOString(),
  });

  if (project) {
    await sendWebhookNotification(project, `${severity.toUpperCase()}: ${title}`, `Monitor target '${service.name}' triggered alert. Endpoint: ${service.endpoint_url}`, severity);
  }
}

async function checkServicesHealth() {
  healthChecksTotal.inc();
  const services = await serviceRepository.findAll();
  totalServices.set(services.length);

  for (const service of services) {
    let project = null;
    if (service.project_id) {
      try {
        project = await projectRepository.findById(service.project_id);
      } catch {}
    }

    try {
      const start = Date.now();
      const targetUrl = service.endpoint_url
        ? service.endpoint_url.replace("http://cloudops-api:5000", "http://localhost:5000/health")
        : `http://localhost:5000/health`;

      const method = (service.http_method || "GET").toLowerCase();
      const timeout = service.timeout_ms || 5000;
      const expectedStatus = service.expected_status_code || 200;

      let headers = { "User-Agent": "CloudOps-Synthetic-Monitor/2.0" };
      if (service.custom_headers) {
        try {
          const parsed = typeof service.custom_headers === "string" ? JSON.parse(service.custom_headers) : service.custom_headers;
          headers = { ...headers, ...parsed };
        } catch {}
      }

      let reqData = null;
      if (service.request_body && (method === "post" || method === "put" || method === "patch")) {
        try {
          reqData = typeof service.request_body === "string" ? JSON.parse(service.request_body) : service.request_body;
        } catch {
          reqData = service.request_body;
        }
      }

      const response = await axios({
        method,
        url: targetUrl,
        timeout,
        headers,
        data: reqData,
        validateStatus: () => true, // Don't throw for 4xx/5xx so we can evaluate expected status
      });

      const responseTime = Date.now() - start;
      const isStatusOk = response.status === expectedStatus;

      let status = isStatusOk ? (responseTime > 1500 ? "warning" : "healthy") : "critical";

      // Evaluate User-Configured Alert Rules
      const customRules = await alertRuleRepository.findByServiceId(service.id);
      for (const rule of customRules) {
        if (rule.metric_type === "latency" && rule.operator === ">" && responseTime > parseFloat(rule.threshold_value)) {
          await triggerAlert(service, `${service.name} latency (${responseTime}ms) exceeded rule threshold (${rule.threshold_value}ms)`, rule.severity, project);
        } else if (rule.metric_type === "status_code" && response.status !== parseInt(rule.threshold_value, 10)) {
          await triggerAlert(service, `${service.name} status code ${response.status} violated rule threshold ${rule.threshold_value}`, rule.severity, project);
        }
      }

      if (!isStatusOk) {
        await triggerAlert(service, `${service.name} returned HTTP ${response.status} (expected ${expectedStatus})`, "critical", project);
      } else if (responseTime > 1500) {
        await triggerAlert(service, `${service.name} high latency (${responseTime}ms > 1500ms)`, "warning", project);
      }

      // Record check result & update rolling uptime percentage
      await serviceRepository.recordCheckResult(service.id, {
        isHealthy: isStatusOk,
        responseTime,
      });

      await metricRepository.createMetric(
        service.id,
        responseTime,
        status
      );

      responseTimeHistogram.observe(responseTime);
      serviceStatus.set({ service: service.name }, status === "healthy" ? 1 : (status === "warning" ? 0.5 : 0));

      if (service.status !== status) {
        socketService.emitServiceStatus({
          id: service.id,
          project_id: service.project_id,
          name: service.name,
          status,
          response_time: responseTime,
          endpoint_url: service.endpoint_url,
          uptime_percentage: service.uptime_percentage,
        });
      }

      console.log(`${service.name}: ${status} (${responseTime}ms, HTTP ${response.status})`);

      failureCounts.set(service.id, 0);

      // Resolve open alerts/incidents if now healthy
      if (isStatusOk) {
        const activeAlert = await alertRepository.findActiveAlert(service.id);
        if (activeAlert) {
          await alertRepository.resolveAlert(service.id);
          socketService.emitAlertResolved({
            service_id: service.id,
            project_id: service.project_id,
            service_name: service.name,
            title: `Alert on ${service.name} resolved`,
            alertname: activeAlert.title || "HealthCheckAlert",
            status: "resolved",
          });
          console.log(`[ALERT] RESOLVED for ${service.name}`);
        }

        const openIncident = await incidentRepository.findOpenIncident(service.id);
        if (openIncident) {
          const resolved = await incidentRepository.resolveIncident(openIncident.id);
          await incidentEventRepository.createEvent({
            incidentId: openIncident.id,
            eventType: "INCIDENT_RESOLVED",
            message: `Target '${service.name}' recovered (HTTP ${response.status} in ${responseTime}ms).`,
            metadata: { resolved_at: resolved?.resolved_at, mttr_seconds: resolved?.mttr_seconds },
          });
          socketService.emitIncidentResolved({
            ...resolved,
            project_id: service.project_id,
            service_name: service.name,
          });
          if (project) {
            await sendWebhookNotification(project, `RESOLVED: Incident #${openIncident.id} on ${service.name}`, `Target '${service.name}' passed health checks and recovered automatically.`, "info");
          }
          console.log(`Incident resolved for ${service.name}`);
        }
      }
    } catch (err) {
      try {
        await serviceRepository.recordCheckResult(service.id, {
          isHealthy: false,
          responseTime: 5000,
        });

        await metricRepository.createMetric(service.id, null, "critical");
        responseTimeHistogram.observe(5000);
        serviceStatus.set({ service: service.name }, 0);

        console.log(`${service.name}: DOWN (${err.message})`);

        let fails = (failureCounts.get(service.id) || 0) + 1;
        failureCounts.set(service.id, fails);

        if (fails >= 3) {
          await triggerAlert(service, `${service.name} failed 3 consecutive health checks`, "critical", project);
        } else {
          await triggerAlert(service, `${service.name} timeout/connection error (${err.message})`, "critical", project);
        }

        const existing = await incidentRepository.findOpenIncident(service.id);
        if (!existing) {
          const inc = await incidentRepository.createIncident({
            serviceId: service.id,
            projectId: service.project_id,
            title: `${service.name} is down`,
            alertName: "TargetUnreachable",
            summary: `Monitor target '${service.name}' failed synthetic HTTP health check probe`,
            description: `Endpoint ${service.endpoint_url} returned connection error: ${err.message}`,
            severity: fails >= 3 ? "critical" : "warning",
            fingerprint: `hc-${service.name.toLowerCase().replace(/\s+/g, "-")}`,
            startedAt: new Date(),
          });

          await incidentEventRepository.createEvent({
            incidentId: inc.id,
            eventType: "ALERT_FIRED",
            message: `Synthetic probe failed for '${service.name}' (${err.message})`,
            metadata: { service: service.name, error: err.message },
          });

          await incidentEventRepository.createEvent({
            incidentId: inc.id,
            eventType: "INCIDENT_CREATED",
            message: `Incident #${inc.id} opened for ${service.name}.`,
            metadata: { status: "open" },
          });

          socketService.emitIncidentCreated({
            ...inc,
            project_id: service.project_id,
            service_name: service.name,
          });

          if (project) {
            await sendWebhookNotification(project, `🔴 CRITICAL: ${service.name} is DOWN`, `Incident #${inc.id} opened. Target '${service.name}' failed health check: ${err.message}`, "critical");
          }

          console.log(`Incident opened for ${service.name}`);
        }
      } catch (innerErr) {
        console.warn(`[HealthChecker] Skipping transient error for ${service.name}:`, innerErr.message);
      }
    }
  }

  try {
    const openIncidentsCount = await incidentRepository.countOpenIncidents();
    activeIncidents.set(openIncidentsCount);

    const activeAlertsCount = await alertRepository.countActiveAlerts();
    activeAlerts.set(activeAlertsCount);
  } catch (err) {
    console.warn("[HealthChecker] Skipping metric gauge update:", err.message);
  }
}

module.exports = {
  checkServicesHealth,
};