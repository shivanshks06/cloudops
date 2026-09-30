const express = require("express");
const {
  getIncidents,
  getIncidentById,
  getIncidentEvents,
  acknowledgeIncident,
  resolveIncident,
  getMetrics,
  getAIDiagnosis,
  executeRemediation,
} = require("../controllers/incident.controller");

const router = express.Router();

router.get("/", getIncidents);
router.get("/metrics", getMetrics);
router.get("/:id", getIncidentById);
router.get("/:id/events", getIncidentEvents);
router.get("/:id/ai-diagnose", getAIDiagnosis);
router.post("/:id/ai-diagnose", getAIDiagnosis);
router.post("/:id/ai-remediate", executeRemediation);
router.post("/:id/acknowledge", acknowledgeIncident);
router.post("/:id/resolve", resolveIncident);

module.exports = router;