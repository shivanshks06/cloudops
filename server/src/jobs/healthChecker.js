const axios = require("axios");
const serviceRepository = require("../repositories/service.repository");
const incidentRepository = require("../repositories/incident.repository");
const alertRepository = require("../repositories/alert.repository");
const metricRepository = require("../repositories/metric.repository");
const {
  healthChecksTotal,
  activeAlerts,
  activeIncidents,
  totalServices,
  responseTimeHistogram,
  serviceStatus,
} = require("../config/customMetrics");

const failureCounts = new Map();
const lastAlertTimes = new Map();
const COOLDOWN = 10 * 60 * 1000;

async function triggerAlert(service, title, severity) {
  // Cooldown deduplication per severity
  const lastTime = lastAlertTimes.get(`${service.id}-${severity}`) || 0;
  const lastAlertWithinCooldown = Date.now() - lastTime < COOLDOWN;

  if (lastAlertWithinCooldown) {
    return; // deduplicate alert spam
  }

  await alertRepository.createAlert(service.id, title, severity);
  lastAlertTimes.set(`${service.id}-${severity}`, Date.now());
  console.log(`[ALERT] ${severity.toUpperCase()}: ${title}`);
}

async function checkServicesHealth() {
  healthChecksTotal.inc();
  const services = await serviceRepository.findAll();
  totalServices.set(services.length);

  for (const service of services) {
    try {
      const start = Date.now();

      await axios.get(service.endpoint_url, {
        timeout: 5000,
      });

      const responseTime = Date.now() - start;

      let status = "healthy";

      if (responseTime > 1000) {
        status = "warning";
        await triggerAlert(service, `${service.name} response > 1000ms`, "warning");
      }

      await serviceRepository.updateStatus(
        service.id,
        status,
        responseTime
      );

      await metricRepository.createMetric(
        service.id,
        responseTime,
        status
      );

      responseTimeHistogram.observe(responseTime);
      serviceStatus.set({ service: service.name }, status === "healthy" ? 1 : (status === "warning" ? 0.5 : 0));

      console.log(
        `${service.name}: ${status} (${responseTime}ms)`
      );

      // Recovery: reset failure count
      failureCounts.set(service.id, 0);

      // Recovery: resolve active alerts
      const activeAlert = await alertRepository.findActiveAlert(service.id);
      if (activeAlert) {
        await alertRepository.resolveAlert(service.id);
        console.log(`[ALERT] RESOLVED for ${service.name}`);
      }

      // Existing Incident logic
      const openIncident =
        await incidentRepository.findOpenIncident(
          service.id
        );

      if (openIncident) {
        await incidentRepository.resolveIncident(
          openIncident.id
        );
      }
    } catch (err) {
      await serviceRepository.updateStatus(
        service.id,
        "critical",
        null
      );

      await metricRepository.createMetric(
        service.id,
        null,
        "critical"
      );

      responseTimeHistogram.observe(5000);
      serviceStatus.set({ service: service.name }, 0);

      console.log(`${service.name}: DOWN`);

      // Alert rules: consecutive failures
      let fails = (failureCounts.get(service.id) || 0) + 1;
      failureCounts.set(service.id, fails);

      if (fails >= 3) {
        await triggerAlert(service, `${service.name} failed 3 times in a row`, "escalated");
      } else {
        await triggerAlert(service, `${service.name} timeout/error`, "critical");
      }

      // Existing Incident logic
      const existing = await incidentRepository.findOpenIncident(service.id);
      if (!existing) {
        await incidentRepository.createIncident(
          service.id,
          `${service.name} is down`
        );
        console.log(`Incident opened for ${service.name}`);
      }
    }
  }
  
  const openIncidentsCount = await incidentRepository.countOpenIncidents();
  activeIncidents.set(openIncidentsCount);
  
  const activeAlertsCount = await alertRepository.countActiveAlerts();
  activeAlerts.set(activeAlertsCount);
}

module.exports = {
  checkServicesHealth,
};