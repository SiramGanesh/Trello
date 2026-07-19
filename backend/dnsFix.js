// Must be required BEFORE mongoose (or anything else that may resolve DNS),
// so the resolver swap is in place before any SRV lookup happens.
const dns = require("node:dns");

// Workaround: on Windows, the system DNS points to 127.0.0.1 (a local proxy
// from a VPN or router) which refuses SRV queries used by MongoDB Atlas
// (mongodb+srv://). Forcing a public resolver fixes the connection.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

module.exports = dns;
