const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');
const { config } = require('./config/config');
const { isDatabaseReady } = require('./config/database');
const requestLogger = require('./middleware/requestLogger');
const { databaseRequired } = require('./middleware/databaseRequired');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());

const corsOrigin = config.allowedOrigins === '*'
  ? true
  : config.allowedOrigins;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting: was 100 requests / 15 min per IP, which a real frontend
// session blows through fast — a single page load can fire 3-5 API calls
// (products list, users list for supplier joins, saved products, etc.), and
// with everyone on a shared office/campus IP contributing to the same
// bucket, that adds up in minutes, not just under abuse. Raised substantially
// while keeping the same 15-minute window shape:
//   - windowMs unchanged (15 min) so the "recovers over time" behavior stays
//     familiar/predictable.
//   - max raised 20x, from 100 to 2000 requests per window per IP.
// This still protects against real abuse/scraping (2000 req/15min = ~2.2
// req/sec sustained, well beyond normal browsing, but far below what a
// scraper/bot hammering the API would need to be throttled). If you still
// hit this during heavy testing, either raise `max` further or move to a
// per-route limit (stricter on /api/auth/login to slow brute-force guessing,
// far looser on read-only GET /api/products).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/uploads', express.static('uploads'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Service health and readiness
 *     description: >
 *       Always returns 200 (even when the database is unreachable) so
 *       uptime monitors get a response either way — check the `ok`/
 *       `database` fields to see actual readiness.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Current health snapshot.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    ok: isDatabaseReady(),
    status: isDatabaseReady() ? 'ok' : 'degraded',
    database: isDatabaseReady() ? 'supabase' : 'unavailable',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    },
  });
});

// Routes (validation middleware runs before database guard)
app.use('/api', apiLimiter, databaseRequired, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
