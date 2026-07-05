/**
 * controllers/clusterController.js
 * -----------------------------------
 * Controllers sirf HTTP handle karte hain: request padhna, service ko
 * call karna, response bhejna with sahi status code. Actual logic
 * services/ mein hai - isse controller thin aur testable rehta hai.
 */

const mongoose = require("mongoose");
const clusterService = require("../services/clusterService");

async function listClusters(req, res) {
  try {
    const clusters = await clusterService.getAllClustersSummary();
    res.status(200).json(clusters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clusters" });
  }
}

async function getClusterById(req, res) {
  const { id } = req.params;

  // Input validation - bad ObjectId se query crash nahi honi chahiye,
  // usse proper 400 milna chahiye instead of 500
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid cluster id" });
  }

  try {
    const cluster = await clusterService.getClusterDetail(id);
    if (!cluster) {
      return res.status(404).json({ error: "Cluster not found" });
    }
    res.status(200).json(cluster);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cluster detail" });
  }
}

async function getTimeline(req, res) {
  try {
    const timeline = await clusterService.getTimelineData();
    res.status(200).json(timeline);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch timeline data" });
  }
}

module.exports = { listClusters, getClusterById, getTimeline };
