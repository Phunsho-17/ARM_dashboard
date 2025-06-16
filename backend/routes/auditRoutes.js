const express = require("express")
const jwt = require("jsonwebtoken")
const AuditLog = require("../models/AuditModel")
const User = require("../models/userModel")
const router = express.Router()

// 🔍 GET /api/audit — Show latest status (Online/Offline) per user with optional email filter
router.get("/", async (req, res) => {
  try {
    const { email } = req.query // Get email from query string
    const query = {}

    if (email) {
      query.email = email // If email is provided, filter by it
    }

    // Get all current users from the users collection
    const currentUsers = await User.find({}, "email username department")

    // Create a map of current user data
    const userMap = new Map()
    currentUsers.forEach((user) => {
      userMap.set(user.email, {
        username: user.username,
        department: user.department,
      })
    })

    // Get the latest audit log for each current user
    const logs = []

    for (const user of currentUsers) {
      const latestLog = await AuditLog.findOne({
        email: user.email,
      }).sort({ timestamp: -1 })

      if (latestLog) {
        logs.push({
          _id: user.email,
          email: user.email,
          username: user.username,
          department: user.department,
          timestamp: latestLog.timestamp,
          action: "View More",
          status: latestLog.action === "LOGIN" ? "Online" : "Offline",
        })
      } else {
        // If no audit log exists, create a default entry
        logs.push({
          _id: user.email,
          email: user.email,
          username: user.username,
          department: user.department,
          timestamp: new Date(),
          action: "View More",
          status: "Offline",
        })
      }
    }

    // Sort by timestamp (most recent first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // If filtering by email, only return matching entries
    if (email) {
      const filteredLogs = logs.filter((log) => log.email === email)
      return res.json(filteredLogs)
    }

    res.json(logs)
  } catch (err) {
    console.error("Error in GET /api/audit:", err)
    res.status(500).json({ message: "Error fetching audit logs" })
  }
})

// 📄 GET /api/audit/user/:email — All logs for a specific user
router.get("/user/:email", async (req, res) => {
  const { email } = req.params
  try {
    const logs = await AuditLog.find({ email }).sort({ timestamp: -1 })
    res.json(logs)
  } catch (err) {
    console.error("Error in GET /api/audit/user/:email:", err)
    res.status(500).json({ message: "Error fetching user audit logs" })
  }
})

// ✅ POST /api/audit — Add custom audit entry (used by frontend)
router.post("/", async (req, res) => {
  try {
    const { action, detail } = req.body
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ message: "No token provided" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) return res.status(404).json({ message: "User not found" })

    await AuditLog.create({
      email: user.email,
      username: user.username,
      department: user.department,
      action,
      status: "Online",
      detail: detail || "",
    })

    res.status(201).json({ message: "Audit log saved" })
  } catch (err) {
    console.error("Error in POST /api/audit:", err)
    res.status(500).json({ message: "Failed to save audit log" })
  }
})

module.exports = router
