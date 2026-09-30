const verifyJenkinsToken = (req, res, next) => {
  const expectedToken = process.env.CLOUDOPS_JENKINS_TOKEN || "jenkins_cloudops_secret_token_2026";
  
  // Extract token from Authorization header (Bearer <token>), X-Jenkins-Token header, or query param
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-jenkins-token"]) {
    token = req.headers["x-jenkins-token"];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // If request has Jenkins header or explicit webhook request, verify token
  if (token) {
    if (token !== expectedToken) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid Jenkins CI/CD token",
      });
    }
    return next();
  }

  // If no token provided on direct webhook route, reject if required
  if (req.path.includes("/webhook") || req.headers["user-agent"]?.includes("Jenkins")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Missing Authorization Bearer token",
    });
  }

  // Allow standard internal application requests from UI
  return next();
};

module.exports = {
  verifyJenkinsToken,
};
