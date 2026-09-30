const express = require("express");
const {
  getOverview,
  getNodes,
  getPods,
  getPodByName,
  getDeployments,
  getServices,
  getHPA,
  getEvents,
  simulatePod,
} = require("../controllers/kubernetes.controller");

const router = express.Router();

router.get("/overview", getOverview);
router.get("/nodes", getNodes);
router.get("/pods", getPods);
router.get("/pods/:name", getPodByName);
router.post("/pods/:name/simulate", simulatePod);
router.get("/deployments", getDeployments);
router.get("/services", getServices);
router.get("/hpa", getHPA);
router.get("/events", getEvents);

module.exports = router;
