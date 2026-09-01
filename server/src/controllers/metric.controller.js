const metricRepository = require("../repositories/metric.repository");

const getMetrics = async (
  req,
  res
) => {
  const { id } = req.params;

  const metrics =
    await metricRepository.getServiceMetrics(id);

  res.json({
    success: true,
    data: metrics,
  });
};

module.exports = {
  getMetrics,
};