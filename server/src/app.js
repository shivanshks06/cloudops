const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
const serviceRoutes = require("./routes/service.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const incidentRoutes = require("./routes/incident.routes");
const alertRoutes = require("./routes/alert.routes");
const metricRoutes = require("./routes/metric.routes");

app.use(cors());
app.use(express.json());
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/incidents", incidentRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/metrics", metricRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to CloudOps API"
    });
});

const healthRoutes = require("./routes/health.routes");

app.use("/health", healthRoutes);

module.exports = app;