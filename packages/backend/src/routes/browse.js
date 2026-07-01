import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

// Returns available Windows drives
function getDrives() {
  const drives = []
  for (let i = 65; i <= 90; i++) {
    const drive = `${String.fromCharCode(i)}:\\`
    try { fs.accessSync(drive); drives.push({ name: drive, type: 'drive', path: drive }) } catch { /* not mounted */ }
  }
  return drives
}

router.get('/', (req, res) => {
  const { path: inputPath } = req.query

  // Root level — list drives
  if (!inputPath) {
    return res.json({ path: null, parent: null, entries: getDrives() })
  }

  // Validate: must be a Windows absolute path
  if (!/^[A-Za-z]:[\\\/]/.test(inputPath) || /[;&|><^`]/.test(inputPath)) {
    return res.status(400).json({ error: 'Ruta inválida' })
  }

  const normalized = path.normalize(inputPath)

  try {
    const dirents = fs.readdirSync(normalized, { withFileTypes: true })

    const entries = dirents
      .filter(d => {
        // Skip hidden/system entries (starting with $ or .)
        return !d.name.startsWith('$') && !d.name.startsWith('.')
      })
      .map(d => ({
        name: d.name,
        type: d.isDirectory() ? 'dir' : 'file',
        path: path.join(normalized, d.name)
      }))
      .sort((a, b) => {
        // Dirs first, then files, then alphabetical
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    // Parent path
    const parent = path.dirname(normalized)
    const isRoot = /^[A-Za-z]:\\?$/.test(normalized)

    res.json({
      path: normalized,
      parent: isRoot ? null : parent,
      entries
    })
  } catch (err) {
    res.status(403).json({ error: `No se puede acceder a esta carpeta: ${err.message}` })
  }
})

export default router
