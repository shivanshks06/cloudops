const express = require("express");
const { getAlerts, acknowledgeAlert } = require("../controllers/alert.controller");

const router = express.Router();

router.get("/", getAlerts);
router.post("/:id/acknowledge", acknowledgeAlert);

module.exports = router;
