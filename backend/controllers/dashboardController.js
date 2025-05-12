const DashboardModel = require('../models/dashboardModel');

async function getStats(req, res) {
  try {
    const stats = await DashboardModel.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
}

async function getCharts(req, res) {
  try {
    const chartData = await DashboardModel.getMonthlyCounts();
    res.json(chartData);
  } catch (err) {
    console.error("Error fetching chart data:", err);
    res.status(500).json({ error: "Failed to load chart data" });
  }
}

module.exports = {
  getStats,
  getCharts
};
