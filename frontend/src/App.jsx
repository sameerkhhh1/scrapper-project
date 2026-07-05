/**
 * App.jsx
 * --------
 * Top-level page component. State management ke liye yahan useState/useEffect
 * use kiya hai (Redux jaisa kuch nahi chahiye is scale ke app ke liye).
 *
 * Flow:
 *   1. Mount pe /timeline se clusters lao
 *   2. User cluster click kare -> uska detail fetch karke side panel mein dikhao
 *   3. User source filter toggle kare -> client-side filtering
 *   4. User "Refresh data" click kare -> ingest trigger + poll + timeline reload
 */

import { useEffect, useState, useMemo } from "react";
import Timeline from "./components/Timeline";
import ClusterDetail from "./components/ClusterDetail";
import SourceFilter from "./components/SourceFilter";
import RefreshButton from "./components/RefreshButton";
import { fetchTimeline, fetchClusterDetail } from "./services/api";
import "./App.css";

export default function App() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const [activeSources, setActiveSources] = useState([]);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTimeline();
      setClusters(data);

      // Pehli baar load hone pe sab sources by-default active rakho
      const allSources = [...new Set(data.flatMap((c) => c.sources || []))];
      setActiveSources((prev) => (prev.length === 0 ? allSources : prev));
    } catch (err) {
      console.error(err);
      setError("Timeline load nahi ho paayi. Backend chal raha hai check karo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const handleSelectCluster = async (clusterId) => {
    setSelectedClusterId(clusterId);
    try {
      const detail = await fetchClusterDetail(clusterId);
      setSelectedCluster(detail);
    } catch (err) {
      console.error("Cluster detail fetch failed:", err);
    }
  };

  const handleToggleSource = (source) => {
    setActiveSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  // Sirf woh clusters dikhao jinke sources mein se kam se kam ek active hai
  const filteredClusters = useMemo(
    () =>
      clusters.filter((c) => (c.sources || []).some((s) => activeSources.includes(s))),
    [clusters, activeSources]
  );

  const allSources = useMemo(
    () => [...new Set(clusters.flatMap((c) => c.sources || []))],
    [clusters]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>News Pulse</h1>
        <p className="subtitle">Topic-clustered news timeline</p>
        <RefreshButton onComplete={loadTimeline} />
      </header>

      <SourceFilter
        sources={allSources}
        activeSources={activeSources}
        onToggle={handleToggleSource}
      />

      {loading && <p className="status-message">Loading timeline...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && (
        <Timeline clusters={filteredClusters} onSelectCluster={handleSelectCluster} />
      )}

      {selectedClusterId && (
        <div className="detail-overlay">
          <ClusterDetail
            cluster={selectedCluster}
            onClose={() => {
              setSelectedClusterId(null);
              setSelectedCluster(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
