const serviceRepository = require("../repositories/service.repository");
const incidentRepository = require("../repositories/incident.repository");
const metricRepository = require("../repositories/metric.repository");

const getDashboardSummary = async (req, res) => {
  try {
    const services = await serviceRepository.findAll();
    const recentIncidents = await incidentRepository.findRecent();
    const globalMetrics = await metricRepository.getGlobalMetricsSummary();

    const summary = {
      totalServices: services.length,
      healthy: services.filter(s => s.status === "healthy").length,
      warning: services.filter(s => s.status === "warning").length,
      critical: services.filter(s => s.status === "critical").length,
      uptime: globalMetrics.uptime,
      avgResponseTime: globalMetrics.avgResponseTime,
      incidents: recentIncidents
    };

    res.json(summary);
  } catch (error) {
    console.error("Failed to get dashboard summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getDashboardSummary,
};