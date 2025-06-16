require("dotenv").config()
const connectDB = require("./config/db")
const bcrypt = require("bcryptjs")
const User = require("./models/userModel")

async function seed() {
  await connectDB()

  const users = [
    {
      email: "admin123@gmail.com",
      password: "admin123", // Plain password - will be hashed below
      username: "Administrator",
      contact: "+97517000000",
      department: "IT",
    },
    {
      email: "kinzang@gmail.com",
      password: "kinzang123", // Plain password - will be hashed below
      username: "Tandin",
      contact: "+97517111111",
      department: "Investigation",
    },
  ]

  for (const userData of users) {
    // Check if the user already exists by email
    const existingUser = await User.findOne({ email: userData.email })

    if (existingUser) {
      // Update existing user
      existingUser.username = userData.username
      existingUser.contact = userData.contact
      existingUser.department = userData.department
      existingUser.password = await bcrypt.hash(userData.password, 12) // Hash the password

      await existingUser.save()
      console.log(`✅ Updated user: ${userData.email}`)
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      await User.create({
        ...userData,
        password: hashedPassword,
      })
      console.log(`✅ Created new user: ${userData.email}`)
    }
  }

  console.log("Seeding completed!")
  process.exit()
}

seed().catch((err) => {
  console.error("Seeding error:", err)
  process.exit(1)
})
