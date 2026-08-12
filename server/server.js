require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/database");



const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");

        console.log("PostgreSQL connected successfully");

        app.listen(PORT, () => {
            console.log(`CloudOps API running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudOps API running on port ${PORT}`);
});

startServer();