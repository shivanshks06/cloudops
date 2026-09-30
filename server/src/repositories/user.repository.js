const pool = require("../config/database");

const create = async ({ name, email, passwordHash, role = "user", avatarUrl = null }) => {
  const query = `
    INSERT INTO users (name, email, password_hash, role, avatar_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, avatar_url, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [name, email.toLowerCase().trim(), passwordHash, role, avatarUrl]);
  return rows[0];
};

const findByEmail = async (email) => {
  const query = `
    SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1
  `;
  const { rows } = await pool.query(query, [email.trim()]);
  return rows[0];
};

const findById = async (id) => {
  const query = `
    SELECT id, name, email, role, avatar_url, created_at, updated_at
    FROM users WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

module.exports = {
  create,
  findByEmail,
  findById,
};
