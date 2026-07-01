import path from 'path'
import fs from 'fs'

const UNSAFE_CHARS = /[;&|><^`]/

export function validatePath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    return { valid: false, code: 'INVALID_PATH', error: 'La ruta es requerida' }
  }

  const trimmed = inputPath.trim()

  if (!/^[A-Za-z]:[\\\/]/.test(trimmed)) {
    return { valid: false, code: 'INVALID_PATH', error: 'Ruta Windows inválida (debe comenzar con letra de unidad, ej: C:\\)' }
  }

  if (UNSAFE_CHARS.test(trimmed)) {
    return { valid: false, code: 'PATH_UNSAFE', error: 'La ruta contiene caracteres no permitidos' }
  }

  const normalized = path.normalize(trimmed)

  // Verify traversal didn't escape the drive
  if (!/^[A-Za-z]:/.test(normalized)) {
    return { valid: false, code: 'PATH_UNSAFE', error: 'Traversal de ruta detectado' }
  }

  if (!fs.existsSync(normalized)) {
    return { valid: false, code: 'PATH_NOT_FOUND', error: `La ruta no existe: ${normalized}` }
  }

  return { valid: true, normalized }
}
