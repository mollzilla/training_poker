module.exports = {
  port: 3000,
  host: '0.0.0.0', // Listen on all interfaces
  middleware: (req, res, next) => {
    // Enhanced CORS for VPN compatibility
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
      return res.status(204).end();
    }
    
    next();
  }
}
