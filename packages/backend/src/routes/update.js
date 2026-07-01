import { Router } from 'express'
import { spawn } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import { appendLog } from '../services/logStore.js'

const router = Router()
let isUpdating = false

router.post('/', (req, res) => {
  if (isUpdating) {
    return res.status(409).json({ error: 'Ya hay una actualización en progreso', code: 'UPDATE_IN_PROGRESS' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.socket?.setTimeout(0)
  res.flushHeaders()

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`) } catch { /* ignore write-after-end */ }
  }

  send({ type: 'connected' })
  isUpdating = true

  const startedAt = new Date().toISOString()
  const proc = spawn('freshclam', ['--stdout', '-v'], { shell: false, windowsHide: true })

  let spawnError = null

  const pipeLines = (chunk) => {
    chunk.toString().split(/\r?\n/).forEach(line => {
      if (line.trim()) send({ type: 'line', text: line.trim() })
    })
  }

  proc.stdout.on('data', pipeLines)
  proc.stderr.on('data', pipeLines)

  proc.on('error', (err) => { spawnError = err })

  // res.on('close') fires when the CLIENT disconnects — correct event for cleanup
  // req.on('close') fires when POST body is received (~12ms) — do NOT use for process kill
  res.on('close', () => {
    if (isUpdating) {
      proc.kill()
      isUpdating = false
    }
  })

  proc.on('close', (code, signal) => {
    isUpdating = false

    if (spawnError) {
      const msg = spawnError.code === 'ENOENT'
        ? 'freshclam no encontrado. Verifica que ClamAV esté instalado y en el PATH del sistema.'
        : spawnError.message
      send({ type: 'error', message: msg })
    }

    send({ type: 'done', exitCode: code, signal: signal ?? null })

    appendLog({
      id: uuidv4(),
      type: 'update',
      startedAt,
      status: code === 0 ? 'success' : 'error',
      exitCode: code
    })
    res.end()
  })
})

export default router
