const express = require("express");
const { receiveAlertmanagerWebhook } = require("../controllers/alertmanager.controller");

const router = express.Router();

router.post("/", receiveAlertmanagerWebhook);

module.exports = router;
