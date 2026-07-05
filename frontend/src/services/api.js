/**
 * services/api.js
 * -----------------
 * Sab backend API calls yahan centralize hain. Components seedha axios/fetch
 * use nahi karte - woh isi service ke functions call karte hain. Isse:
 *   - Base URL ek jagah change karni padti hai
 *   - Agar kal API shape badle to sirf yahi file touch karni hai
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export async function fetchTimeline() {
  const res = await api.get("/timeline");
  return res.data;
}

export async function fetchClusters() {
  const res = await api.get("/clusters");
  return res.data;
}

export async function fetchClusterDetail(clusterId) {
  const res = await api.get(`/clusters/${clusterId}`);
  return res.data;
}

export async function triggerIngest() {
  const res = await api.post("/ingest/trigger");
  return res.data; // { jobId, status }
}

export async function fetchIngestStatus(jobId) {
  const res = await api.get(`/ingest/status/${jobId}`);
  return res.data; // { status, message, ... }
}

export default api;
