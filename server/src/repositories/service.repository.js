const pool = require("../config/database");

const findAll = async (options = {}) => {
  let query = "SELECT * FROM services";
  const values = [];

  if (options.projectId) {
    query += " WHERE project_id = $1";
    values.push(options.projectId);
  }

  query += " ORDER BY created_at DESC";

  const result = await pool.query(query, values);
  return result.rows;
};

const findByProjectId = async (projectId) => {
  const result = await pool.query(
    "SELECT * FROM services WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
  return result.rows;
};

const create = async ({
  projectId = null,
  userId = null,
  name,
  description = null,
  environment = "development",
  endpoint_url,
  monitor_type = "external_url",
  http_method = "GET",
  expected_status_code = 200,
  check_interval_seconds = 30,
  timeout_ms = 5000,
  request_body = null,
  custom_headers = {},
  ssl_check_enabled = true,
}) => {
  const result = await pool.query(
    `
    INSERT INTO services
    (project_id, user_id, name, description, environment, endpoint_url, monitor_type, http_method, expected_status_code, check_interval_seconds, timeout_ms, request_body, custom_headers, ssl_check_enabled, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'unknown')
    RETURNING *
    `,
    [
      projectId,
      userId,
      name,
      description,
      environment,
      endpoint_url,
      monitor_type,
      http_method.toUpperCase(),
      expected_status_code || 200,
      check_interval_seconds || 30,
      timeout_ms || 5000,
      request_body,
      JSON.stringify(custom_headers || {}),
      ssl_check_enabled !== false,
    ]
  );

  return result.rows[0];
};

const updateStatus = async (id, status, responseTime) => {
  const query = `
    UPDATE services
    SET
      status = $1,
      response_time = $2,
      last_checked_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [status, responseTime, id]);
  return rows[0];
};

const recordCheckResult = async (id, { isHealthy, responseTime }) => {
  const query = `
    UPDATE services
    SET
      total_checks = total_checks + 1,
      successful_checks = successful_checks + (CASE WHEN $1 = true THEN 1 ELSE 0 END),
      uptime_percentage = ROUND(
        ((successful_checks + (CASE WHEN $1 = true THEN 1 ELSE 0 END))::numeric / (total_checks + 1)::numeric) * 100,
        2
      ),
      status = $2,
      response_time = $3,
      last_checked_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;

  const status = isHealthy ? (responseTime > 1500 ? "warning" : "healthy") : "critical";
  const { rows } = await pool.query(query, [isHealthy, status, responseTime, id]);
  return rows[0];
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM services WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

const deleteById = async (id) => {
  const result = await pool.query(
    "DELETE FROM services WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

const findByName = async (name) => {
  const result = await pool.query(
    "SELECT * FROM services WHERE LOWER(name) = LOWER($1) LIMIT 1",
    [name]
  );
  return result.rows[0];
};

const findOrCreateByName = async (name, defaultData = {}) => {
  let service = await findByName(name);
  if (!service) {
    service = await create({
      projectId: defaultData.projectId || null,
      name,
      description: defaultData.description || `Service monitored (${name})`,
      environment: defaultData.environment || "production",
      endpoint_url: defaultData.endpoint_url || `http://${name}:5000`,
      monitor_type: defaultData.monitor_type || "external_url",
    });
  }
  return service;
};

module.exports = {
  findAll,
  findByProjectId,
  findById,
  findByName,
  findOrCreateByName,
  create,
  updateStatus,
  recordCheckResult,
  deleteById,
};