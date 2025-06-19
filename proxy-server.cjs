const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enhanced CORS middleware for VPN compatibility
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  
  // Allow all origins for VPN compatibility
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Additional headers for VPN compatibility
  res.header('Vary', 'Origin');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(204).end();
  }
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CORS proxy server running' });
});

// Proxy all requests to json-server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3001', // json-server will run on 3001
  changeOrigin: true,
  onError: (err) => {
    console.error('Proxy error:', err);
  }
}));

const PORT = 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`CORS Proxy Server running on http://${HOST}:${PORT}`);
  console.log('Proxying requests to json-server on port 3001');
});
