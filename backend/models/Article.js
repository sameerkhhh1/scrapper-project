/**
 * models/Article.js
 * ------------------
 * Yeh schema Python scraper ke insert kiye documents se match karta hai
 * (dekho scraper/db.py -> insert_article). Field names same rakhe hain
 * (source, title, summary, body, link, publishedAt, clusterId) taaki
 * dono taraf se same data padha/likha ja sake.
 */

const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    body: { type: String, default: "" },
    link: { type: String, required: true, unique: true }, // dedupe yahin se hoti hai
    publishedAt: { type: String }, // ISO string, scraper se aata hai
    clusterId: { type: mongoose.Schema.Types.ObjectId, ref: "Cluster", default: null },
  },
  { timestamps: true } // createdAt/updatedAt auto add ho jaayega
);

module.exports = mongoose.model("Article", articleSchema);
