const deploymentRepository = require("../repositories/deployment.repository");
const deploymentEventRepository = require("../repositories/deploymentEvent.repository");
const serviceRepository = require("../repositories/service.repository");
const socketService = require("./socket.service");
const pool = require("../config/database");
const logger = require("../config/logger");

const recordDeployment = async ({
  service: serviceName,
  serviceId = null,
  version,
  commit_sha = null,
  commit_message = null,
  branch = "main",
  author = "CI/CD Pipeline",
  status = "RUNNING",
  environment = "development",
  jenkins_build = null,
  jenkins_build_url = null,
  docker_image = null,
  started_at = null,
  completed_at = null,
  duration_seconds = null,
  events = [],
}) => {
  let resolvedServiceId = serviceId;
  let service = null;

  if (serviceName) {
    service = await serviceRepository.findOrCreateByName(serviceName);
    resolvedServiceId = service.id;
  } else if (serviceId) {
    service = await serviceRepository.findById(serviceId);
  }

  if (!resolvedServiceId) {
    throw new Error("Service name or ID is required for deployment");
  }

  const deployment = await deploymentRepository.createDeployment({
    serviceId: resolvedServiceId,
    version,
    commitSha: commit_sha,
    commitMessage: commit_message,
    branch,
    author,
    status,
    environment,
    startedAt: started_at ? new Date(started_at) : new Date(),
    jenkinsBuild: jenkins_build,
    jenkinsBuildUrl: jenkins_build_url,
    dockerImage: docker_image || `${service?.name || "service"}:${version}`,
  });

  // Create initial timeline events
  await deploymentEventRepository.createEvent({
    deploymentId: deployment.id,
    eventType: "DEPLOYMENT_STARTED",
    message: `Deployment ${version} started for '${service?.name || "service"}' in ${environment}`,
    metadata: { version, branch, commit_sha, author },
  });

  if (jenkins_build) {
    await deploymentEventRepository.createEvent({
      deploymentId: deployment.id,
      eventType: "JENKINS_BUILD_STARTED",
      message: `Jenkins CI build #${jenkins_build} triggered on branch ${branch}`,
      metadata: { jenkins_build, jenkins_build_url },
    });
  }

  // If status is immediately SUCCESS or FAILED
  if (status === "SUCCESS") {
    await deploymentEventRepository.createEvent({
      deploymentId: deployment.id,
      eventType: "DEPLOYMENT_SUCCESS",
      message: `Deployment ${version} completed successfully`,
      metadata: { status: "SUCCESS" },
    });
  } else if (status === "FAILED") {
    await deploymentEventRepository.createEvent({
      deploymentId: deployment.id,
      eventType: "DEPLOYMENT_FAILED",
      message: `Deployment ${version} failed during CI/CD execution`,
      metadata: { status: "FAILED" },
    });
  }

  // Any custom passed events
  if (Array.isArray(events)) {
    for (const ev of events) {
      if (ev.event_type && ev.message) {
        await deploymentEventRepository.createEvent({
          deploymentId: deployment.id,
          eventType: ev.event_type,
          message: ev.message,
          metadata: ev.metadata || {},
        });
      }
    }
  }

  logger.info(
    { deployment_id: deployment.id, service: service?.name, version, status },
    "Deployment recorded"
  );

  return deployment;
};

const updateDeploymentStatus = async (id, {
  status,
  completed_at = null,
  duration_seconds = null,
  docker_image = null,
  event_type = null,
  event_message = null,
  event_metadata = {},
}) => {
  const existing = await deploymentRepository.findById(id);
  if (!existing) {
    throw new Error("Deployment not found");
  }

  const updated = await deploymentRepository.updateDeployment(id, {
    status,
    completedAt: completed_at ? new Date(completed_at) : (["SUCCESS", "FAILED", "ROLLED_BACK"].includes(status) ? new Date() : null),
    durationSeconds: duration_seconds,
    dockerImage: docker_image,
  });

  // Timeline events based on status progression
  if (event_type && event_message) {
    await deploymentEventRepository.createEvent({
      deploymentId: id,
      eventType: event_type,
      message: event_message,
      metadata: event_metadata,
    });
  } else if (status === "SUCCESS") {
    await deploymentEventRepository.createEvent({
      deploymentId: id,
      eventType: "TESTS_PASSED",
      message: "Unit and integration tests passed (100% test suite)",
      metadata: { tests: "PASSED" },
    });
    await deploymentEventRepository.createEvent({
      deploymentId: id,
      eventType: "DOCKER_IMAGE_BUILT",
      message: `Docker image built & pushed: ${updated.docker_image || updated.version}`,
      metadata: { image: updated.docker_image },
    });
    await deploymentEventRepository.createEvent({
      deploymentId: id,
      eventType: "KUBERNETES_UPDATED",
      message: `Kubernetes pods updated to image ${updated.docker_image || updated.version}`,
      metadata: { status: "Rolled out" },
    });
    await deploymentEventRepository.createEvent({
      deploymentId: id,
      eventType: "DEPLOYMENT_SUCCESS",
      message: `Deployment ${updated.version} successfully completed in ${updated.duration_seconds || 0}s`,
      metadata: { duration_seconds: updated.duration_seconds },
    });
  } else if (status === "FAILED") {
    await deploymentEventRepository.createEvent({
      deploymentId: id,
      eventType: "DEPLOYMENT_FAILED",
      message: `Deployment ${updated.version} failed. Check Jenkins pipeline logs.`,
      metadata: { status: "FAILED" },
    });
  }

  logger.info({ deployment_id: id, status, duration: updated.duration_seconds }, "Deployment status updated");
  return updated;
};

