require('dotenv').config();

const express = require('express');
const db = require('./db');
const healthRoutes = require('./routes/health');
const itemsRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de parsing de JSON y URL encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para habilitar CORS básico
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Middleware de Logging de Peticiones HTTP
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Ruta raíz con información del servicio
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Cloud CRUD API - Programación en la Nube',
    version: '1.0.0',
    description: 'API REST contenerizada con Express y PostgreSQL',
    endpoints: {
      health: '/health',
      items: '/api/items',
    },
    documentation: 'Consulta el archivo README.md para la guía completa de uso.',
  });
});

// Rutas de la aplicación
app.use('/health', healthRoutes);
app.use('/api/items', itemsRoutes);

// Manejador para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador global de errores (500)
app.use((err, req, res, next) => {
  console.error('[ERROR NO CONTROLADO]:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Inicio del servidor
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🩺 Endpoint de Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`📦 Endpoint del CRUD: http://0.0.0.0:${PORT}/api/items`);
  console.log('====================================================');
});

// Manejo de apagado elegante (Graceful Shutdown)
const shutdown = (signal) => {
  console.log(`\n[SHUTDOWN] Señal ${signal} recibida. Cerrando servidor y conexiones...`);
  server.close(async () => {
    console.log('[SHUTDOWN] Servidor HTTP cerrado.');
    try {
      await db.pool.end();
      console.log('[SHUTDOWN] Conexión a la base de datos cerrada.');
      process.exit(0);
    } catch (err) {
      console.error('[SHUTDOWN ERROR] Error cerrando el pool de PostgreSQL:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
