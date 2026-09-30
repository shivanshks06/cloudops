const incidentRepository = require("../repositories/incident.repository");
const incidentEventRepository = require("../repositories/incidentEvent.repository");
const deploymentRepository = require("../repositories/deployment.repository");
const serviceRepository = require("../repositories/service.repository");
const alertRepository = require("../repositories/alert.repository");
const socketService = require("./socket.service");
const logger = require("../config/logger");

const handleAlertFiring = async ({
  alertname,
  severity = "critical",
  serviceName,
  summary,
  description,
  fingerprint,
  startsAt,
}) => {
  // 1. Ensure service exists
  const service = await serviceRepository.findOrCreateByName(serviceName);
  const incidentTitle = `${serviceName} - ${alertname} (${summary})`;

  // 2. Check for existing active incident by fingerprint or service
  let incident = null;
  if (fingerprint) {
    incident = await incidentRepository.findActiveByFingerprint(fingerprint);
  }
  if (!incident) {
    incident = await incidentRepository.findOpenIncidentByTitle(service.id, incidentTitle);
  }
  if (!incident) {
    incident = await incidentRepository.findOpenIncident(service.id);
  }

  if (incident) {
    logger.info({ incident_id: incident.id, fingerprint }, "Deduplicated active incident");
    return { incident, isNew: false };
  }

  // 3. Create new incident
  incident = await incidentRepository.createIncident({
    serviceId: service.id,
    title: incidentTitle,
    alertName: alertname,
    summary,
    description,
    severity,
    fingerprint,
    startedAt: startsAt ? new Date(startsAt) : new Date(),
  });

  // 4. Create timeline events
  await incidentEventRepository.createEvent({
    incidentId: incident.id,
    eventType: "ALERT_FIRED",
    message: `Alert '${alertname}' triggered with severity ${severity.toUpperCase()}`,
    metadata: { alertname, severity, summary, description, fingerprint },
  });

  await incidentEventRepository.createEvent({
    incidentId: incident.id,
    eventType: "INCIDENT_CREATED",
    message: `Incident #${incident.id} opened for service '${serviceName}'`,
    metadata: { status: "open", started_at: incident.started_at },
  });

  // Check for recent deployment correlation
  try {
    const recentDeployment = await deploymentRepository.findRecentDeploymentForService(
      service.id,
      incident.started_at,
      30
    );
    if (recentDeployment) {
      const minutesBefore = Math.max(
        0,
        Math.round((new Date(incident.started_at) - new Date(recentDeployment.started_at)) / 60000)
      );
      await incidentEventRepository.createEvent({
        incidentId: incident.id,
        eventType: "DEPLOYMENT_STARTED",
        message: `Correlated deployment detected: ${recentDeployment.version} was deployed ${minutesBefore}m prior to this incident`,
        metadata: {
          deployment_id: recentDeployment.id,
          version: recentDeployment.version,
          commit_sha: recentDeployment.commit_sha,
          minutes_before: minutesBefore,
        },
      });
    }
  } catch (depErr) {
    logger.warn({ err: depErr.message }, "Could not check deployment correlation");
  }

  // 5. Update service status
  const serviceStatus = severity === "warning" ? "warning" : "critical";
  await serviceRepository.updateStatus(service.id, serviceStatus, null);

  socketService.emitIncidentCreated({
    ...incident,
    service_name: serviceName,
  });

  logger.info({ incident_id: incident.id, service: serviceName }, "Incident created successfully");
  return { incident, isNew: true };
};

