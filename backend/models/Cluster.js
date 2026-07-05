/**
 * models/Cluster.js
 * ------------------
 * Ek cluster = ek topic group. label Python scraper ne generate kiya hota hai
 * (top shared keywords se). Articles is cluster se articleSchema.clusterId
 * ke through linked hain (reverse lookup - populate() karke).
 */

const mongoose = require("mongoose");

const clusterSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cluster", clusterSchema);
