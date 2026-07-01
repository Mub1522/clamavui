// Parse a single stdout line from clamscan
export function parseScanLine(rawLine) {
  // Strip Windows \r\n — critical: $ in regex won't match before \r
  const line = rawLine.replace(/\r$/, '').trim()
  if (!line) return null

  // "C:\path\file.exe: Trojan.Agent FOUND"
  const infectedMatch = line.match(/^(.+):\s+(.+)\s+FOUND$/)
  if (infectedMatch) {
    return { type: 'file', path: infectedMatch[1].trim(), status: 'infected', threat: infectedMatch[2].trim() }
  }

  // "C:\path\file.exe: OK"
  const okMatch = line.match(/^(.+):\s+OK$/)
  if (okMatch) {
    return { type: 'file', path: okMatch[1].trim(), status: 'ok' }
  }

  return null
}

// Parse clamscan --version output
// Example: "ClamAV 1.4.0/27054/Wed Sep 25 07:50:10 2024"
export function parseVersion(output) {
  const full = output.match(/ClamAV\s+([^\/\s]+)\/(\d+)\/(.+)/)
  if (full) {
    return { version: full[1], dbVersion: full[2], dbDate: full[3].trim() }
  }
  const simple = output.match(/ClamAV\s+([^\/\s\r\n]+)/)
  if (simple) {
    return { version: simple[1], dbVersion: null, dbDate: null }
  }
  return null
}
