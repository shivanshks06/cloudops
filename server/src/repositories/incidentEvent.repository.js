const pool = require("../config/database");

const createEvent = async ({ incidentId, eventType, message, metadata = {} }) => {
  const { rows } = await pool.query(
    `INSERT INTO incident_events (incident_id, event_type, message, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [incidentId, eventType, message, JSON.stringify(metadata)]
  );
  return rows[0];
};

const getEventsByIncidentId = async (incidentId) => {
  const { rows } = await pool.query(
    `SELECT * FROM incident_events
     WHERE incident_id = $1
     ORDER BY created_at ASC`,
    [incidentId]
  );
  return rows;
};

module.exports = {
  createEvent,
  getEventsByIncidentId,
};
