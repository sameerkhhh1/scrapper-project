/**
 * server.js
 * ----------
 * Backend ka entry point. Yahan bas:
 *   - Express app setup
 *   - Middleware (cors, json parsing)
 *   - Routes mount karna
 *   - DB connect karke server start karna
 * Koi business logic yahan nahi honi chahiye - woh sab services/ mein hai.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
console.log(process.env.MONGO_URI);
const connectDB = require("./config/db");
const clusterRoutes = require("./routes/clusterRoutes");
const ingestRoutes = require("./routes/ingestRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Simple health check - deployment platforms (Render/Railway) isko
// aksar use karte hain "is service up hai?" check karne ke liye
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/", clusterRoutes);
app.use("/", ingestRoutes);

// Catch-all 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler - agar kisi middleware/route mein uncaught error aaye
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
});
