import { Router } from 'express'
import { getLogs, deleteLog, clearLogs } from '../services/logStore.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ logs: getLogs() })
})

// Must be before /:id to avoid 'all' being treated as an id
router.delete('/all', (req, res) => {
  const count = clearLogs()
  res.json({ success: true, deleted: count })
})

router.delete('/:id', (req, res) => {
  const deleted = deleteLog(req.params.id)
  if (!deleted) return res.status(404).json({ error: 'Log no encontrado' })
  res.json({ success: true })
})

export default router
