const pool = require("../config/database");

const createMetric = async (
  serviceId,
  responseTime,
  status
) => {
  await pool.query(
    `INSERT INTO service_metrics
      (service_id,response_time,status)
     VALUES($1,$2,$3)`,
    [serviceId, responseTime, status]
  );
};

const getServiceMetrics = async (serviceId) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM service_metrics
    WHERE service_id=$1
    ORDER BY checked_at ASC
    LIMIT 100
    `,
    [serviceId]
  );

  return rows;
};

const getGlobalMetricsSummary = async () => {
  const { rows } = await pool.query(`
    SELECT 
      AVG(response_time) as avg_response,
      COUNT(CASE WHEN status='healthy' OR status='warning' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as avg_uptime
    FROM service_metrics
  `);
  
  return {
    avgResponseTime: rows[0].avg_response ? Math.round(Number(rows[0].avg_response)) : 0,
    uptime: rows[0].avg_uptime ? Number(rows[0].avg_uptime).toFixed(2) + "%" : "100.00%"
  };
};

module.exports = {
  createMetric,
  getServiceMetrics,
  getGlobalMetricsSummary,
};