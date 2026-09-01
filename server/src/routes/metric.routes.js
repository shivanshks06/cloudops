const express = require("express");
const { getMetrics } = require("../controllers/metric.controller");

const router = express.Router();

router.get("/:id", getMetrics);

module.exports = router;