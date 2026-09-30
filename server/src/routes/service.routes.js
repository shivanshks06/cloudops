const express = require("express");
const {
  getServices,
  getService,
  createService,
  resetData,
  deleteService,
  getServiceIncidents,
  testProbe,
} = require("../controllers/service.controller");

const { optionalAuth, requireProject } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(optionalAuth);
router.use(requireProject);

router.get("/", getServices);
router.get("/flaky", (req, res) => {
  const random = Math.random();
  if (random < 0.33) {
    return res.status(500).json({ error: "Internal Server Error (Simulated)" });
  } else if (random < 0.66) {
    return setTimeout(() => res.status(200).json({ status: "Slow Response (Simulated)" }), 2000);
  }
  res.status(200).json({ status: "Healthy" });
});
router.get("/:id", getService);
router.get("/:id/incidents", getServiceIncidents);
router.post("/test-probe", testProbe);
router.post("/", createService);
router.post("/reset", resetData);
router.delete("/:id", deleteService);

module.exports = router;