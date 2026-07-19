const mongoose = require("mongoose");
const { MONGO_URL } = require("./config");

function connectDB() {
    mongoose.connect(MONGO_URL);

    mongoose.connection.on("connected", () => {
        console.log("MongoDB connected");
    });

    mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
    });
}

module.exports = {
    connectDB
};
