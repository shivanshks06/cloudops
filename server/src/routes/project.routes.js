const express = require("express");
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} = require("../controllers/project.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;
