const incidentRepository = require("../repositories/incident.repository");
const incidentEventRepository = require("../repositories/incidentEvent.repository");
const incidentService = require("../services/incident.service");

const getIncidents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const incidents = await incidentRepository.findRecent(limit);
    const metrics = await incidentRepository.getIncidentMetrics();

    return res.status(200).json({
      success: true,
      data: incidents,
      metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch incidents",
      details: error.message,
    });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await incidentService.getIncidentDetails(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: "Incident not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch incident details",
      details: error.message,
    });
  }
};

const getIncidentEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const events = await incidentEventRepository.getEventsByIncidentId(id);

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch incident events",
      details: error.message,
    });
  }
};

const acknowledgeIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const acknowledgedBy = req.body.acknowledged_by || req.body.acknowledgedBy || "SRE Engineer";

    const incident = await incidentService.acknowledgeIncident(id, acknowledgedBy);

    return res.status(200).json({
      success: true,
      message: "Incident acknowledged successfully",
      data: incident,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedBy = req.body.resolved_by || req.body.resolvedBy || "SRE Engineer";

    const incident = await incidentService.manualResolveIncident(id, resolvedBy);

    return res.status(200).json({
      success: true,
      message: "Incident resolved successfully",
      data: incident,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getMetrics = async (req, res) => {
  try {
    const metrics = await incidentRepository.getIncidentMetrics();
    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to calculate incident metrics",
      details: error.message,
    });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  getIncidentEvents,
  acknowledgeIncident,
  resolveIncident,
  getMetrics,
};