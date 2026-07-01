# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```powershell
# Development (runs backend on :3000 + frontend on :5173 concurrently)
pnpm dev

# Production build (outputs to packages/frontend/dist)
pnpm build

# Production server (serves built frontend + API on :3000)
pnpm start
# or with PM2:
pm2 start ecosystem.config.cjs

# Backend only (dev, with nodemon)
pnpm --filter backend dev

# Frontend only (dev, Vite HMR)
pnpm --filter frontend dev
```

There are no tests. There is no linter configured.

## Architecture

pnpm workspace monorepo with two packages: `packages/backend` (Node.js ESM + Express) and `packages/frontend` (Vue 3 + Vite). In production, Express serves the Vite build as static files and handles all routing. In development, Vite proxies `/api/*` to `localhost:3000`.

### SSE Streaming pattern

Both `/api/scan` and `/api/update` are **POST → SSE** endpoints. The server calls `res.flushHeaders()` immediately, then streams `data: {...}\n\n` events over the open response. The frontend reads these via `fetch` + `response.body.getReader()` in `useSSEStream.js`.

**Critical invariant:** Use `res.on('close')` — never `req.on('close')` — to kill the child process when the client disconnects. `req.on('close')` fires ~12ms after receiving the POST body (browser closes the write side of TCP), which kills the process before it produces any output.

### Child process spawning

Always `spawn(executable, argsArray, { shell: false, windowsHide: true })`. Never use `shell: true` — it routes through `cmd.exe`, creating fragile quoting and an intermediary process that can fail silently. Never pass quoted paths; with `shell: false`, Node passes args directly to the OS.

### State management

`useStatus.js` uses **module-level refs** (declared outside the function) so all components share a single status instance. `useSSEStream.js` uses function-level refs, so each call site gets its own stream state.

### Scan output parsing (`services/clamav.js`)

clamscan stdout lines take the form `C:\path\file: OK` or `C:\path\file: ThreatName FOUND`. After `----------- SCAN SUMMARY -----------` the format switches to `Key: value` lines. Buffer stdout chunks and split on `/\r?\n/` — Windows sends `\r\n`. Strip `\r` before regex matching.

### Path validation (`utils/pathValidator.js`)

Windows-only: must start with `[A-Za-z]:\`, rejects `;&|><^\`` chars, normalizes with `path.normalize()`, verifies with `fs.existsSync()`. Returns `{ valid, normalized }` or `{ valid, code, error }`.

### Log persistence (`services/logStore.js`)

JSON file at `packages/backend/data/scan-logs.json`, max 500 entries, newest first. Auto-created on first write. Both scan and update routes append a log entry via `appendLog()` in the `proc.on('close')` handler.

### Theme

daisyUI v4 custom theme `clamav-dark` defined in `packages/frontend/tailwind.config.js`. Applied via `data-theme="clamav-dark"` on `<html>` in `index.html`. Primary color `#8b0000` (dark red).

### PM2

`ecosystem.config.cjs` (CommonJS, required by PM2) hardcodes `cwd: 'C:/Users/USUARIO/Desktop/clamav-ui'`. For a different machine, update `cwd`. The app runs with `NODE_ENV=production` which enables static file serving and disables CORS.
