const axios = require("axios");
const pool = require("../config/database");
const logger = require("../config/logger");

const dispatchToProject = async (project, title, message, severity = "warning") => {
  if (!project) return;

  // 1. Slack Webhook Notification
  if (project.slack_webhook_url && project.slack_webhook_url.trim()) {
    try {
      const color = severity === "critical" ? "#EF4444" : severity === "warning" ? "#F59E0B" : "#10B981";
      const payload = {
        attachments: [
          {
            color,
            title: `[CloudOps Alert] ${title}`,
            text: message,
            fields: [
              { title: "Workspace", value: project.name || "Default Project", short: true },
              { title: "Severity", value: severity.toUpperCase(), short: true },
              { title: "Timestamp", value: new Date().toISOString(), short: false },
            ],
            footer: "CloudOps Multi-Tenant Real-Time Engine",
          },
        ],
      };
      await axios.post(project.slack_webhook_url, payload, { timeout: 5000 });
      logger.info({ projectId: project.id, url: project.slack_webhook_url }, "Slack webhook alert dispatched");
    } catch (err) {
      logger.warn({ err: err.message, projectId: project.id }, "Slack webhook delivery failed");
    }
  }

  // 2. Discord Webhook Notification
  if (project.discord_webhook_url && project.discord_webhook_url.trim()) {
    try {
      const embedColor = severity === "critical" ? 15548997 : severity === "warning" ? 16103704 : 1099684;
      const payload = {
        embeds: [
          {
            title: `🚨 [CloudOps Alert] ${title}`,
            description: message,
            color: embedColor,
            fields: [
              { name: "Workspace", value: project.name || "Default Project", inline: true },
              { name: "Severity", value: severity.toUpperCase(), inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };
      await axios.post(project.discord_webhook_url, payload, { timeout: 5000 });
      logger.info({ projectId: project.id }, "Discord webhook alert dispatched");
    } catch (err) {
      logger.warn({ err: err.message, projectId: project.id }, "Discord webhook delivery failed");
    }
  }
};

const sendWebhookNotification = async (projectOrId, title, message, severity = "warning") => {
  try {
    if (projectOrId && typeof projectOrId === "object" && (projectOrId.slack_webhook_url || projectOrId.discord_webhook_url)) {
      await dispatchToProject(projectOrId, title, message, severity);
      return;
    }

    if (projectOrId && (typeof projectOrId === "string" || typeof projectOrId === "number")) {
      const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [projectOrId]);
      if (rows[0] && (rows[0].slack_webhook_url || rows[0].discord_webhook_url)) {
        await dispatchToProject(rows[0], title, message, severity);
        return;
      }
    }

    // If no specific project, broadcast to all projects that have configured webhook URLs
    const { rows: projectsWithHooks } = await pool.query(`
      SELECT * FROM projects 
      WHERE (slack_webhook_url IS NOT NULL AND TRIM(slack_webhook_url) != '')
         OR (discord_webhook_url IS NOT NULL AND TRIM(discord_webhook_url) != '')
    `);

    if (projectsWithHooks && projectsWithHooks.length > 0) {
      for (const proj of projectsWithHooks) {
        await dispatchToProject(proj, title, message, severity);
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, "Failed in sendWebhookNotification");
  }
};

module.exports = {
  sendWebhookNotification,
  dispatchToProject,
};
