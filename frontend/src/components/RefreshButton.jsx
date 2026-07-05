/**
 * components/RefreshButton.jsx
 * -------------------------------
 * "Refresh data" button:
 *   1. POST /ingest/trigger call karta hai -> jobId milta hai
 *   2. Har 3 second mein GET /ingest/status/:jobId poll karta hai
 *   3. Jab status "done" ho jaaye, parent ko batata hai (onComplete)
 *      taaki woh timeline refresh kar sake
 */

import { useState, useRef } from "react";
import { triggerIngest, fetchIngestStatus } from "../services/api";

const POLL_INTERVAL_MS = 3000;

export default function RefreshButton({ onComplete }) {
  const [status, setStatus] = useState("idle"); // idle | running | done | failed
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleClick = async () => {
    setStatus("running");
    try {
      const { jobId } = await triggerIngest();

      pollRef.current = setInterval(async () => {
        try {
          const job = await fetchIngestStatus(jobId);

          if (job.status === "done") {
            stopPolling();
            setStatus("done");
            onComplete(); // parent isse timeline data re-fetch karega
          } else if (job.status === "failed") {
            stopPolling();
            setStatus("failed");
            console.error("Ingestion failed:", job.message);
          }
          // agar "running" hai to bas poll karte rehna hai
        } catch (err) {
          stopPolling();
          setStatus("failed");
          console.error("Status poll failed:", err);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setStatus("failed");
      console.error("Trigger failed:", err);
    }
  };

  const labels = {
    idle: "Refresh data",
    running: "Refreshing... (scraping in progress)",
    done: "Refreshed ✓",
    failed: "Failed - try again",
  };

  return (
    <button
      className={`refresh-btn refresh-btn--${status}`}
      onClick={handleClick}
      disabled={status === "running"}
    >
      {labels[status]}
    </button>
  );
}
