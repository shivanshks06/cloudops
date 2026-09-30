const express = require("express");
const {
  getIncidents,
  getIncidentById,
  getIncidentEvents,
  acknowledgeIncident,
  resolveIncident,
  getMetrics,
} = require("../controllers/incident.controller");

const router = express.Router();

router.get("/", getIncidents);
router.get("/metrics", getMetrics);
router.get("/:id", getIncidentById);
router.get("/:id/events", getIncidentEvents);
router.post("/:id/acknowledge", acknowledgeIncident);
router.post("/:id/resolve", resolveIncident);

module.exports = router;