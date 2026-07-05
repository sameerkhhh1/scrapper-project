/**
 * controllers/ingestController.js
 * ----------------------------------
 */

const mongoose = require("mongoose");
const ingestService = require("../services/ingestService");

async function triggerIngest(req, res) {
  try {
    const jobId = await ingestService.triggerIngestion();
    // 202 Accepted - kaam start ho gaya hai lekin abhi complete nahi hua
    res.status(202).json({ jobId, status: "running" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to trigger ingestion" });
  }
}

async function getIngestStatus(req, res) {
  const { jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ error: "Invalid job id" });
  }

  try {
    const job = await ingestService.getJobStatus(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.status(200).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch job status" });
  }
}

module.exports = { triggerIngest, getIngestStatus };
