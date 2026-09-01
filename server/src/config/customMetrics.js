const { client, register } = require("./prometheus");

const healthChecksTotal = new client.Counter({
  name: "cloudops_health_checks_total",
  help: "Total number of health checks performed",
  registers: [register],
});

const activeAlerts = new client.Gauge({
  name: "cloudops_active_alerts",
  help: "Current active alerts",
  registers: [register],
});

const activeIncidents = new client.Gauge({
  name: "cloudops_active_incidents",
  help: "Current active incidents",
  registers: [register],
});

const totalServices = new client.Gauge({
  name: "cloudops_services_total",
  help: "Total registered services",
  registers: [register],
});

const responseTimeHistogram = new client.Histogram({
  name: "cloudops_response_time_ms",
  help: "Service response time",
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});

const serviceStatus = new client.Gauge({
  name: "cloudops_service_status",
  help: "Health state (1=healthy, 0=warning/critical)",
  labelNames: ["service"],
  registers: [register],
});

module.exports = {
  healthChecksTotal,
  activeAlerts,
  activeIncidents,
  totalServices,
  responseTimeHistogram,
  serviceStatus,
};
