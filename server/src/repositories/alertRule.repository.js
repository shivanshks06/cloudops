const pool = require("../config/database");

const create = async ({
  projectId,
  serviceId = null,
  name,
  metricType,
  operator,
  thresholdValue,
  durationSeconds = 60,
  severity = "warning",
  notificationChannel = "slack",
}) => {
  const query = `
    INSERT INTO alert_rules (project_id, service_id, name, metric_type, operator, threshold_value, duration_seconds, severity, notification_channel)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    projectId,
    serviceId,
    name,
    metricType,
    operator,
    thresholdValue,
    durationSeconds,
    severity,
    notificationChannel,
  ]);
  return rows[0];
};

const findByProjectId = async (projectId) => {
  const query = `
    SELECT ar.*, s.name as service_name
    FROM alert_rules ar
    LEFT JOIN services s ON ar.service_id = s.id
    WHERE ar.project_id = $1
    ORDER BY ar.created_at DESC
  `;
  const { rows } = await pool.query(query, [projectId]);
  return rows;
};

const findByServiceId = async (serviceId) => {
  const query = `
    SELECT * FROM alert_rules
    WHERE service_id = $1 AND is_active = true
  `;
  const { rows } = await pool.query(query, [serviceId]);
  return rows;
};

const deleteById = async (id, projectId) => {
  const query = `
    DELETE FROM alert_rules
    WHERE id = $1 AND project_id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [id, projectId]);
  return rows[0];
};

module.exports = {
  create,
  findByProjectId,
  findByServiceId,
  deleteById,
};
