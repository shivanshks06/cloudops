const serviceService = require("../services/service.service");

const getServices = async (req, res) => {
    try {
        const services = await serviceService.getAllServices();

        res.status(200).json({
            success: true,
            data: services,
        });
    } catch (error) {
        console.error(error);

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
        } = req.body;

        const service = await serviceService.createService({
            name,
            description,
            environment,
            endpoint_url,
        });

        res.status(201).json({
            success: true,
            data: service,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create service",
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
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch service",
        });
    }
};

module.exports = {
    getServices,
    getService,
    createService,
};