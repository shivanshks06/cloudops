const pool = require("../config/database");

const findActiveByFingerprint = async (fingerprint) => {
  if (!fingerprint) return null;
  const { rows } = await pool.query(
    `SELECT i.*, s.name AS service_name
     FROM incidents i
     JOIN services s ON s.id = i.service_id
     WHERE i.fingerprint = $1 AND i.status IN ('open', 'acknowledged')
     LIMIT 1`,
    [fingerprint]
  );
  return rows[0];
};

const findOpenIncident = async (serviceId) => {
  const { rows } = await pool.query(
    `SELECT i.*, s.name AS service_name
     FROM incidents i
     JOIN services s ON s.id = i.service_id
     WHERE i.service_id = $1 AND i.status IN ('open', 'acknowledged')
     LIMIT 1`,
    [serviceId]
  );
  return rows[0];
};

const findOpenIncidentByTitle = async (serviceId, title) => {
  const { rows } = await pool.query(
    `SELECT i.*, s.name AS service_name
     FROM incidents i
     JOIN services s ON s.id = i.service_id
     WHERE i.service_id = $1 AND i.title = $2 AND i.status IN ('open', 'acknowledged')
     LIMIT 1`,
    [serviceId, title]
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT i.*, s.name AS service_name, s.environment, s.endpoint_url
     FROM incidents i
     JOIN services s ON s.id = i.service_id
     WHERE i.id = $1`,
    [id]
  );
  return rows[0];
};

const createIncident = async (arg1, arg2, ...rest) => {
  let serviceId, title, alertName = null, summary = null, description = null, severity = "critical", fingerprint = null, startedAt = null;

  if (typeof arg1 === "object" && arg1 !== null) {
    serviceId = arg1.serviceId;
    title = arg1.title;
    alertName = arg1.alertName || null;
    summary = arg1.summary || null;
    description = arg1.description || null;
    severity = arg1.severity || "critical";
    fingerprint = arg1.fingerprint || null;
    startedAt = arg1.startedAt || null;
  } else {
    serviceId = arg1;
    title = arg2;
    severity = rest[0] || "critical";
  }

  const { rows } = await pool.query(
    `INSERT INTO incidents (
       service_id, title, alert_name, summary, description, severity, status, fingerprint, started_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, COALESCE($8, CURRENT_TIMESTAMP))
     RETURNING *`,
    [serviceId, title, alertName, summary, description, severity, fingerprint, startedAt]
  );
  return rows[0];
};

const acknowledgeIncident = async (incidentId, acknowledgedBy = "system", acknowledgedAt = null) => {
  const { rows } = await pool.query(
    `UPDATE incidents
     SET
       status = 'acknowledged',
       acknowledged_at = COALESCE($2, CURRENT_TIMESTAMP),
       acknowledged_by = $3
     WHERE id = $1 AND status = 'open'
     RETURNING *`,
    [incidentId, acknowledgedAt, acknowledgedBy]
  );
  return rows[0];
};

const resolveIncident = async (incidentId, resolvedAt = null) => {
  const { rows } = await pool.query(
    `UPDATE incidents
     SET
       status = 'resolved',
       resolved_at = COALESCE($2, CURRENT_TIMESTAMP),
       mttr_seconds = EXTRACT(EPOCH FROM (COALESCE($2, CURRENT_TIMESTAMP) - started_at))
     WHERE id = $1 AND status IN ('open', 'acknowledged')
     RETURNING *`,
    [incidentId, resolvedAt]
  );
  return rows[0];
};

const findRecent = async (limit = 20) => {
  const { rows } = await pool.query(
    `SELECT
       i.*,
       s.name AS service_name
     FROM incidents i
     JOIN services s ON s.id = i.service_id
     ORDER BY i.started_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

const countOpenIncidents = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM incidents WHERE status IN ('open', 'acknowledged')`
  );
  return parseInt(rows[0].count, 10);
};

const findByServiceId = async (serviceId) => {
  const { rows } = await pool.query(
    `SELECT
       i.*,
       s.name AS service_name
     FROM incidents i
     JOIN services s ON s.id = i.service_id
     WHERE i.service_id = $1
     ORDER BY i.started_at DESC
     LIMIT 20`,
    [serviceId]
  );
  return rows;
};

const getIncidentMetrics = async () => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('open', 'acknowledged')) AS active_incidents,
       COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at >= CURRENT_DATE) AS resolved_today,
       COALESCE(AVG(mttr_seconds) FILTER (WHERE status = 'resolved'), 0)::integer AS mttr_seconds,
       COALESCE(AVG(EXTRACT(EPOCH FROM (acknowledged_at - started_at))) FILTER (WHERE acknowledged_at IS NOT NULL), 0)::integer AS mtta_seconds
     FROM incidents`
  );
  return {
    activeIncidents: parseInt(rows[0].active_incidents, 10) || 0,
    resolvedToday: parseInt(rows[0].resolved_today, 10) || 0,
    mttrSeconds: parseInt(rows[0].mttr_seconds, 10) || 0,
    mttaSeconds: parseInt(rows[0].mtta_seconds, 10) || 0,
  };
};

module.exports = {
  findActiveByFingerprint,
  findOpenIncident,
  findOpenIncidentByTitle,
  findById,
  createIncident,
  acknowledgeIncident,
  resolveIncident,
  findRecent,
  countOpenIncidents,
  findByServiceId,
  getIncidentMetrics,
};