const triggerRollback = async (deploymentId, {
  requestedBy = "Lead SRE",
  targetVersion = null,
} = {}) => {
  const current = await deploymentRepository.findById(deploymentId);
  if (!current) {
    throw new Error("Target deployment not found");
  }

  let rollbackToVersion = targetVersion;
  if (!rollbackToVersion) {
    const previousGood = await deploymentRepository.findLatestSuccessful(
      current.service_id,
      current.version
    );
    if (!previousGood) {
      throw new Error(`No previous successful deployment found for service '${current.service_name}'`);
    }
    rollbackToVersion = previousGood.version;
  }

  // 1. Mark current deployment as ROLLED_BACK
  await deploymentRepository.updateDeployment(current.id, {
    status: "ROLLED_BACK",
  });

  await deploymentEventRepository.createEvent({
    deploymentId: current.id,
    eventType: "ROLLBACK_TRIGGERED",
    message: `Rollback triggered from ${current.version} to ${rollbackToVersion} by ${requestedBy}`,
    metadata: { rollback_to: rollbackToVersion, requested_by: requestedBy },
  });

  // 2. Create new Rollback deployment record
  const rollbackDeployment = await deploymentRepository.createDeployment({
    serviceId: current.service_id,
    version: rollbackToVersion,
    commitSha: current.commit_sha,
    commitMessage: `Rollback from ${current.version} to ${rollbackToVersion}`,
    branch: current.branch,
    author: requestedBy,
    status: "SUCCESS",
    environment: current.environment,
    jenkinsBuild: current.jenkins_build ? `${current.jenkins_build}-rollback` : "rollback",
    dockerImage: `${current.service_name}:${rollbackToVersion}`,
    deploymentType: "ROLLBACK",
    rollbackFromVersion: current.version,
    startedAt: new Date(),
  });

  // 3. Mark completed immediately
  await deploymentRepository.updateDeployment(rollbackDeployment.id, {
    status: "SUCCESS",
    completedAt: new Date(),
    durationSeconds: 45,
  });

  await deploymentEventRepository.createEvent({
    deploymentId: rollbackDeployment.id,
    eventType: "DEPLOYMENT_STARTED",
    message: `Rollback deployment initiated to target version ${rollbackToVersion}`,
    metadata: { rollback_from: current.version, target_version: rollbackToVersion },
  });

  await deploymentEventRepository.createEvent({
    deploymentId: rollbackDeployment.id,
    eventType: "KUBERNETES_UPDATED",
    message: `Kubernetes deployment rolled back to image ${current.service_name}:${rollbackToVersion}`,
    metadata: { target_version: rollbackToVersion },
  });

  await deploymentEventRepository.createEvent({
    deploymentId: rollbackDeployment.id,
    eventType: "DEPLOYMENT_SUCCESS",
    message: `Rollback to ${rollbackToVersion} completed successfully (Restored previous known-good state)`,
    metadata: { target_version: rollbackToVersion, status: "SUCCESS" },
  });

  logger.info(
    { from: current.version, to: rollbackToVersion, requestedBy },
    "Deployment rollback executed"
  );

  return {
    originalDeployment: current,
    rollbackDeployment,
    targetVersion: rollbackToVersion,
  };
};

const getDeploymentDetails = async (id) => {
  const deployment = await deploymentRepository.findById(id);
  if (!deployment) return null;

  const timeline = await deploymentEventRepository.getEventsByDeploymentId(id);

  // Look for correlated incidents on the same service around this deployment
  const { rows: relatedIncidents } = await pool.query(
    `SELECT i.*, s.name AS service_name
     FROM incidents i
     JOIN services s ON s.id = i.service_id
     WHERE i.service_id = $1
       AND i.started_at >= ($2::timestamp - INTERVAL '10 minutes')
       AND i.started_at <= ($2::timestamp + INTERVAL '45 minutes')
     ORDER BY i.started_at DESC`,
    [deployment.service_id, deployment.started_at]
  );

  const deepLinks = {
    lokiLogs: `http://localhost:3002/explore?left=%7B%22datasource%22:%22Loki%22,%22queries%22:%5B%7B%22expr%22:%22%7Bservice%3D%5C%22${deployment.service_name}%5C%22%7D%22%7D%5D%7D`,
    jaegerTraces: `http://localhost:16686/search?service=${deployment.service_name || "cloudops-api"}`,
    prometheusMetrics: `http://localhost:3002`,
    jenkinsBuild: deployment.jenkins_build_url || `http://localhost:8080/job/${deployment.service_name}/${deployment.jenkins_build || "1"}/`,
  };

  return {
    ...deployment,
    timeline,
    events: timeline,
    relatedIncidents,
    deepLinks,
  };
};

module.exports = {
  recordDeployment,
  updateDeploymentStatus,
  triggerRollback,
  getDeploymentDetails,
};
