const logService = require("../services/log.service");

const getLogs = async (req, res) => {
  try {
    const { serviceId, serviceName, level, query, limit, timeRange } = req.query;
    const result = await logService.queryLogs({
      serviceId,
      serviceName,
      level,
      query,
      limit,
      timeRange,
    });

    return res.status(200).json({
      success: true,
      data: result.logs,
      services: result.services,
      total: result.total,
      queriedAt: result.queriedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to query distributed logs",
      details: error.message,
    });
  }
};

module.exports = {
  getLogs,
};
