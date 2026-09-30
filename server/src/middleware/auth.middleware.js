const { verifyToken } = require("../utils/auth");
const userRepository = require("../repositories/user.repository");
const projectRepository = require("../repositories/project.repository");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const user = await userRepository.findById(decoded.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  req.user = user;
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await userRepository.findById(decoded.id);
      if (user) req.user = user;
    }
  }

  next();
};

const requireProject = async (req, res, next) => {
  const projectId =
    req.headers["x-project-id"] ||
    req.query.projectId ||
    req.params.projectId ||
    req.body.project_id ||
    req.body.projectId;

  if (!projectId) {
    // If no project specified, proceed with null (fallback to global or all projects for user)
    req.projectId = null;
    return next();
  }

  const parsedId = parseInt(projectId, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ success: false, message: "Invalid project ID" });
  }

  if (req.user) {
    const hasAccess = await projectRepository.userHasAccess(parsedId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project workspace",
      });
    }
  }

  req.projectId = parsedId;
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireProject,
};
