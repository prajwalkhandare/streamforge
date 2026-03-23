const express = require('express');
const router = express.Router();
const os = require('os');
const { query } = require('../config/database');
const { redisClient } = require('../config/redis');

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'streamforge-backend',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.cpus().length,
    loadavg: os.loadavg(),
    checks: {}
  };

  // Check database
  try {
    const dbStart = Date.now();
    await query('SELECT 1');
    health.checks.database = {
      status: 'healthy',
      latency: `${Date.now() - dbStart}ms'
    };
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    await redisClient.ping();
    health.checks.redis = {
      status: 'healthy',
      latency: `${Date.now() - redisStart}ms'
    };
  } catch (error) {
    health.status = 'degraded';
    health.checks.redis = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Check disk space
  try {
    const disk = os.freemem() / os.totalmem() * 100;
    health.checks.disk = {
      status: disk > 10 ? 'healthy' : 'critical',
      free: `${Math.round(disk)}%`
    };
  } catch (error) {
    health.checks.disk = {
      status: 'unknown'
    };
  }

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Readiness probe
router.get('/ready', async (req, res) => {
  // Check if service is ready to accept traffic
  try {
    await query('SELECT 1');
    await redisClient.ping();
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  // Check if service is alive
  res.status(200).json({ alive: true });
});

// Startup probe
router.get('/startup', async (req, res) => {
  // Check if service has completed startup
  const startupTime = process.uptime();
  if (startupTime < 10) {
    return res.status(503).json({ started: false, uptime: startupTime });
  }
  res.status(200).json({ started: true, uptime: startupTime });
});

// Dependencies status
router.get('/dependencies', async (req, res) => {
  const dependencies = {};

  // AWS services
  dependencies.aws = {
    region: process.env.AWS_REGION,
    status: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'missing'
  };

  // S3
  dependencies.s3 = {
    bucket: process.env.S3_VIDEOS_BUCKET,
    status: process.env.S3_VIDEOS_BUCKET ? 'configured' : 'missing'
  };

  // CloudFront
  dependencies.cloudfront = {
    domain: process.env.CLOUDFRONT_DOMAIN,
    status: process.env.CLOUDFRONT_DOMAIN ? 'configured' : 'missing'
  };

  // Cognito
  dependencies.cognito = {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    status: process.env.COGNITO_USER_POOL_ID ? 'configured' : 'missing'
  };

  res.json(dependencies);
});

// Metrics endpoint (for Prometheus)
router.get('/metrics', (req, res) => {
  const metrics = [
    `# HELP process_uptime Process uptime in seconds`,
    `# TYPE process_uptime gauge`,
    `process_uptime ${process.uptime()}`,
    ``,
    `# HELP memory_usage Memory usage in bytes`,
    `# TYPE memory_usage gauge`,
    `memory_usage{rss="${process.memoryUsage().rss}"} ${process.memoryUsage().rss}`,
    `memory_usage{heapTotal="${process.memoryUsage().heapTotal}"} ${process.memoryUsage().heapTotal}`,
    `memory_usage{heapUsed="${process.memoryUsage().heapUsed}"} ${process.memoryUsage().heapUsed}`,
    ``,
    `# HELP cpu_cores Number of CPU cores`,
    `# TYPE cpu_cores gauge`,
    `cpu_cores ${os.cpus().length}`,
    ``,
    `# HELP load_average System load average`,
    `# TYPE load_average gauge`,
    `load_average{period="1m"} ${os.loadavg()[0]}`,
    `load_average{period="5m"} ${os.loadavg()[1]}`,
    `load_average{period="15m"} ${os.loadavg()[2]}`
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Version info
router.get('/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  });
});

module.exports = router;