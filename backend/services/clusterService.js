/**
 * services/clusterService.js
 * ----------------------------
 * Yahan actual DB queries aur "business logic" hai. Controllers isko
 * call karte hain - controllers khud DB se directly baat nahi karte
 * (separation of concerns: controller = HTTP handling, service = logic).
 */

const Cluster = require("../models/Cluster");
const Article = require("../models/Article");

/**
 * Sab clusters ki summary list - label, article count, time range.
 * Timeline aur list dono views ke liye kaam aata hai.
 */
async function getAllClustersSummary() {
  const clusters = await Cluster.find().lean();

  const summaries = await Promise.all(
    clusters.map(async (cluster) => {
      const articles = await Article.find({ clusterId: cluster._id })
        .sort({ publishedAt: 1 })
        .lean();

      const timestamps = articles
        .map((a) => a.publishedAt)
        .filter(Boolean) // kuch articles ki date missing ho sakti hai
        .sort();

      // Unique sources is cluster mein - frontend "filter by source" feature
      // ke liye chahiye (agar user BBC uncheck kare aur cluster sirf BBC
      // articles se bana ho, to woh cluster hide ho jaana chahiye)
      const sources = [...new Set(articles.map((a) => a.source))];

      return {
        id: cluster._id,
        label: cluster.label,
        articleCount: articles.length,
        earliestArticle: timestamps[0] || null,
        latestArticle: timestamps[timestamps.length - 1] || null,
        sources,
      };
    })
  );

  return summaries;
}

/**
 * Ek cluster ka full detail - saare articles, chronologically sorted.
 */
async function getClusterDetail(clusterId) {
  const cluster = await Cluster.findById(clusterId).lean();
  if (!cluster) return null;

  const articles = await Article.find({ clusterId })
    .sort({ publishedAt: 1 })
    .lean();

  return { id: cluster._id, label: cluster.label, articles };
}

/**
 * Timeline-specific shape - charting library ko start/end timestamps
 * aur ek "intensity" metric chahiye hota hai, sirf raw list nahi.
 * intensity = article count (jitne zyada articles, utna "bada" topic).
 */
async function getTimelineData() {
  const summaries = await getAllClustersSummary();

  return summaries
    .filter((c) => c.earliestArticle && c.latestArticle) // date-less clusters skip
    .map((c) => ({
      id: c.id,
      label: c.label,
      start: c.earliestArticle,
      end: c.latestArticle,
      articleCount: c.articleCount,
      intensity: c.articleCount, // bigger cluster = bigger marker (frontend isko use karega)
      sources: c.sources,
    }));
}

module.exports = {
  getAllClustersSummary,
  getClusterDetail,
  getTimelineData,
};
