import { Router } from 'express'
import { spawn } from 'child_process'
import { parseVersion } from '../services/clamav.js'

const router = Router()

// Use where.exe to check PATH presence — avoids running the tool (clamd hangs on --version)
function toolInPath(name) {
  return new Promise((resolve) => {
    const proc = spawn('where.exe', [name], { shell: false, windowsHide: true })
    proc.on('close', (code) => resolve(code === 0))
    proc.on('error', () => resolve(false))
  })
}

router.get('/', async (req, res) => {
  try {
    const [hasClamscan, hasFreshclam, hasClamdscan, hasClamd] = await Promise.all([
      toolInPath('clamscan'),
      toolInPath('freshclam'),
      toolInPath('clamdscan'),
      toolInPath('clamd')
    ])

    const tools = { clamscan: hasClamscan, freshclam: hasFreshclam, clamdscan: hasClamdscan, clamd: hasClamd }

    if (!hasClamscan) {
      return res.json({ clamavInstalled: false, tools, error: 'clamscan no encontrado en el PATH del sistema' })
    }

    const version = await new Promise((resolve, reject) => {
      const proc = spawn('clamscan', ['--version'], { shell: false, windowsHide: true })
      let out = ''
      proc.stdout.on('data', d => { out += d.toString() })
      proc.stderr.on('data', d => { out += d.toString() })
      proc.on('close', () => resolve(out.trim()))
      proc.on('error', reject)
    })

    const parsed = parseVersion(version)
    res.json({
      clamavInstalled: true,
      tools,
      ...(parsed ?? { version, dbVersion: null, dbDate: null })
    })
  } catch {
    res.json({ clamavInstalled: false, tools: {}, error: 'clamscan no encontrado en el PATH del sistema' })
  }
})

export default router
