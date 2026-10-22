require('dotenv').config();
const path = require('path');
const express = require('express');
const connectDatabase = require('./config/db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'CampusConnect API' }));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: 'Please check the submitted details.' });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
  connectDatabase(process.env.MONGODB_URI)
    .then(() => app.listen(port, () => console.log(`CampusConnect is running on http://localhost:${port}`)))
    .catch((error) => {
      console.error('Database connection failed:', error.message);
      process.exitCode = 1;
    });
}
module.exports = app;
