require("./dnsFix");
require("dotenv").config({ path: "../.env" });
const express = require("express");
const { connectDB } = require("./db");
const endpoints = require("./endpoints");

const app = express();
app.use(express.json());

// Permissive CORS for local dev. Tighten in production.
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, token, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

connectDB();

app.use("/", endpoints);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
