import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import statusRouter from './routes/status.js'
import scanRouter from './routes/scan.js'
import updateRouter from './routes/update.js'
import logsRouter from './routes/logs.js'
import browseRouter from './routes/browse.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 47219
const ts = () => new Date().toISOString()

app.use(express.json())

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: 'http://localhost:5173' }))
}

// Minimal request log — goes to stdout → captured by PM2 into logs/clamav-ui.log
app.use((req, res, next) => {
  if (req.method === 'POST' && (req.path === '/api/scan' || req.path === '/api/update')) {
    const detail = req.path === '/api/scan' ? JSON.stringify(req.body?.path) : 'freshclam'
    console.log(`[${ts()}] ${req.path.replace('/api/', '').toUpperCase()} ${detail}`)
  }
  next()
})

app.use('/api/status', statusRouter)
app.use('/api/scan', scanRouter)
app.use('/api/update', updateRouter)
app.use('/api/logs', logsRouter)
app.use('/api/browse', browseRouter)

if (process.env.NODE_ENV === 'production') {
  const DIST = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(DIST))
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`[${ts()}] ClamAV UI started on http://localhost:${PORT} (${process.env.NODE_ENV ?? 'development'})`)
})
