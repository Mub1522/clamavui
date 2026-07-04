import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../data')
const LOG_FILE = path.join(DATA_DIR, 'scan-logs.json')
const MAX_LOGS = 500

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify({ logs: [] }, null, 2), 'utf-8')
  }
}

function readData() {
  try {
    ensureDataDir()
    const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'))
    if (!Array.isArray(data.logs)) return { logs: [] }
    return data
  } catch {
    return { logs: [] }
  }
}

function writeData(data) {
  ensureDataDir()
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getLogs() {
  return readData().logs
}

export function appendLog(entry) {
  const data = readData()
  data.logs.unshift(entry)
  if (data.logs.length > MAX_LOGS) data.logs = data.logs.slice(0, MAX_LOGS)
  writeData(data)
}

export function deleteLog(id) {
  const data = readData()
  const before = data.logs.length
  data.logs = data.logs.filter(l => l.id !== id)
  if (data.logs.length === before) return false
  writeData(data)
  return true
}

export function clearLogs() {
  const data = readData()
  const count = data.logs.length
  data.logs = []
  writeData(data)
  return count
}
