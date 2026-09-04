require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/database");
const { checkServicesHealth } = require("./src/jobs/healthChecker");
const { register } = require("./src/config/prometheus");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");
        console.log("PostgreSQL connected successfully");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`CloudOps API running on port ${PORT}`);
        });

        app.get("/metrics", async (req, res) => {
            res.set("Content-Type", register.contentType);
            res.end(await register.metrics());
        });

        // Run health check job every 30 seconds
        setInterval(checkServicesHealth, 30000);

        // Run health check immediately on startup
        await checkServicesHealth().catch(err => {
            console.error("Initial health check failed:", err.message);
        });

    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

startServer();