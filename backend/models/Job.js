/**
 * models/Job.js
 * --------------
 * Jab POST /ingest/trigger call hota hai, backend Python scraper ko
 * background mein subprocess ke through chalata hai (turant response nahi
 * de sakta kyunki scraping mein time lagta hai). Isliye ek "job" record
 * banate hain jise frontend baad mein poll karke check kar sakta hai
 * (GET /ingest/status/:jobId).
 */

const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "running", "done", "failed"],
    default: "pending",
  },
  message: { type: String, default: "" },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
});

module.exports = mongoose.model("Job", jobSchema);
