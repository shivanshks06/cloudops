const express = require("express");
const {
  getDeployments,
  getDeploymentById,
  getDeploymentEvents,
  createDeployment,
  updateDeployment,
  rollbackDeployment,
  getMetrics,
} = require("../controllers/deployment.controller");
const { verifyJenkinsToken } = require("../middleware/jenkinsAuth");

const router = express.Router();

router.get("/", getDeployments);
router.get("/metrics", getMetrics);
router.get("/:id", getDeploymentById);
router.get("/:id/events", getDeploymentEvents);

// Jenkins CI/CD webhook and creation endpoints
router.post("/", verifyJenkinsToken, createDeployment);
router.post("/webhook", verifyJenkinsToken, createDeployment);
router.patch("/:id", verifyJenkinsToken, updateDeployment);
router.put("/:id", verifyJenkinsToken, updateDeployment);

// Rollback endpoint
router.post("/:id/rollback", rollbackDeployment);

module.exports = router;
