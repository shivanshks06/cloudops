const pool = require("../config/database");

const create = async ({
  userId,
  name,
  slug,
  description = null,
  slackWebhookUrl = null,
  discordWebhookUrl = null,
  emailNotifications = true,
}) => {
  const query = `
    INSERT INTO projects (user_id, name, slug, description, slack_webhook_url, discord_webhook_url, email_notifications)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    userId,
    name,
    slug,
    description,
    slackWebhookUrl,
    discordWebhookUrl,
    emailNotifications,
  ]);

  const project = rows[0];

  // Also add owner to project_members as 'admin'
  await pool.query(
    `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`,
    [project.id, userId]
  );

  return project;
};

const findByUserId = async (userId) => {
  const query = `
    SELECT DISTINCT p.*, 
      (SELECT COUNT(*) FROM services WHERE project_id = p.id) AS services_count,
      (SELECT COUNT(*) FROM incidents WHERE project_id = p.id AND status = 'open') AS open_incidents_count
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.user_id = $1 OR pm.user_id = $1
    ORDER BY p.created_at ASC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

const findById = async (id) => {
  const query = `
    SELECT p.*,
      (SELECT COUNT(*) FROM services WHERE project_id = p.id) AS services_count,
      (SELECT COUNT(*) FROM incidents WHERE project_id = p.id AND status = 'open') AS open_incidents_count
    FROM projects p
    WHERE p.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(data.description);
  }
  if (data.slack_webhook_url !== undefined) {
    fields.push(`slack_webhook_url = $${index++}`);
    values.push(data.slack_webhook_url);
  }
  if (data.discord_webhook_url !== undefined) {
    fields.push(`discord_webhook_url = $${index++}`);
    values.push(data.discord_webhook_url);
  }
  if (data.email_notifications !== undefined) {
    fields.push(`email_notifications = $${index++}`);
    values.push(data.email_notifications);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE projects
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteById = async (id) => {
  const query = `DELETE FROM projects WHERE id = $1 RETURNING *`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const userHasAccess = async (projectId, userId) => {
  const query = `
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = $1 AND (p.user_id = $2 OR pm.user_id = $2)
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [projectId, userId]);
  return rows.length > 0;
};

module.exports = {
  create,
  findByUserId,
  findById,
  update,
  deleteById,
  userHasAccess,
};
