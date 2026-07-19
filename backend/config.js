module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || "attlasiationsupersecret123123password",
    MONGO_URL: process.env.MONGO_URL || "mongodb://localhost:27017/trello"
};
