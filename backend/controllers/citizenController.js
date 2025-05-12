const CitizenModel = require('../models/citizenModel');

async function getCitizens(req, res) {
  try {
    const data = await CitizenModel.queryCitizens(req.query);
    res.json(data);
  } catch (err) {
    console.error("Error querying citizens:", err);
    res.status(500).json({ error: "Server Error" });
  }
}

async function getDzongkhags(req, res) {
  try {
    const data = await CitizenModel.getDzongkhags();
    res.json(data);
  } catch (err) {
    console.error("Error fetching dzongkhags:", err);
    res.status(500).json({ error: "Failed to fetch dzongkhags" });
  }
}

async function getGewogs(req, res) {
  try {
    const data = await CitizenModel.getGewogs(req.query.dzongkhag);
    res.json(data);
  } catch (err) {
    console.error("Error fetching gewogs:", err);
    res.status(500).json({ error: "Failed to fetch gewogs" });
  }
}

module.exports = {
  getCitizens,
  getDzongkhags,
  getGewogs,
};
