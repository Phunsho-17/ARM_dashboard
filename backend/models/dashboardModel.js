const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const mongoOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
};

async function getDashboardStats() {
  const client = new MongoClient(uri, mongoOptions);
  try {
    await client.connect();
    const db = client.db(dbName);
    const totalUsers = await db.collection('users').countDocuments();
    const relationshipsMapped = await db.collection('relationship_data').countDocuments();
    const aiAnalysis = await db.collection('analysis_data').countDocuments();

    return {
      totalUsers,
      relationshipsMapped,
      aiAnalysis
    };
  } finally {
    await client.close();
  }
}

async function getMonthlyCounts() {
  const client = new MongoClient(uri, mongoOptions);
  try {
    await client.connect();
    const db = client.db(dbName);

    // Aggregation for relationship_data
    const relationshipResults = await db.collection('relationship_data').aggregate([
      {
        $group: {
          _id: { $month: "$created_at" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();

    // Aggregation for analysis_data
    const analysisResults = await db.collection('analysis_data').aggregate([
      {
        $group: {
          _id: { $month: "$created_at" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();

    // Format: fill missing months with 0
    const relationshipCounts = new Array(12).fill(0);
    const aiAnalysisCounts = new Array(12).fill(0);

    relationshipResults.forEach(r => {
      relationshipCounts[r._id - 1] = r.count;
    });

    analysisResults.forEach(r => {
      aiAnalysisCounts[r._id - 1] = r.count;
    });

    return {
      relationshipCounts,
      aiAnalysisCounts
    };
  } finally {
    await client.close();
  }
}

module.exports = {
  getDashboardStats,
  getMonthlyCounts
};
