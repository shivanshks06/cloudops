const alertRuleRepository = require("../repositories/alertRule.repository");
const projectRepository = require("../repositories/project.repository");
const logger = require("../config/logger");

const getAlertRules = async (req, res) => {
  try {
    const projectId = req.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID required" });
    }

    const rules = await alertRuleRepository.findByProjectId(projectId);
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    logger.error({ err: err.message }, "Get alert rules error");
    res.status(500).json({ success: false, message: "Failed to fetch alert rules" });
  }
};

const createAlertRule = async (req, res) => {
  try {
    const {
      project_id,
      projectId,
      service_id,
      serviceId,
      name,
      metric_type,
      metricType,
      operator,
      threshold_value,
      thresholdValue,
      duration_seconds,
      durationSeconds,
      severity,
      notification_channel,
      notificationChannel,
    } = req.body;

    const pId = project_id || projectId || req.projectId;
    if (!pId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const ruleName = name || `${metric_type || metricType} alert`;
    const mType = metric_type || metricType || "availability";
    const op = operator || ">";
    const thresh = threshold_value !== undefined ? threshold_value : thresholdValue;

    if (thresh === undefined) {
      return res.status(400).json({ success: false, message: "Threshold value is required" });
    }

    const rule = await alertRuleRepository.create({
      projectId: pId,
      serviceId: service_id || serviceId || null,
      name: ruleName,
      metricType: mType,
      operator: op,
      thresholdValue: thresh,
      durationSeconds: duration_seconds || durationSeconds || 60,
      severity: severity || "warning",
      notificationChannel: notification_channel || notificationChannel || "slack",
    });

    res.status(201).json({
      success: true,
      message: "Alert rule created successfully",
      data: rule,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Create alert rule error");
    res.status(500).json({ success: false, message: "Failed to create alert rule" });
  }
};

const deleteAlertRule = async (req, res) => {
  try {
    const projectId = req.projectId || req.query.projectId;
    const deleted = await alertRuleRepository.deleteById(req.params.id, projectId);
    res.status(200).json({ success: true, message: "Alert rule deleted successfully" });
  } catch (err) {
    logger.error({ err: err.message }, "Delete alert rule error");
    res.status(500).json({ success: false, message: "Failed to delete alert rule" });
  }
};

module.exports = {
  getAlertRules,
  createAlertRule,
  deleteAlertRule,
};
