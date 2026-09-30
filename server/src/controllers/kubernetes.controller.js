const kubernetesService = require("../services/kubernetes.service");

const getOverview = async (req, res) => {
  try {
    const overview = await kubernetesService.getClusterOverview();
    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Kubernetes cluster overview",
      details: error.message,
    });
  }
};

const getNodes = async (req, res) => {
  try {
    const nodes = await kubernetesService.getNodes();
    return res.status(200).json({
      success: true,
      data: nodes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Kubernetes nodes",
      details: error.message,
    });
  }
};

const getPods = async (req, res) => {
  try {
    const { namespace } = req.query;
    const pods = await kubernetesService.getPods({ namespace });
    return res.status(200).json({
      success: true,
      data: pods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Kubernetes pods",
      details: error.message,
    });
  }
};

const getPodByName = async (req, res) => {
  try {
    const { name } = req.params;
    const pod = await kubernetesService.getPodByName(name);

    if (!pod) {
      return res.status(404).json({
        success: false,
        error: `Pod '${name}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: pod,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pod details",
      details: error.message,
    });
  }
};

const getDeployments = async (req, res) => {
  try {
    const { namespace } = req.query;
    const deployments = await kubernetesService.getDeployments({ namespace });
    return res.status(200).json({
      success: true,
      data: deployments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Kubernetes deployments",
      details: error.message,
    });
  }
};

const getServices = async (req, res) => {
  try {
    const { namespace } = req.query;
    const services = await kubernetesService.getServices({ namespace });
    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Kubernetes services",
      details: error.message,
    });
  }
};

const getHPA = async (req, res) => {
  try {
    const hpa = await kubernetesService.getHPA();
    return res.status(200).json({
      success: true,
      data: hpa,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch HPA metrics",
      details: error.message,
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await kubernetesService.getEvents();
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Kubernetes cluster events",
      details: error.message,
    });
  }
};

const simulatePod = async (req, res) => {
  try {
    const { name } = req.params;
    const { status = "CrashLoopBackOff" } = req.body;
    const pod = await kubernetesService.simulatePodState(name, status);

    return res.status(200).json({
      success: true,
      message: `Pod ${name} status set to ${status}`,
      data: pod,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getOverview,
  getNodes,
  getPods,
  getPodByName,
  getDeployments,
  getServices,
  getHPA,
  getEvents,
  simulatePod,
};
