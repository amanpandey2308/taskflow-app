require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/utils/errorHandler');

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
