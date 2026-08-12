const express = require("express");

const app = express();

// Middleware
const serviceRoutes = require("./routes/service.routes");

app.use(express.json());
app.use("/api/v1/services", serviceRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to CloudOps API"
    });
});

const healthRoutes = require("./routes/health.routes");

app.use("/health", healthRoutes);

module.exports = app;