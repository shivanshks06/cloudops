const userRepository = require("../repositories/user.repository");
const projectRepository = require("../repositories/project.repository");
const { hashPassword, comparePassword, signToken } = require("../utils/auth");
const logger = require("../config/logger");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists",
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    // Auto-create initial default project workspace
    const defaultProject = await projectRepository.create({
      userId: user.id,
      name: "My First Project",
      slug: "my-first-project",
      description: "Default workspace for monitoring websites and APIs",
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    logger.info({ userId: user.id, email: user.email }, "New user registered with default workspace");

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user,
      projects: [defaultProject],
      activeProject: defaultProject,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Signup error");
    res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const projects = await projectRepository.findByUserId(user.id);
    let activeProject = projects[0] || null;

    if (!activeProject) {
      activeProject = await projectRepository.create({
        userId: user.id,
        name: "My Workspace",
        slug: "my-workspace",
        description: "Primary workspace",
      });
      projects.push(activeProject);
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    logger.info({ userId: user.id }, "User logged in successfully");

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userProfile,
      projects,
      activeProject,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Login error");
    res.status(500).json({
      success: false,
      message: "Failed to log in",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const projects = await projectRepository.findByUserId(req.user.id);
    res.status(200).json({
      success: true,
      user: req.user,
      projects,
    });
  } catch (err) {
    logger.error({ err: err.message }, "Get user profile error");
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
    });
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
