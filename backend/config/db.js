/**
 * config/db.js
 * -------------
 * MongoDB se connect karne ka logic - server.js isko ek baar call karta hai
 * startup pe. Alag file mein rakha hai taaki connection logic aur
 * server-startup logic mix na ho (single responsibility).
 */

const mongoose = require("mongoose");
const dns = require("dns");

// Windows pe kai baar default DNS resolver "mongodb+srv://" URIs ke SRV
// records properly resolve nahi kar pata (querySrv ECONNREFUSED error).
// Google ka public DNS (8.8.8.8) use karne se yeh reliably fix ho jaata hai.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGO_DB_NAME || "newspulse";

  try {
    await mongoose.connect(uri, { dbName });
    console.log(`[DB] MongoDB connected -> ${dbName}`);
  } catch (err) {
    console.error("[DB] Connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;