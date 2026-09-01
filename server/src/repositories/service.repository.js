const pool = require("../config/database");

const findAll = async () => {
    const result = await pool.query(
        "SELECT * FROM services ORDER BY created_at DESC"
    );

    return result.rows;
};

const create = async ({
    name,
    description,
    environment,
    endpoint_url,
}) => {
    const result = await pool.query(
        `
        INSERT INTO services
        (name, description, environment, endpoint_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [name, description, environment, endpoint_url]
    );

    return result.rows[0];
};

const updateStatus = async (id, status, responseTime) => {
  const query = `
    UPDATE services
    SET
      status = $1,
      response_time = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    status,
    responseTime,
    id,
  ]);

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

module.exports = {
    findAll,
    findById,
    create,
    updateStatus,
    deleteById,
};