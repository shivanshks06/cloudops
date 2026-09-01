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

const resetData = async (req, res) => {
    try {
        const pool = require("../config/database");
        await pool.query("TRUNCATE TABLE services RESTART IDENTITY CASCADE");
        res.status(200).json({
            success: true,
            message: "All services and their related metrics, alerts, and incidents have been reset.",
        });
    } catch (error) {
        console.error("Reset data error:", error);
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
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete service" });
    }
};

const incidentRepository = require("../repositories/incident.repository");

const getServiceIncidents = async (req, res) => {
    try {
        const incidents = await incidentRepository.findByServiceId(req.params.id);
        res.status(200).json({ success: true, data: incidents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch incidents" });
    }
};

module.exports = {
    getServices,
    getService,
    createService,
    resetData,
    deleteService,
    getServiceIncidents,
};