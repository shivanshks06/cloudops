const serviceService = require("../services/service.service");
const logger = require("../config/logger");

const getServices = async (req, res) => {
  try {
    const projectId = req.projectId || req.query.projectId;
    const services = projectId
      ? await serviceService.getServicesByProjectId(projectId)
      : await serviceService.getAllServices();

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    logger.error({ err: error.message }, "Get services error");
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};

const createService = async (req, res) => {
  try {
    const {
      name,
      description,
      environment,
      endpoint_url,
      project_id,
      projectId,
      monitor_type,
      http_method,
      expected_status_code,
      check_interval_seconds,
      timeout_ms,
      request_body,
      custom_headers,
      ssl_check_enabled,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    const pId = project_id || projectId || req.projectId || null;
    const uId = req.user?.id || null;

    const service = await serviceService.createService({
      projectId: pId,
      userId: uId,
      name: name.trim(),
      description: description ? description.trim() : null,
      environment: environment || "development",
      endpoint_url: endpoint_url ? endpoint_url.trim() : "http://localhost:5000/health",
      monitor_type: monitor_type || "external_url",
      http_method: (http_method || "GET").toUpperCase(),
      expected_status_code: expected_status_code ? parseInt(expected_status_code, 10) : 200,
      check_interval_seconds: check_interval_seconds ? parseInt(check_interval_seconds, 10) : 30,
      timeout_ms: timeout_ms ? parseInt(timeout_ms, 10) : 5000,
      request_body: request_body || null,
      custom_headers: custom_headers || {},
      ssl_check_enabled: ssl_check_enabled !== false,
    });

    res.status(201).json({
      success: true,
      message: "Monitor target created successfully",
      data: service,
    });
  } catch (error) {
    logger.error({ err: error.message }, "Create service error");
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create service",
    });
  }
};

const getService = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    logger.error({ err: error.message }, "Get service by id error");
    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
    });
  }
};

const resetData = async (req, res) => {
  try {
    const pool = require("../config/database");
    await pool.query("TRUNCATE TABLE services RESTART IDENTITY CASCADE");
    res.status(200).json({
      success: true,
      message: "All services and their related metrics, alerts, and incidents have been reset.",
    });
  } catch (error) {
    logger.error({ err: error.message }, "Reset data error");
    res.status(500).json({
      success: false,
      message: "Failed to reset data",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const deleted = await serviceService.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    logger.error({ err: error.message }, "Delete service error");
    res.status(500).json({ success: false, message: "Failed to delete service" });
  }
};

const incidentRepository = require("../repositories/incident.repository");

const getServiceIncidents = async (req, res) => {
  try {
    const incidents = await incidentRepository.findByServiceId(req.params.id);
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    logger.error({ err: error.message }, "Get service incidents error");
    res.status(500).json({ success: false, message: "Failed to fetch incidents" });
  }
};

const axios = require("axios");

const testProbe = async (req, res) => {
  const {
    endpoint_url,
    http_method = "GET",
    expected_status_code = 200,
    timeout_ms = 6000,
    request_body,
    custom_headers = {},
  } = req.body;

  if (!endpoint_url || !endpoint_url.trim()) {
    return res.status(400).json({ success: false, message: "Endpoint URL is required for testing" });
  }

  const start = Date.now();
  try {
    let headers = {
      "User-Agent": "CloudOps-Synthetic-Monitor/1.0 (+https://cloudops.dev)",
      Accept: "*/*",
      ...custom_headers,
    };

    let data = undefined;
    if (["POST", "PUT", "PATCH"].includes(http_method.toUpperCase()) && request_body) {
      try {
        data = typeof request_body === "string" ? JSON.parse(request_body) : request_body;
        headers["Content-Type"] = "application/json";
      } catch {
        data = request_body;
      }
    }

    const response = await axios({
      method: http_method.toUpperCase(),
      url: endpoint_url.trim(),
      headers,
      data,
      timeout: Math.min(parseInt(timeout_ms, 10) || 6000, 15000),
      validateStatus: () => true, // Don't throw on 4xx/5xx so we can report status accurately
      maxRedirects: 5,
    });

    const latency = Date.now() - start;
    const expected = parseInt(expected_status_code, 10) || 200;
    const isExpected = response.status === expected || (expected === 200 && response.status >= 200 && response.status < 400);

    return res.status(200).json({
      success: true,
      data: {
        is_expected: isExpected,
        status: response.status,
        status_text: response.statusText || "OK",
        latency_ms: latency,
        url: endpoint_url,
        method: http_method.toUpperCase(),
      },
    });
  } catch (error) {
    const latency = Date.now() - start;
    logger.warn({ url: endpoint_url, err: error.message }, "Test probe error");

    return res.status(200).json({
      success: false,
      data: {
        is_expected: false,
        status: error.code || "Network Error",
        status_text: error.message || "Failed to connect to target URL",
        latency_ms: latency,
        url: endpoint_url,
        method: http_method.toUpperCase(),
      },
    });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  resetData,
  deleteService,
  getServiceIncidents,
  testProbe,
};