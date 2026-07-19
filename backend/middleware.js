const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

function authMiddleware(req, res, next) {
    // Support both Authorization header (Bearer token) and custom token header
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.headers.token;

    if (!token) {
        return res.status(403).json({
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        if (userId) {
            req.userId = userId;
            next();
        } else {
            res.status(403).json({
                message: "Token was incorrect"
            });
        }
    } catch (err) {
        res.status(403).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = {
    authMiddleware
};
