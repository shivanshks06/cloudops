const pool = require("../config/database");

const createDeployment = async ({
  serviceId,
  version,
  commitSha = null,
  commitMessage = null,
  branch = "main",
  author = "CI/CD Pipeline",
  status = "QUEUED",
  environment = "development",
  startedAt = null,
  jenkinsBuild = null,
  jenkinsBuildUrl = null,
  dockerImage = null,
  deploymentType = "DEPLOYMENT",
  rollbackFromVersion = null,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO deployments (
       service_id, version, commit_sha, commit_message, branch, author,
       status, environment, started_at, jenkins_build, jenkins_build_url,
       docker_image, deployment_type, rollback_from_version
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP), $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      serviceId,
      version,
      commitSha,
      commitMessage,
      branch,
      author,
      status,
      environment,
      startedAt,
      jenkinsBuild ? String(jenkinsBuild) : null,
      jenkinsBuildUrl,
      dockerImage,
      deploymentType,
      rollbackFromVersion,
    ]
  );
  return rows[0];
};

const updateDeployment = async (id, {
  status,
  completedAt = null,
  durationSeconds = null,
  dockerImage = null,
  commitSha = null,
  jenkinsBuild = null,
  jenkinsBuildUrl = null,
}) => {
  const { rows } = await pool.query(
    `UPDATE deployments
     SET
       status = COALESCE($2, status),
       completed_at = COALESCE($3, completed_at),
       duration_seconds = COALESCE(
         $4,
         CASE
           WHEN $3 IS NOT NULL THEN EXTRACT(EPOCH FROM ($3 - started_at))::integer
           WHEN status IN ('SUCCESS', 'FAILED', 'ROLLED_BACK') THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::integer
           ELSE duration_seconds
         END
       ),
       docker_image = COALESCE($5, docker_image),
       commit_sha = COALESCE($6, commit_sha),
       jenkins_build = COALESCE($7, jenkins_build),
       jenkins_build_url = COALESCE($8, jenkins_build_url)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      status,
      completedAt,
      durationSeconds,
      dockerImage,
      commitSha,
      jenkinsBuild ? String(jenkinsBuild) : null,
      jenkinsBuildUrl,
    ]
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       d.*,
       s.name AS service_name,
       s.environment AS service_environment,
       s.endpoint_url
     FROM deployments d
     JOIN services s ON s.id = d.service_id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0];
};

const findRecent = async ({
  limit = 50,
  environment = null,
  serviceId = null,
  status = null,
} = {}) => {
  let query = `
    SELECT
      d.*,
      s.name AS service_name,
      s.environment AS service_environment
    FROM deployments d
    JOIN services s ON s.id = d.service_id
    WHERE 1=1
  `;
  const params = [];

  if (environment && environment !== "all") {
    params.push(environment);
    query += ` AND d.environment = $${params.length}`;
  }
  if (serviceId) {
    params.push(serviceId);
    query += ` AND d.service_id = $${params.length}`;
  }
  if (status && status !== "all") {
    params.push(status);
    query += ` AND d.status = $${params.length}`;
  }

  params.push(limit);
  query += ` ORDER BY d.started_at DESC LIMIT $${params.length}`;

  const { rows } = await pool.query(query, params);
  return rows;
};

const findLatestSuccessful = async (serviceId, excludeVersion = null) => {
  let query = `
    SELECT d.*, s.name AS service_name
    FROM deployments d
    JOIN services s ON s.id = d.service_id
    WHERE d.service_id = $1 AND d.status = 'SUCCESS'
  `;
  const params = [serviceId];

  if (excludeVersion) {
    params.push(excludeVersion);
    query += ` AND d.version != $2`;
  }

  query += ` ORDER BY d.completed_at DESC NULLS LAST, d.started_at DESC LIMIT 1`;
  const { rows } = await pool.query(query, params);
  return rows[0];
};

const findRecentDeploymentForService = async (serviceId, timestamp = new Date(), windowMinutes = 30) => {
  const { rows } = await pool.query(
    `SELECT d.*, s.name AS service_name
     FROM deployments d
     JOIN services s ON s.id = d.service_id
     WHERE d.service_id = $1
       AND d.started_at <= $2
       AND d.started_at >= ($2::timestamp - INTERVAL '${windowMinutes} minutes')
     ORDER BY d.started_at DESC
     LIMIT 1`,
    [serviceId, timestamp]
  );
  return rows[0];
};

const getDeploymentMetrics = async () => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::integer AS total_deployments,
       COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE)::integer AS deployments_today,
       COUNT(*) FILTER (WHERE status = 'SUCCESS')::integer AS successful_deployments,
       COUNT(*) FILTER (WHERE status = 'FAILED')::integer AS failed_deployments,
       COUNT(*) FILTER (WHERE status = 'ROLLED_BACK' OR deployment_type = 'ROLLBACK')::integer AS rolled_back_deployments,
       COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL), 0)::integer AS avg_duration_seconds
     FROM deployments`
  );

  const row = rows[0];
  const total = row.total_deployments || 0;
  const failed = row.failed_deployments || 0;
  const rolledBack = row.rolled_back_deployments || 0;

  const changeFailureRate = total > 0 ? Math.round(((failed + rolledBack) / total) * 100) : 0;
  const rollbackRate = total > 0 ? Math.round((rolledBack / total) * 100) : 0;

  return {
    totalDeployments: total,
    deploymentsToday: row.deployments_today || 0,
    successfulDeployments: row.successful_deployments || 0,
    failedDeployments: failed,
    rolledBackDeployments: rolledBack,
    avgDurationSeconds: row.avg_duration_seconds || 0,
    changeFailureRate,
    rollbackRate,
    frequencyPerDay: row.deployments_today || 0,
  };
};

module.exports = {
  createDeployment,
  updateDeployment,
  findById,
  findRecent,
  findLatestSuccessful,
  findRecentDeploymentForService,
  getDeploymentMetrics,
};
