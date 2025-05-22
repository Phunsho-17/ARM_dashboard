// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const citizenRoutes = require('./routes/citizenRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes'); // Add this line

// const app = express();
// const port = 5000;

// app.use(cors());

// // Route groups
// app.use('/api', citizenRoutes);
// app.use('/api/dashboard', dashboardRoutes); //  Mount dashboard routes

// app.listen(port, () => {
//   console.log(`Server running successfully at http://localhost:${port}`);
// });


require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');

const citizenRoutes = require('./routes/citizenRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (optional, e.g., frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'analysis.html'));
});



// Route groups
app.use('/api', citizenRoutes);
app.use('/api/dashboard', dashboardRoutes);

//  Custom /predict route
app.post('/predict', (req, res) => {
  const { cid1, cid2 } = req.body;
  const py = spawn('python', ['C:/Users/sonam/OneDrive/Desktop/Acc_Dashboard/predict.py', cid1, cid2]);

  let result = '';
  let errorOutput = '';

  py.stdout.on('data', (data) => {
    result += data.toString();
    console.log("Python STDOUT:", data.toString());
  });

  py.stderr.on('data', (err) => {
    errorOutput += err.toString();
    console.error('Python STDERR:', err.toString());
  });

  py.on('close', () => {
    if (errorOutput) {
      return res.status(500).json({ error: 'Python error', details: errorOutput });
    }
    try {
      res.json(JSON.parse(result));
    } catch (err) {
      console.error('Failed to parse JSON:', result);
      res.status(500).json({ error: 'Failed to parse prediction result', raw: result });
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running successfully at http://localhost:${port}`);
});