import { Router } from 'express'
import { spawn } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import { validatePath } from '../utils/pathValidator.js'
import { parseScanLine } from '../services/clamav.js'
import { appendLog } from '../services/logStore.js'

const router = Router()
let isScanning = false

router.post('/', (req, res) => {
  if (isScanning) {
    return res.status(409).json({ error: 'Ya hay un escaneo en progreso', code: 'SCAN_IN_PROGRESS' })
  }

  const { path: inputPath, options = {} } = req.body
  const validation = validatePath(inputPath)

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error, code: validation.code })
  }

  const { normalized } = validation
  const { infectedOnly = false, moveToQuarantine = false, quarantinePath = '' } = options

  const args = ['-r', '--stdout']
  if (infectedOnly) args.push('--infected')
  if (moveToQuarantine && quarantinePath.trim()) args.push(`--move=${quarantinePath.trim()}`)
  args.push(normalized)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.socket?.setTimeout(0)
  res.flushHeaders()

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`) } catch { /* ignore write-after-end */ }
  }

  send({ type: 'connected', path: normalized })
  isScanning = true

  const startedAt = new Date().toISOString()
  const proc = spawn('clamscan', args, { shell: false, windowsHide: true })

  let buffer = ''
  let inSummary = false
  let scannedFiles = 0
  let infectedFiles = 0
  let duration = ''
  const infectedPaths = []
  let spawnError = null

  const processLine = (rawLine) => {
    const line = rawLine.replace(/\r$/, '')
    if (!line.trim()) return

    if (line.includes('----------- SCAN SUMMARY')) {
      inSummary = true
      return
    }

    if (inSummary) {
      const m1 = line.match(/Scanned files:\s+(\d+)/i)
      if (m1) scannedFiles = parseInt(m1[1])
      const m2 = line.match(/Infected files:\s+(\d+)/i)
      if (m2) infectedFiles = parseInt(m2[1])
      const m3 = line.match(/Time:\s+([\d.]+ sec)/i)
      if (m3) duration = m3[1]
      return
    }

    const parsed = parseScanLine(line)
    if (!parsed) return

    send(parsed)
    if (parsed.status === 'infected') {
      infectedPaths.push({ path: parsed.path, threat: parsed.threat })
    }
  }

  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop()
    lines.forEach(processLine)
  })

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString().replace(/\r?\n/g, ' ').trim()
    if (text) send({ type: 'stderr', text })
  })

  proc.on('error', (err) => {
    spawnError = err
  })

  // res.on('close') fires when the CLIENT closes the browser/tab — correct event for cleanup
  // req.on('close') fires when POST body is received (~12ms) — do NOT use for process kill
  res.on('close', () => {
    if (isScanning) {
      proc.kill()
      isScanning = false
    }
  })

  proc.on('close', (exitCode) => {
    if (buffer.trim()) processLine(buffer)
    isScanning = false

    if (spawnError) {
      const msg = spawnError.code === 'ENOENT'
        ? 'clamscan no encontrado. Verifica que ClamAV esté instalado y en el PATH del sistema.'
        : spawnError.message
      send({ type: 'error', message: msg })
    }

    const status = exitCode === 0 ? 'clean' : exitCode === 1 ? 'infected' : 'error'
    send({ type: 'summary', scanned: scannedFiles, infected: infectedFiles, time: duration, exitCode })

    appendLog({
      id: uuidv4(),
      type: 'scan',
      startedAt,
      path: normalized,
      options: { infectedOnly, moveToQuarantine, quarantinePath },
      status,
      scannedFiles,
      infectedCount: infectedFiles,
      infectedPaths,
      duration,
      exitCode
    })
    res.end()
  })
})

export default router
