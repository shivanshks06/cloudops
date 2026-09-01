const alertRepository = require("../repositories/alert.repository");

const getAlerts = async (req, res) => {
  try {
    const alerts = await alertRepository.getRecentAlerts();
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await alertRepository.acknowledgeAlert(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: "Alert not found or already resolved",
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error("Failed to acknowledge alert:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports = {
  getAlerts,
  acknowledgeAlert,
};
