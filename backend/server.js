require('dotenv').config();
const express   = require('express');
const path      = require('path');
const cors      = require('cors');
const { spawn } = require('child_process');

// 1) Connect to MongoDB Atlas
const connectDB = require('./config/db');
connectDB();

// 2) Route imports
const relationshipRoutes = require('./routes/relationshipRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const authRoutes      = require('./routes/AuthRoutes');
const citizenRoutes   = require('./routes/citizenRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const tokenRoutes     = require('./routes/tokenRoutes');
const auditRoutes     = require('./routes/auditRoutes'); // ✅ added

const app = express();
const port = 5000;

// 3) Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4) Static asset routes
app.use('/css',     express.static(path.join(__dirname, '../css')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/images',  express.static(path.join(__dirname, '../frontend/images')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve default entry
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 5) API route mounting
app.use('/api/auth',      authRoutes);
app.use('/api',           citizenRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api',           tokenRoutes);
app.use('/api/audit',     auditRoutes); // ✅ mount audit log route
app.use('/api/analysis', analysisRoutes);
app.use('/api/relationship', relationshipRoutes);

// 6) Existing /predict route
app.post('/predict', (req, res) => {
  const { cid1, cid2 } = req.body;
  const py = spawn('python', [path.join(__dirname, '../predict.py'), cid1, cid2]);


  let result = '';
  let errorOutput = '';

  py.stdout.on('data', data => {
    result += data.toString();
    console.log('Python STDOUT:', data.toString());
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
      return res.json(JSON.parse(result));
    } catch {
      console.error('Failed to parse JSON:', result);
      return res.status(500).json({
        error: 'Failed to parse prediction result',
        raw: result
      });
    }
  });
});

// 7) Start server
app.listen(port, () => {
  console.log(`Server running successfully at http://localhost:${port}`);
});
