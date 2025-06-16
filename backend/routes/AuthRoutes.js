const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const User = require("../models/userModel")
const Audit = require("../models/AuditModel")
const auth = require("../middleware/auth")
const router = express.Router()

// Sign token
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" })

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.user._id}-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage })

// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
router.post("/", async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })
    }

    const token = signToken(user._id)

    res.json({ token })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// POST /api/auth/login - NEW LOGIN ROUTE
// POST /api/auth/login - ENHANCED LOGIN ROUTE WITH SPECIFIC ERROR MESSAGES
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  console.log("Login attempt:", { email, passwordProvided: !!password })

  try {
    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      console.log("User not found:", email)
      await Audit.create({ 
        email, 
        action: "LOGIN", 
        status: "FAILED",
        detail: "Email not found"
      })
      return res.status(401).json({ 
        message: "Email not found",
        type: "email_not_found"
      })
    }

    console.log("User found, comparing passwords...")
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      console.log("Password comparison failed")
      await Audit.create({ 
        email, 
        action: "LOGIN", 
        status: "FAILED",
        detail: "Incorrect password"
      })
      return res.status(401).json({ 
        message: "Incorrect password",
        type: "incorrect_password"
      })
    }

    const token = signToken(user._id)

    await Audit.create({
      email: user.email,
      username: user.username || "",
      department: user.department || "",
      action: "LOGIN",
      status: "Online",
      detail: "User logged in successfully",
    })

    console.log("Login successful for:", email)

    res.json({
      token,
      user: {
        email: user.email,
        username: user.username,
        contact: user.contact,
        department: user.department,
        profilePic: user.profilePic,
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ 
      message: "Server error. Please try again later.",
      type: "server_error"
    })
  }
})

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  const { _id, email, username, contact, department, profilePic } = req.user
  res.json({ _id, email, username, contact, department, profilePic })
})

// PUT /api/auth/me
router.put("/me", auth, async (req, res) => {
  const { username, email, contact, department, currentPassword, newPassword } = req.body

  try {
    const oldEmail = req.user.email
    const oldUsername = req.user.username

    // Check if the email is being updated and if it's already in use
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" })
      }
    }

    // Handle password change if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password" })
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, req.user.password)
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" })
      }

      // Hash new password
      req.user.password = await bcrypt.hash(newPassword, 12)

      // Log password change
      await Audit.create({
        email: req.user.email,
        username: req.user.username || "",
        department: req.user.department || "",
        action: "PASSWORD_CHANGE",
        status: "SUCCESS",
        detail: "Password changed successfully",
      })

      console.log("Password updated for user:", req.user.email)
    }

    // Update other fields
    req.user.username = username
    req.user.contact = contact
    req.user.department = department

    // Handle email update
    if (email && email !== oldEmail) {
      await Audit.create({
        email: oldEmail,
        username: oldUsername || "",
        department: req.user.department || "",
        action: "EMAIL_UPDATE",
        status: "SUCCESS",
        detail: `Email changed from ${oldEmail} to ${email}`,
      })

      req.user.email = email
    }

    // Save the updated user
    await req.user.save()
    console.log("User profile updated successfully")

    // Log general profile update
    await Audit.create({
      email: req.user.email,
      username: req.user.username || "",
      department: req.user.department || "",
      action: "PROFILE_UPDATE",
      status: "SUCCESS",
      detail: "Profile information updated",
    })

    // Issue new JWT token
    const token = signToken(req.user._id)

    res.json({
      token,
      email: req.user.email,
      username: req.user.username,
      contact: req.user.contact,
      department: req.user.department,
      profilePic: req.user.profilePic,
      message: "Profile updated successfully",
    })
  } catch (err) {
    console.error("Profile update error:", err)
    res.status(500).json({ message: "Failed to update profile" })
  }
})

// PUT /api/auth/me/picture
router.put("/me/picture", auth, upload.single("profilePic"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" })
  req.user.profilePic = "/uploads/" + req.file.filename
  await req.user.save()
  res.json({ profilePic: req.user.profilePic })
})

// PUT /api/auth/me/picture/remove
router.put("/me/picture/remove", auth, async (req, res) => {
  try {
    req.user.profilePic = "/image/default.png"
    await req.user.save()
    res.json({ profilePic: req.user.profilePic })
  } catch {
    res.status(500).json({ message: "Failed to reset profile picture" })
  }
})

// POST /api/auth/logout - ENHANCED LOGOUT ROUTE
router.post("/logout", auth, async (req, res) => {
  try {
    console.log("Logout request received for user:", req.user.email)

    await Audit.create({
      email: req.user.email,
      username: req.user.username || "",
      department: req.user.department || "",
      action: "LOGOUT",
      status: "Offline",
      detail: "User logged out successfully",
    })

    console.log("Logout logged successfully for:", req.user.email)
    res.status(200).json({ message: "Logout logged successfully" })
  } catch (error) {
    console.error("Logout audit failed:", error)
    res.status(500).json({ message: "Logout audit failed" })
  }
})

module.exports = router
