const express = require("express");
const { getIncidents } = require("../controllers/incident.controller");

const router = express.Router();

router.get("/", getIncidents);

module.exports = router;