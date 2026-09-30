const pool = require("../config/database");

const createEvent = async ({ deploymentId, eventType, message, metadata = {} }) => {
  const { rows } = await pool.query(
    `INSERT INTO deployment_events (deployment_id, event_type, message, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [deploymentId, eventType, message, JSON.stringify(metadata)]
  );
  return rows[0];
};

const getEventsByDeploymentId = async (deploymentId) => {
  const { rows } = await pool.query(
    `SELECT * FROM deployment_events
     WHERE deployment_id = $1
     ORDER BY created_at ASC`,
    [deploymentId]
  );
  return rows;
};

module.exports = {
  createEvent,
  getEventsByDeploymentId,
};
