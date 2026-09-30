const deploymentRepository = require("../repositories/deployment.repository");
const deploymentEventRepository = require("../repositories/deploymentEvent.repository");
const deploymentService = require("../services/deployment.service");

const getDeployments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const { environment, status, service_id: serviceId } = req.query;

    const deployments = await deploymentRepository.findRecent({
      limit,
      environment,
      status,
      serviceId,
    });
    const metrics = await deploymentRepository.getDeploymentMetrics();

    return res.status(200).json({
      success: true,
      data: deployments,
      metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch deployments",
      details: error.message,
    });
  }
};

const getDeploymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await deploymentService.getDeploymentDetails(id);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: "Deployment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: deployment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch deployment details",
      details: error.message,
    });
  }
};

const getDeploymentEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const events = await deploymentEventRepository.getEventsByDeploymentId(id);

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch deployment events",
      details: error.message,
    });
  }
};

const createDeployment = async (req, res) => {
  try {
    const {
      service,
      service_id,
      version,
      commit_sha,
      commit_message,
      branch = "main",
      author = "CI/CD Pipeline",
      status = "RUNNING",
      environment = "development",
      jenkins_build,
      jenkins_build_url,
      docker_image,
      events,
    } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        error: "Version is required (e.g. 'v1.8.2')",
      });
    }

    const deployment = await deploymentService.recordDeployment({
      service,
      serviceId: service_id,
      version,
      commit_sha,
      commit_message,
      branch,
      author,
      status,
      environment,
      jenkins_build,
      jenkins_build_url,
      docker_image,
      events,
    });

    return res.status(201).json({
      success: true,
      message: `Deployment ${version} registered successfully`,
      data: deployment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "Failed to register deployment",
      details: error.message,
    });
  }
};

const updateDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      completed_at,
      duration_seconds,
      docker_image,
      event_type,
      event_message,
      event_metadata,
    } = req.body;

    const updated = await deploymentService.updateDeploymentStatus(id, {
      status,
      completed_at,
      duration_seconds,
      docker_image,
      event_type,
      event_message,
      event_metadata,
    });

    return res.status(200).json({
      success: true,
      message: "Deployment updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const rollbackDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const { requested_by = "Lead SRE", target_version = null } = req.body;

    const result = await deploymentService.triggerRollback(id, {
      requestedBy: requested_by,
      targetVersion: target_version,
    });

    return res.status(200).json({
      success: true,
      message: `Rollback to ${result.targetVersion} executed successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getMetrics = async (req, res) => {
  try {
    const metrics = await deploymentRepository.getDeploymentMetrics();
    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch deployment metrics",
      details: error.message,
    });
  }
};

module.exports = {
  getDeployments,
  getDeploymentById,
  getDeploymentEvents,
  createDeployment,
  updateDeployment,
  rollbackDeployment,
  getMetrics,
};
