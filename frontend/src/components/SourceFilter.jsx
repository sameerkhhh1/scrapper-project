/**
 * components/SourceFilter.jsx
 * ------------------------------
 * User yahan se toggle kar sakta hai ki kaunse news sources timeline mein
 * dikhein. "sources" prop unique source names ki list hai (jo article data
 * se derive hoti hain - App.jsx mein).
 */

export default function SourceFilter({ sources, activeSources, onToggle }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="source-filter">
      <span className="filter-label">Sources:</span>
      {sources.map((source) => (
        <label key={source} className="filter-checkbox">
          <input
            type="checkbox"
            checked={activeSources.includes(source)}
            onChange={() => onToggle(source)}
          />
          {source}
        </label>
      ))}
    </div>
  );
}
