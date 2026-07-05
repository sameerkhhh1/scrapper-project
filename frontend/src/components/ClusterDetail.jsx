/**
 * components/ClusterDetail.jsx
 * -------------------------------
 * Jab timeline pe koi cluster click hota hai, uske sab articles yahan
 * dikhte hain - headline, source, published time, aur original article
 * ka link.
 */

export default function ClusterDetail({ cluster, loading, onClose }) {
  if (loading) {
    return (
      <div className="cluster-detail loading">
        <div className="spinner"></div>
        <p>Loading articles...</p>
      </div>
    );
  }

  if (!cluster) return null;

  return (
    <div className="cluster-detail">
      <div className="cluster-detail-header">
        <h2>{cluster.label}</h2>
        <button onClick={onClose} className="close-btn" aria-label="Close">
          ✕
        </button>
      </div>

      <p className="article-count">{cluster.articles.length} articles</p>

      <ul className="article-list">
        {cluster.articles.map((article) => (
          <li key={article._id} className="article-item">
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
            <div className="article-meta">
              <span className="source-tag">{article.source}</span>
              <span>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleString()
                  : "Date unknown"}
              </span>
            </div>
            {article.summary && (
              <p className="article-summary">{article.summary}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
