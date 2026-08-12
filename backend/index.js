/**
 * index.js — AlgoArena API server entry point
 *
 * Stack: Express 5 + Socket.io 4 + PostgreSQL (pg) + JWT auth
 * Port:  process.env.PORT (default 4000)
 */

'use strict'

// Load env vars first — before any other import reads process.env
require('dotenv').config()

const express  = require('express')
const http     = require('http')
const { Server } = require('socket.io')
const cors     = require('cors')

// ── Internal modules ──────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth')
const userRoutes    = require('./routes/users')
const problemRoutes = require('./routes/problems')
const matchRoutes   = require('./routes/matches')
const { registerMatchmaking } = require('./socket/matchmaking')
const { registerMatch }       = require('./socket/match')
const socketAuth              = require('./middleware/socketAuth')

// ── App + HTTP server ─────────────────────────────────────────────────────────
const app    = express()
// In dev, allow any localhost Vite port (5173, 5174, 5175…) so port conflicts never block you
const devOrigins = ['http://localhost:5173','http://localhost:5174','http://localhost:5175']
const allowedOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL
  : (origin, cb) => cb(null, devOrigins.includes(origin) || !origin)

const server = http.createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  allowedOrigin,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})

// ── Socket auth middleware (Day 9) ────────────────────────────────────────────
// Runs before any 'connection' event — rejects unauthenticated sockets
io.use(socketAuth)

// ── Express middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin:      allowedOrigin,
  credentials: true,
}))
app.use(express.json({ limit: '50kb' }))  // prevent enormous request bodies
app.use(express.urlencoded({ extended: false }))

// ── Request logger (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.path}`)
    next()
  })
}

// ── REST routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/users',    userRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/matches',  matchRoutes)

// ── Health check — useful for Render uptime pings ────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:      'ok',
    server:      'AlgoArena API',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'route not found' })
})

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err)
  res.status(500).json({ message: 'internal server error' })
})

// ── Socket.io event handlers ──────────────────────────────────────────────────
registerMatchmaking(io)
registerMatch(io)

// Log every new socket connection
io.on('connection', (socket) => {
  console.log(`[Socket] connected — id=${socket.id}`)
})

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 4000

server.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────┐
  │  AlgoArena API server                    │
  │  http://localhost:${PORT}                   │
  │  env: ${(process.env.NODE_ENV || 'development').padEnd(10)}                    │
  └──────────────────────────────────────────┘
  `)
})

// Graceful shutdown on SIGTERM (Render sends this before killing the dyno)
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received — shutting down gracefully')
  server.close(() => {
    console.log('[Server] closed')
    process.exit(0)
  })
})
