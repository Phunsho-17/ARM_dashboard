// backend/middleware/auth.js
const jwt = require("jsonwebtoken")
const User = require("../models/userModel")

module.exports = async (req, res, next) => {
  try {
    const authHdr = req.headers.authorization || ""

    if (!authHdr.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" })
    }

    const token = authHdr.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Find user by ID from token
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    // Attach user to request object
    req.user = user
    next()
  } catch (error) {
    console.error("Auth middleware error:", error.message)

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" })
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" })
    }

    res.status(401).json({ message: "Unauthorized" })
  }
}
