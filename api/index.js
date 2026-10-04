// Vercel Serverless Function — forwards all /api/* requests to Express app
// api/package.json overrides "type":"commonjs" so require() works here
const app = require('../backend/server.js');

module.exports = app;
