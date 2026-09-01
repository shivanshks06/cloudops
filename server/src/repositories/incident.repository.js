const pool = require("../config/database");

const findOpenIncident = async (serviceId) => {
  const { rows } = await pool.query(
    `SELECT * FROM incidents
     WHERE service_id=$1 AND status='open'
     LIMIT 1`,
    [serviceId]
  );

  return rows[0];
};

const createIncident = async (serviceId, title) => {
  await pool.query(
    `INSERT INTO incidents(service_id,title)
     VALUES($1,$2)`,
    [serviceId, title]
  );
};

const resolveIncident = async (incidentId) => {
  await pool.query(`
    UPDATE incidents
    SET
      status='resolved',
      resolved_at=CURRENT_TIMESTAMP,
      mttr_seconds=
        EXTRACT(EPOCH FROM (
          CURRENT_TIMESTAMP-started_at
        ))
    WHERE id=${incidentId}
  `);
};

const findRecent = async () => {
  const { rows } = await pool.query(`
    SELECT
      i.*,
      s.name AS service_name
    FROM incidents i
    JOIN services s
      ON s.id=i.service_id
    ORDER BY started_at DESC
    LIMIT 20
  `);

  return rows;
};

const countOpenIncidents = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM incidents WHERE status='open'`
  );
  return parseInt(rows[0].count, 10);
};

const findByServiceId = async (serviceId) => {
  const { rows } = await pool.query(`
    SELECT
      i.*,
      s.name AS service_name
    FROM incidents i
    JOIN services s
      ON s.id=i.service_id
    WHERE i.service_id=$1
    ORDER BY started_at DESC
    LIMIT 20
  `, [serviceId]);

  return rows;
};

module.exports = {
  findOpenIncident,
  createIncident,
  resolveIncident,
  findRecent,
  countOpenIncidents,
  findByServiceId,
};