const handleAlertResolved = async ({
  alertname,
  serviceName,
  fingerprint,
  endsAt,
}) => {
  const service = await serviceRepository.findByName(serviceName);
  const resolvedTime = (endsAt && endsAt !== "0001-01-01T00:00:00Z") ? new Date(endsAt) : new Date();

  let incident = null;
  if (fingerprint) {
    incident = await incidentRepository.findActiveByFingerprint(fingerprint);
  }
  if (!incident && service) {
    incident = await incidentRepository.findOpenIncident(service.id);
  }

  if (!incident) {
    logger.info({ fingerprint, service: serviceName }, "No active incident found to resolve");
    return null;
  }

  // 1. Resolve incident in database & calculate MTTR
  const resolvedIncident = await incidentRepository.resolveIncident(incident.id, resolvedTime);

  // 2. Add timeline events
  await incidentEventRepository.createEvent({
    incidentId: incident.id,
    eventType: "ALERT_RESOLVED",
    message: `Alert '${alertname || incident.alert_name}' cleared`,
    metadata: { alertname, resolved_at: resolvedTime },
  });

  const durationStr = resolvedIncident && resolvedIncident.mttr_seconds
    ? `${Math.floor(resolvedIncident.mttr_seconds / 60)}m ${resolvedIncident.mttr_seconds % 60}s`
    : "instant";

  await incidentEventRepository.createEvent({
    incidentId: incident.id,
    eventType: "INCIDENT_RESOLVED",
    message: `Incident #${incident.id} resolved automatically (Duration: ${durationStr})`,
    metadata: {
      status: "resolved",
      resolved_at: resolvedTime,
      mttr_seconds: resolvedIncident ? resolvedIncident.mttr_seconds : null,
    },
  });

  // 3. Mark service healthy if no other active alerts
  if (service) {
    const remainingAlert = await alertRepository.findActiveAlert(service.id);
    if (!remainingAlert) {
      await serviceRepository.updateStatus(service.id, "healthy", 50);
    }
  }

  socketService.emitIncidentResolved({
    ...resolvedIncident,
    service_name: serviceName,
  });

  logger.info({ incident_id: incident.id, mttr: durationStr }, "Incident resolved successfully");
  return resolvedIncident;
};

const acknowledgeIncident = async (incidentId, acknowledgedBy = "engineer") => {
  const acknowledged = await incidentRepository.acknowledgeIncident(incidentId, acknowledgedBy);
  if (!acknowledged) {
    throw new Error("Incident not found or already acknowledged/resolved");
  }

  await incidentEventRepository.createEvent({
    incidentId,
    eventType: "ACKNOWLEDGED",
    message: `Incident acknowledged by ${acknowledgedBy}`,
    metadata: { acknowledged_by: acknowledgedBy, acknowledged_at: acknowledged.acknowledged_at },
  });

  socketService.emitIncidentUpdated(acknowledged);

  logger.info({ incident_id: incidentId, acknowledged_by: acknowledgedBy }, "Incident acknowledged");
  return acknowledged;
};

const manualResolveIncident = async (incidentId, resolvedBy = "engineer") => {
  const resolved = await incidentRepository.resolveIncident(incidentId);
  if (!resolved) {
    throw new Error("Incident not found or already resolved");
  }

  const durationStr = resolved.mttr_seconds
    ? `${Math.floor(resolved.mttr_seconds / 60)}m ${resolved.mttr_seconds % 60}s`
    : "instant";

  await incidentEventRepository.createEvent({
    incidentId,
    eventType: "INCIDENT_RESOLVED",
    message: `Incident resolved manually by ${resolvedBy} (Duration: ${durationStr})`,
    metadata: { resolved_by: resolvedBy, resolved_at: resolved.resolved_at, mttr_seconds: resolved.mttr_seconds },
  });

  socketService.emitIncidentResolved(resolved);

  logger.info({ incident_id: incidentId, resolved_by: resolvedBy }, "Incident manually resolved");
  return resolved;
};

const getIncidentDetails = async (incidentId) => {
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    return null;
  }

  const timeline = await incidentEventRepository.getEventsByIncidentId(incidentId);

  // Generate deep links to Grafana, Loki, Jaeger
  const deepLinks = {
    grafanaMetrics: `http://localhost:3002/explore?left=%7B%22datasource%22:%22Prometheus%22,%22queries%22:%5B%7B%22expr%22:%22up%7Bservice%3D%5C%22${incident.service_name}%5C%22%7D%22%7D%5D%7D`,
    lokiLogs: `http://localhost:3002/explore?left=%7B%22datasource%22:%22Loki%22,%22queries%22:%5B%7B%22expr%22:%22%7Bjob%3D~%5C%22.%2B%5C%22%7D%22%7D%5D%7D`,
    jaegerTraces: `http://localhost:16686/search?service=cloudops-api`,
  };

  let correlatedDeployment = null;
  try {
    const recDep = await deploymentRepository.findRecentDeploymentForService(
      incident.service_id,
      incident.started_at,
      45
    );
    if (recDep) {
      const minutesBefore = Math.max(
        0,
        Math.round((new Date(incident.started_at) - new Date(recDep.started_at)) / 60000)
      );
      correlatedDeployment = {
        ...recDep,
        minutes_before: minutesBefore,
      };
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Error finding correlated deployment for incident");
  }

  return {
    ...incident,
    timeline,
    events: timeline,
    correlatedDeployment,
    deepLinks,
  };
};

module.exports = {
  handleAlertFiring,
  handleAlertResolved,
  acknowledgeIncident,
  manualResolveIncident,
  getIncidentDetails,
};
