const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  email: String,
  username: String,
  department: String,
  action: String,       // e.g., "AI Analysis", "Relationship Mapped", "Record Viewed"
  detail: String,       // 🆕 e.g., "Viewed on CID 123456789 and 1234567888"
  status: String,       // e.g., Online/Offline/SUCCESS/FAILURE
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditSchema);
