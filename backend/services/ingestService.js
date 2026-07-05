/**
 * services/ingestService.js
 * ---------------------------
 * Python scraper ko subprocess ke through chalane ka logic.
 * Job turant complete nahi hota (RSS fetch + article scraping mein time
 * lagta hai), isliye hum:
 *   1. Ek Job record "pending" status ke saath banate hain
 *   2. Python process ko background mein spawn karte hain (await nahi karte)
 *   3. Turant jobId return kar dete hain controller ko
 *   4. Process khatam hone pe job ka status "done"/"failed" update kar dete hain
 *
 * Frontend GET /ingest/status/:jobId poll karke pata karta hai kab ready hai.
 */

const { spawn } = require("child_process");
const path = require("path");
const Job = require("../models/Job");

async function triggerIngestion() {
  const job = await Job.create({ status: "pending" });

  const scriptPath = process.env.PYTHON_SCRIPT_PATH || "../scraper/main.py";
  const pythonExe = process.env.PYTHON_EXECUTABLE || "python3";
  const resolvedPath = path.resolve(__dirname, "..", scriptPath);

  job.status = "running";
  await job.save();

  // Background mein chalao - controller ko block nahi karna response dene ke liye
  const child = spawn(pythonExe, [resolvedPath]);

  let stderrOutput = "";
  child.stderr.on("data", (data) => {
    stderrOutput += data.toString();
  });

  child.stdout.on("data", (data) => {
    console.log(`[scraper] ${data.toString().trim()}`);
  });

  child.on("close", async (code) => {
    if (code === 0) {
      job.status = "done";
      job.message = "Ingestion completed successfully.";
    } else {
      job.status = "failed";
      job.message = stderrOutput || `Process exited with code ${code}`;
    }
    job.finishedAt = new Date();
    await job.save();
  });

  child.on("error", async (err) => {
    // e.g. python3 hi nahi mila system pe
    job.status = "failed";
    job.message = `Failed to start scraper: ${err.message}`;
    job.finishedAt = new Date();
    await job.save();
  });

  return job._id;
}

async function getJobStatus(jobId) {
  return Job.findById(jobId).lean();
}

module.exports = { triggerIngestion, getJobStatus };
