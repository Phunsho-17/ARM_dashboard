const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const mongoOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
};

async function queryCitizens(filters) {
  const client = new MongoClient(uri, mongoOptions);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('branch_data');

    const query = {};
    if (filters.dzongkhag) query["DZONGKHAG"] = filters.dzongkhag;
    if (filters.gewog) query["GEWOG"] = filters.gewog;
    if (filters.household && !isNaN(filters.household)) {
      query["HOUSEHOLD ID"] = Number(filters.household);
    }

    return await collection.find(query, { projection: { _id: 0 } }).toArray();
  } finally {
    await client.close();
  }
}

async function getDzongkhags() {
  const client = new MongoClient(uri, mongoOptions);
  try {
    await client.connect();
    const db = client.db(dbName);
    return await db.collection('branch_data').distinct('DZONGKHAG');
  } finally {
    await client.close();
  }
}

async function getGewogs(dzongkhag) {
  const client = new MongoClient(uri, mongoOptions);
  try {
    await client.connect();
    const db = client.db(dbName);
    const filter = {};
    if (dzongkhag) {
      filter["DZONGKHAG"] = { $regex: `^${dzongkhag.trim()}$`, $options: 'i' };
    }
    return await db.collection('branch_data').distinct('GEWOG', filter);
  } finally {
    await client.close();
  }
}

module.exports = {
  queryCitizens,
  getDzongkhags,
  getGewogs,
};
