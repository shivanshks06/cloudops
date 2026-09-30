const express = require("express");
const { getPublicStatus, subscribeStatusUpdates } = require("../controllers/public.controller");

const router = express.Router();

// Public routes (Unauthenticated)
router.get("/status", getPublicStatus);
router.get("/status/:slug", getPublicStatus);
router.post("/subscribe", subscribeStatusUpdates);

module.exports = router;
