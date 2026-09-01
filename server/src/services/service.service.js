const serviceRepository = require("../repositories/service.repository");

const getAllServices = async () => {
    return await serviceRepository.findAll();
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
    getServiceById,
    createService,
    deleteById,
};