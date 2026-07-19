const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Organization", organizationSchema);
