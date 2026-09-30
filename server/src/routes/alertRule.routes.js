const express = require("express");
const {
  getAlertRules,
  createAlertRule,
  deleteAlertRule,
} = require("../controllers/alertRule.controller");
const { authenticateToken, requireProject } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticateToken);
router.use(requireProject);

router.get("/", getAlertRules);
router.post("/", createAlertRule);
router.delete("/:id", deleteAlertRule);

module.exports = router;
