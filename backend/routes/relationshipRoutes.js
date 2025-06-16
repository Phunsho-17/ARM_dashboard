// backend/routes/relationship.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

router.post('/save', auth, async (req, res) => {
  try {
    const { cid, degree } = req.body;
    console.log('📥 Save Request:', req.body); // Add this line

    if (!cid || !degree) {
      return res.status(400).json({ message: 'CID and Degree are required' });
    }

    const client = new MongoClient(uri, { tls: true, tlsAllowInvalidCertificates: true });
    await client.connect();
    const db = client.db(dbName);

    await db.collection('relationship_data').insertOne({
      cid,
      degree,
      created_at: new Date()
    });

    await client.close();
    res.status(201).json({ message: 'Saved to relationship_data' });
  } catch (err) {
    console.error('Error saving to relationship_data:', err);
    res.status(500).json({ message: 'Error saving relationship data' });
  }
});

module.exports = router;
