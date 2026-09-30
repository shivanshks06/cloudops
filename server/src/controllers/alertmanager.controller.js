const incidentService = require("../services/incident.service");
const alertRepository = require("../repositories/alert.repository");
const serviceRepository = require("../repositories/service.repository");
const logger = require("../config/logger");

const receiveAlertmanagerWebhook = async (req, res) => {
  try {
    const { alerts = [], status: overallStatus, receiver } = req.body;

    logger.info(
      { receiver, status: overallStatus, alertsCount: alerts.length },
      "Alertmanager webhook received"
    );

    for (const alert of alerts) {
      const {
        status,
        labels = {},
        annotations = {},
        startsAt,
        endsAt,
        fingerprint,
      } = alert;

      const alertname = labels.alertname || "GenericAlert";
      const severity = labels.severity || "critical";
      const serviceName = labels.service || labels.job || "cloudops-api";
      const summary = annotations.summary || `${alertname} on ${serviceName}`;
      const description = annotations.description || summary;
      const alertTitle = `${alertname}: ${summary}`;

      const service = await serviceRepository.findOrCreateByName(serviceName);

      if (status === "firing") {
        // 1. Alert deduplication & tracking
        let activeAlert = await alertRepository.findActiveAlertByTitle(service.id, alertTitle);
        if (!activeAlert) {
          await alertRepository.createAlert(service.id, alertTitle, severity);
        }

        // 2. Incident lifecycle & timeline events (with fingerprint deduplication)
        await incidentService.handleAlertFiring({
          alertname,
          severity,
          serviceName,
          summary,
          description,
          fingerprint,
          startsAt,
        });
      } else if (status === "resolved") {
        // 1. Resolve alert
        await alertRepository.resolveAlertByTitle(service.id, alertTitle);

        // 2. Resolve incident & calculate MTTR
        await incidentService.handleAlertResolved({
          alertname,
          serviceName,
          fingerprint,
          endsAt,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Alertmanager webhook processed successfully",
      alertsProcessed: alerts.length,
    });
  } catch (error) {
    logger.error({ error: error.message }, "Alertmanager webhook processing error");
    return res.status(500).json({
      success: false,
      error: "Failed to process Alertmanager webhook",
      details: error.message,
    });
  }
};

module.exports = {
  receiveAlertmanagerWebhook,
};
