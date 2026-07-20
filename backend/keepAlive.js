// Keep-alive pinger: prevents Render free-tier services from spinning down
// after 15 minutes of inactivity. Hits both the backend and the frontend
// every 14 minutes.
//
// Render free Web Services spin down after 15 min of no inbound HTTP traffic.
// Render free Static Sites do NOT spin down, but we still ping the frontend
// URL as a no-op so a single ping cycle keeps the whole app warm.
//
// In production (Render sets NODE_ENV=production), the backend starts this
// pinger automatically. Locally it's a no-op so you don't spam yourself.

const https = require("https");
const http = require("http");

// URLs to ping. Set these in Render's environment variables:
//   KEEPALIVE_BACKEND_URL  - https://<your-backend>.onrender.com/health
//   KEEPALIVE_FRONTEND_URL - https://<your-frontend>.onrender.com
// If unset, pinging is skipped (safe for local dev).
const BACKEND_URL = process.env.KEEPALIVE_BACKEND_URL;
const FRONTEND_URL = process.env.KEEPALIVE_FRONTEND_URL;

const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

function ping(url) {
    if (!url) return;

    const client = url.startsWith("https") ? https : http;
    const start = Date.now();

    const req = client.get(url, (res) => {
        // Drain the response so the socket can be reused / closed cleanly
        res.on("data", () => {});
        res.on("end", () => {
            const ms = Date.now() - start;
            console.log(`[keep-alive] ${url} -> ${res.statusCode} (${ms}ms)`);
        });
    });

    req.on("error", (err) => {
        // Don't crash the server on a single failed ping — just log it.
        console.warn(`[keep-alive] ping failed for ${url}: ${err.message}`);
    });

    // 10s timeout so a hung Render cold-start doesn't pile up timers
    req.setTimeout(10_000, () => {
        req.destroy(new Error("ping timed out"));
    });
}

function pingAll() {
    ping(BACKEND_URL);
    ping(FRONTEND_URL);
}

function startKeepAlive() {
    if (process.env.NODE_ENV !== "production") {
        console.log("[keep-alive] disabled in non-production environment");
        return;
    }
    if (!BACKEND_URL && !FRONTEND_URL) {
        console.log("[keep-alive] no URLs configured, skipping");
        return;
    }

    console.log(
        `[keep-alive] starting (interval=${INTERVAL_MS / 1000}s) ` +
        `backend=${BACKEND_URL || "(none)"} frontend=${FRONTEND_URL || "(none)"}`
    );

    // First ping after 1 minute so the service is fully up and routes are mounted
    setTimeout(pingAll, 60 * 1000);
    // Then every 14 minutes
    setInterval(pingAll, INTERVAL_MS);
}

module.exports = { startKeepAlive };
