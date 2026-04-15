'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');

// Initialize DB first (creates tables + seeds if needed)
const { db, initialize: initDb } = require('./db/database');

const authRoutes       = require('./routes/auth');
const leadsRoutes      = require('./routes/leads');
const pipelineRoutes   = require('./routes/pipeline');
const salesRoutes      = require('./routes/sales');
const marketingRoutes  = require('./routes/marketing');
const clientsRoutes    = require('./routes/clients');
const resourcesRoutes  = require('./routes/resources');
const teamRoutes       = require('./routes/team');
const webhooksRoutes   = require('./routes/webhooks');
const dialerRoutes     = require('./routes/dialer');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Handled by frontend
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-secret'],
}));

app.options('*', cors());

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Affiliate Launchpad Business OS',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/leads',     leadsRoutes);
app.use('/api/pipeline',  pipelineRoutes);
app.use('/api/sales',     salesRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/clients',   clientsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/team',      teamRoutes);
app.use('/api/settings',  teamRoutes);   // settings share team router
app.use('/api/webhooks',  webhookLimiter, webhooksRoutes);
app.use('/api/dialer',    dialerRoutes);

// Dashboard stats (served from sales route under /api/dashboard)
app.use('/api/dashboard', salesRoutes);

// ─── Serve React Build (Production) ───────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message || err);

  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  const status  = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (err.message || 'Internal server error');

  res.status(status).json({ error: message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function start() {
  try {
    initDb();
    console.log('✅  Database initialized');

    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║      Affiliate Launchpad Business OS API         ║');
      console.log('╚══════════════════════════════════════════════════╝');
      console.log(`  ✅  Server running on http://localhost:${PORT}`);
      console.log(`  🌍  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  🗄️   Database    : ${process.env.DATABASE_PATH || './db/affiliate_launchpad.db'}`);
      console.log(`  🔒  JWT expires : ${process.env.JWT_EXPIRES_IN || '7d'}`);
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
