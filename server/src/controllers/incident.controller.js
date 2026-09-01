const incidentRepository = require("../repositories/incident.repository");

const getIncidents = async (req, res) => {
  try {
    const incidents = await incidentRepository.findRecent();

    res.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports = {
  getIncidents,
};