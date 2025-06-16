const mongoose = require('mongoose');
const User = require('./models/userModel');
const AuditLog = require('./models/AuditModel');
require('dotenv').config();  // If you are using dotenv to manage environment variables

async function removeInvalidLogs() {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });

    // Fetch all audit logs
    const auditLogs = await AuditLog.find();

    // Iterate over each audit log
    for (let log of auditLogs) {
      // Check if the email in the audit log exists in the users collection
      const userExists = await User.findOne({ email: log.email });

      // If the email does not exist, delete the audit log
      if (!userExists) {
        await AuditLog.deleteOne({ _id: log._id });
        console.log(`❌ Deleted log for unregistered email: ${log.email}`);
      }
    }

    console.log('✅ Invalid audit logs removed!');
    process.exit();
  } catch (err) {
    console.error('Error cleaning up invalid audit logs:', err);
    process.exit(1);
  }
}

removeInvalidLogs();
