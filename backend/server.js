require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ───
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static file serving ───
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// ─── Health check ───
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', service: 'CasePilot API', ts: new Date() });
});

// ─── Routes ───
app.use('/api/cases', require('./routes/cases'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/search', require('./routes/search'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/seed', require('./routes/seed'));

// ─── Error handler ───
app.use(errorHandler);

// ─── Start server ───
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🏛️ CasePilot API running on port ${PORT}`);
  });
};

start();
