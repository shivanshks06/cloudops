const express = require("express");
const { getLogs } = require("../controllers/log.controller");
const { optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(optionalAuth);
router.get("/", getLogs);

module.exports = router;
