module.exports = (req, res, next) => {
  // Allow all origins for VPN compatibility
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Additional headers for VPN compatibility
  res.header('Vary', 'Origin');
  res.header('X-Content-Type-Options', 'nosniff');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
}
