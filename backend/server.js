require('dotenv').config();
const express = require('express');
const cors = require('cors');
const citizenRoutes = require('./routes/citizenRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // Add this line

const app = express();
const port = 5000;

app.use(cors());

// Route groups
app.use('/api', citizenRoutes);
app.use('/api/dashboard', dashboardRoutes); //  Mount dashboard routes

app.listen(port, () => {
  console.log(`Server running successfully at http://localhost:${port}`);
});
