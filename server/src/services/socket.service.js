const { Server } = require("socket.io");
const logger = require("../config/logger");

let io = null;
const recentActivities = [];
const MAX_ACTIVITIES = 50;

const addActivity = (type, title, message, severity = "info", metadata = {}) => {
  const activity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    title,
    message,
    severity, // 'info', 'success', 'warning', 'critical'
    timestamp: new Date().toISOString(),
    metadata,
  };

  recentActivities.unshift(activity);
  if (recentActivities.length > MAX_ACTIVITIES) {
    recentActivities.pop();
  }

  if (io) {
    io.emit("activity:new", activity);
  }

  return activity;
};

const initializeSocket = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.CLIENT_URL || "http://localhost:5173",
      ],
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Client connected to CloudOps WebSocket");

    // Send initial batch of recent activities upon connecting
    socket.emit("activity:history", recentActivities);

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Client disconnected from CloudOps WebSocket");
    });
  });

  logger.info("Socket.IO real-time engine initialized");
  return io;
};

const getIO = () => {
  if (!io) {
    logger.warn("Socket.IO requested before initialization");
  }
  return io;
};

// Standardized Emitters
const emitIncidentCreated = (incident) => {
  if (io) io.emit("incident:created", incident);
  addActivity(
    "incident:created",
    `Incident #${incident.id} Created`,
    `🔴 ${incident.alert_name || incident.title} on ${incident.service_name || "service"}`,
    "critical",
    { incidentId: incident.id, service: incident.service_name }
  );
};

const emitIncidentUpdated = (incident) => {
  if (io) io.emit("incident:updated", incident);
  addActivity(
    "incident:updated",
    `Incident #${incident.id} Updated`,
    `👤 Incident acknowledged by ${incident.acknowledged_by || "engineer"}`,
    "info",
    { incidentId: incident.id, status: incident.status }
  );
};

const emitIncidentResolved = (incident) => {
  if (io) io.emit("incident:resolved", incident);
  addActivity(
    "incident:resolved",
    `Incident #${incident.id} Resolved`,
    `🟢 ${incident.alert_name || incident.title} resolved (MTTR: ${incident.mttr_seconds || 0}s)`,
    "success",
    { incidentId: incident.id, mttrSeconds: incident.mttr_seconds }
  );
};

const emitAlertFiring = (alert) => {
  if (io) io.emit("alert:firing", alert);
  addActivity(
    "alert:firing",
    "Alert Firing",
    `⚠️ ${alert.title || alert.alertname} [${alert.severity?.toUpperCase() || "CRITICAL"}]`,
    alert.severity === "warning" ? "warning" : "critical",
    alert
  );
};

const emitAlertResolved = (alert) => {
  if (io) io.emit("alert:resolved", alert);
  addActivity(
    "alert:resolved",
    "Alert Resolved",
    `🟢 ${alert.title || alert.alertname || "Service alert"} recovered`,
    "success",
    alert
  );
};

const emitDeploymentStarted = (deployment) => {
  if (io) io.emit("deployment:started", deployment);
  addActivity(
    "deployment:started",
    "Deployment Started",
    `🚀 ${deployment.version} starting rollout on ${deployment.service_name || "service"}`,
    "info",
    { deploymentId: deployment.id, version: deployment.version }
  );
};

const emitDeploymentSuccess = (deployment) => {
  if (io) io.emit("deployment:success", deployment);
  addActivity(
    "deployment:success",
    "Deployment Succeeded",
    `✅ ${deployment.version} successfully deployed to ${deployment.environment || "production"}`,
    "success",
    { deploymentId: deployment.id, version: deployment.version }
  );
};

const emitDeploymentFailed = (deployment) => {
  if (io) io.emit("deployment:failed", deployment);
  addActivity(
    "deployment:failed",
    "Deployment Failed",
    `❌ ${deployment.version} pipeline failed on ${deployment.service_name || "service"}`,
    "critical",
    { deploymentId: deployment.id, version: deployment.version }
  );
};

const emitDeploymentRollback = (deployment) => {
  if (io) io.emit("deployment:rollback", deployment);
  addActivity(
    "deployment:rollback",
    "Rollback Executed",
    `🔄 Rolled back from ${deployment.rollback_from_version || "current"} to ${deployment.version}`,
    "warning",
    { deploymentId: deployment.id, targetVersion: deployment.version }
  );
};

const emitServiceStatus = (service) => {
  if (io) io.emit("service:status", service);
  if (service.status === "critical") {
    addActivity(
      "service:status",
      "Service Disruption",
      `🔴 ${service.name} status changed to CRITICAL`,
      "critical",
      service
    );
  } else if (service.status === "healthy") {
    addActivity(
      "service:status",
      "Service Healthy",
      `🟢 ${service.name} status restored to HEALTHY`,
      "success",
      service
    );
  }
};

const emitKubernetesPod = (pod) => {
  if (io) io.emit("kubernetes:pod", pod);
  if (pod.isUnhealthy || pod.status === "CrashLoopBackOff") {
    addActivity(
      "kubernetes:pod",
      "Pod Degraded",
      `📦 Pod '${pod.name}' entered ${pod.status} (Restarts: ${pod.restarts})`,
      "critical",
      pod
    );
  } else if (pod.status === "Running") {
    addActivity(
      "kubernetes:pod",
      "Pod Running",
      `📦 Pod '${pod.name}' is Running (Ready: ${pod.ready})`,
      "info",
      pod
    );
  }
};

const emitKubernetesDeployment = (deployment) => {
  if (io) io.emit("kubernetes:deployment", deployment);
};

const getRecentActivities = () => {
  return recentActivities;
};

module.exports = {
  initializeSocket,
  getIO,
  emitIncidentCreated,
  emitIncidentUpdated,
  emitIncidentResolved,
  emitAlertFiring,
  emitAlertResolved,
  emitDeploymentStarted,
  emitDeploymentSuccess,
  emitDeploymentFailed,
  emitDeploymentRollback,
  emitServiceStatus,
  emitKubernetesPod,
  emitKubernetesDeployment,
  addActivity,
  getRecentActivities,
};
