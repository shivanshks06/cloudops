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

const findById = async (id) => {
    const result = await pool.query(
        "SELECT * FROM services WHERE id = $1",
        [id]
    );

    return result.rows[0];
};

module.exports = {
    findAll,
    findById,
    create,
};