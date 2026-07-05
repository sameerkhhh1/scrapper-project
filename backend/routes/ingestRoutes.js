/**
 * routes/ingestRoutes.js
 * ------------------------
 */

const express = require("express");
const router = express.Router();
const ingestController = require("../controllers/ingestController");

router.post("/ingest/trigger", ingestController.triggerIngest);
router.get("/ingest/status/:jobId", ingestController.getIngestStatus);

module.exports = router;
