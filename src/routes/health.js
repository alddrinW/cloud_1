const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @route   GET /health
 * @desc    Health check de la aplicación y la conexión a la base de datos
 * @access  Público
 */
router.get('/', async (req, res) => {
  const dbHealth = await db.checkHealth();
  const isHealthy = dbHealth.connected;

  const healthData = {
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    service: 'cloud-crud-api',
    database: {
      status: dbHealth.connected ? 'connected' : 'disconnected',
      ...(dbHealth.connected
        ? { responseTimeMs: dbHealth.responseTimeMs }
        : { error: dbHealth.error }),
    },
  };

  const statusCode = isHealthy ? 200 : 503;
  return res.status(statusCode).json(healthData);
});

module.exports = router;

