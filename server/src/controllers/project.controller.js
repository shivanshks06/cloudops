const projectRepository = require("../repositories/project.repository");
const logger = require("../config/logger");

const getProjects = async (req, res) => {
  try {
    const projects = await projectRepository.findByUserId(req.user.id);
    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Get projects error");
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, slack_webhook_url, discord_webhook_url } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const project = await projectRepository.create({
      userId: req.user.id,
      name: name.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description: description ? description.trim() : null,
      slackWebhookUrl: slack_webhook_url || null,
      discordWebhookUrl: discord_webhook_url || null,
    });

    logger.info({ projectId: project.id, userId: req.user.id }, "Project created");

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Create project error");
    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await projectRepository.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const hasAccess = await projectRepository.userHasAccess(project.id, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this project",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Get project error");
    res.status(500).json({
      success: false,
      message: "Failed to fetch project details",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await projectRepository.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const hasAccess = await projectRepository.userHasAccess(project.id, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updated = await projectRepository.update(project.id, req.body);
    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Update project error");
    res.status(500).json({ success: false, message: "Failed to update project" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await projectRepository.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Only owner can delete project
    if (project.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only project owner can delete this workspace" });
    }

    await projectRepository.deleteById(project.id);
    res.status(200).json({
      success: true,
      message: "Project and all associated monitors and metrics deleted successfully",
    });
  } catch (err) {
    logger.error({ err: err.message }, "Delete project error");
    res.status(500).json({ success: false, message: "Failed to delete project" });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
};
