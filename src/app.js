const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const ApiError = require('./utils/ApiError');
const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const forumsRoutes = require('./routes/forums.routes');
const threadsRoutes = require('./routes/threads.routes');
const commentsRoutes = require('./routes/comments.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true
  })
);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/auth', authRoutes);
app.use('/', publicRoutes);
app.use('/forums', forumsRoutes);
app.use('/', threadsRoutes);
app.use('/', commentsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
