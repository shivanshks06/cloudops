const serviceRepository = require("../repositories/service.repository");

const getAllServices = async (options = {}) => {
  return await serviceRepository.findAll(options);
};

const getServicesByProjectId = async (projectId) => {
  return await serviceRepository.findByProjectId(projectId);
};

const getServiceById = async (id) => {
  return await serviceRepository.findById(id);
};

const createService = async (data) => {
  return await serviceRepository.create(data);
};

const deleteById = async (id) => {
  return await serviceRepository.deleteById(id);
};

module.exports = {
  getAllServices,
  getServicesByProjectId,
  getServiceById,
  createService,
  deleteById,
};