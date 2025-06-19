import { create, router as _router, defaults, bodyParser } from 'json-server'

const server = create()
const router = _router('db.json')
const middlewares = defaults()

// Enhanced CORS middleware for VPN compatibility
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  
  // Allow all origins for VPN compatibility
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Credentials', 'false')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
  res.header('Access-Control-Max-Age', '86400') // 24 hours
  
  // Additional headers for VPN compatibility
  res.header('Vary', 'Origin')
  res.header('X-Content-Type-Options', 'nosniff')
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.header('Pragma', 'no-cache')
  res.header('Expires', '0')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return res.status(204).end()
  }
  
  next()
})

// Use default middlewares (logger, static, cors and no-cache)
server.use(middlewares)

// To handle POST, PUT and PATCH you need to use a body-parser
server.use(bodyParser)

// Use default router
server.use(router)

const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'

server.listen(PORT, HOST, () => {
  console.log(`JSON Server is running on http://${HOST}:${PORT}`)
  console.log('Enhanced CORS configuration loaded for VPN compatibility')
})
