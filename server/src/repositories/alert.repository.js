const pool = require("../config/database");

const findActiveAlert = async (serviceId) => {
  const result = await pool.query(
    "SELECT * FROM alerts WHERE service_id = $1 AND status = 'active' LIMIT 1",
    [serviceId]
  );
  return result.rows[0];
};

const createAlert = async (serviceId, title, severity = 'critical') => {
  const result = await pool.query(
    `INSERT INTO alerts (service_id, title, severity, status, acknowledged)
     VALUES ($1, $2, $3, 'active', false)
     RETURNING *`,
    [serviceId, title, severity]
  );
  return result.rows[0];
};

const acknowledgeAlert = async (alertId) => {
  const result = await pool.query(
    `UPDATE alerts 
     SET acknowledged = true 
     WHERE id = $1 AND status = 'active'
     RETURNING *`,
    [alertId]
  );
  return result.rows[0];
};

const resolveAlert = async (serviceId) => {
  const result = await pool.query(
    `UPDATE alerts 
     SET status = 'resolved' 
     WHERE service_id = $1 AND status = 'active'
     RETURNING *`,
    [serviceId]
  );
  return result.rows[0];
};

const getRecentAlerts = async () => {
  const result = await pool.query(
    `SELECT a.*, s.name as service_name 
     FROM alerts a
     JOIN services s ON a.service_id = s.id
     ORDER BY a.created_at DESC
     LIMIT 50`
  );
  return result.rows;
};

const countActiveAlerts = async () => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM alerts WHERE status = 'active'`
  );
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  findActiveAlert,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  getRecentAlerts,
  countActiveAlerts,
};
