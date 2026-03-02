import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from 'dotenv';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Relax Helmet for SPA/API compatibility
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Allow CORS from anywhere (for now, to rule out issues)
app.use(cors());

// Detailed Logging
app.use(morgan('combined'));
app.use(express.json());

// Debug Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve Static Frontend
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
