const express = require("express");
const cors = require("cors");

const pinoHttp = require("pino-http");
const logger = require("./config/logger");

const app = express();

// Structured Logging Middleware
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/metrics" || req.url === "/health",
    },
  })
);

// Middleware
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const alertRuleRoutes = require("./routes/alertRule.routes");
const serviceRoutes = require("./routes/service.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const incidentRoutes = require("./routes/incident.routes");
const alertRoutes = require("./routes/alert.routes");
const metricRoutes = require("./routes/metric.routes");
const alertmanagerRoutes = require("./routes/alertmanager.routes");
const deploymentRoutes = require("./routes/deployment.routes");
const kubernetesRoutes = require("./routes/kubernetes.routes");

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/v1/alert-rules", alertRuleRoutes);
app.use("/api/alert-rules", alertRuleRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/v1/incidents", incidentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/v1/deployments", deploymentRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/v1/kubernetes", kubernetesRoutes);
app.use("/api/kubernetes", kubernetesRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/v1/metrics", metricRoutes);
app.use("/api/metrics", metricRoutes);
app.use("/api/alertmanager", alertmanagerRoutes);
app.use("/api/v1/alertmanager", alertmanagerRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to CloudOps API"
    });
});

const healthRoutes = require("./routes/health.routes");
const { register } = require("./config/prometheus");

app.use("/health", healthRoutes);

app.get("/metrics", async (req, res) => {
    try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

module.exports = app;