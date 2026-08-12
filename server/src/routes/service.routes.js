const express = require("express");

const {
    getServices,
    getService,
    createService,
} = require("../controllers/service.controller");

const router = express.Router();

router.get("/", getServices);
router.get("/:id", getService);
router.post("/", createService);

module.exports = router;