// routes/analysisRoutes.js
const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

// Middleware to verify token
const auth = require('../middleware/auth');

router.post('/save', auth, async (req, res) => {
  const { cid1, cid2, relation } = req.body;
  const user = req.user; // comes from auth middleware

  if (!cid1 || !cid2 || !relation) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    await db.collection('analysis_data').insertOne({
      cid1,
      cid2,
      relation,
      user: user.email,
      created_at: new Date()
    });

    res.json({ message: 'Saved successfully' });
  } catch (err) {
    console.error('Error saving analysis:', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
});

module.exports = router;
