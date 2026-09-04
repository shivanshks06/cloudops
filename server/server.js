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

        const serviceRepository = require("./src/repositories/service.repository");
        const countRes = await pool.query("SELECT COUNT(*) FROM services");
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            console.log("Seeding default services for telemetry metrics...");
            await serviceRepository.create({
                name: "User Authentication API",
                description: "Handles user auth & JWT tokens",
                environment: "production",
                endpoint_url: "http://api:5000/health"
            });
            await serviceRepository.create({
                name: "Payment Gateway",
                description: "Processes billing and transactions",
                environment: "production",
                endpoint_url: "http://api:5000/health"
            });
            await serviceRepository.create({
                name: "Notification Engine",
                description: "Sends push notifications and emails",
                environment: "staging",
                endpoint_url: "http://api:5000/health"
            });
            await serviceRepository.create({
                name: "Search & Analytics",
                description: "Elasticsearch indexer",
                environment: "development",
                endpoint_url: "http://api:5000/health"
            });
        }

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