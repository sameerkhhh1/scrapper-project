/**
 * routes/clusterRoutes.js
 * -------------------------
 * Sirf URL -> controller mapping. Koi logic yahan nahi hota.
 */

const express = require("express");
const router = express.Router();
const clusterController = require("../controllers/clusterController");

router.get("/clusters", clusterController.listClusters);
router.get("/clusters/:id", clusterController.getClusterById);
router.get("/timeline", clusterController.getTimeline);

module.exports = router;
