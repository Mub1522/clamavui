# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```powershell
# Development (backend :47219 + frontend :5173 concurrently)
pnpm dev

# Production build (outputs to packages/frontend/dist)
pnpm build

# Production server (serves built frontend + API on :47219)
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

pnpm workspace monorepo with two packages: `packages/backend` (Node.js ESM + Express) and `packages/frontend` (Vue 3 + Vite). In production, Express serves the Vite build as static files and handles all routing. In development, Vite proxies `/api/*` to `localhost:47219` (backend's default `PORT`, overridable via env var).

Backend routes: `status` (tool/version detection), `scan`, `update` (both SSE), `logs` (history CRUD), `browse` (drive/directory listing for the path picker UI).

### SSE Streaming pattern

Both `/api/scan` and `/api/update` are **POST → SSE** endpoints. The server calls `res.flushHeaders()` immediately, then streams `data: {...}\n\n` events over the open response. The frontend reads these via `fetch` + `response.body.getReader()` in `useSSEStream.js`.

**Critical invariant:** Use `res.on('close')` — never `req.on('close')` — to kill the child process when the client disconnects. `req.on('close')` fires ~12ms after receiving the POST body (browser closes the write side of TCP), which kills the process before it produces any output.

### Child process spawning

Always `spawn(executable, argsArray, { shell: false, windowsHide: true })`. Never use `shell: true` — it routes through `cmd.exe`, creating fragile quoting and an intermediary process that can fail silently. Never pass quoted paths; with `shell: false`, Node passes args directly to the OS.

`routes/status.js` checks tool presence with `where.exe <name>` instead of actually running the tool — running `clamd --version` hangs, so presence is checked via PATH lookup and only `clamscan --version` is actually invoked.

### State management

`useStatus.js` uses **module-level refs** (declared outside the function) so all components share a single status instance. `useSSEStream.js` uses function-level refs, so each call site gets its own stream state.

### Scan output parsing (`services/clamav.js`)

clamscan stdout lines take the form `C:\path\file: OK` or `C:\path\file: ThreatName FOUND`. After `----------- SCAN SUMMARY -----------` the format switches to `Key: value` lines. Buffer stdout chunks and split on `/\r?\n/` — Windows sends `\r\n`. Strip `\r` before regex matching.

### Path validation (`utils/pathValidator.js`, `routes/browse.js`)

Windows-only: must start with `[A-Za-z]:\`, rejects `;&|><^\`` chars, normalizes with `path.normalize()`, verifies with `fs.existsSync()`. `pathValidator.js` (used by `/api/scan`) returns `{ valid, normalized }` or `{ valid, code, error }`. `routes/browse.js` repeats a similar check inline to list drives/directories for the frontend's path picker.

### Log persistence (`services/logStore.js`)

JSON file at `packages/backend/data/scan-logs.json`, max 500 entries, newest first. Auto-created on first write. Both scan and update routes append a log entry via `appendLog()` in the `proc.on('close')` handler. `routes/logs.js` also exposes delete-one and delete-all (`DELETE /api/logs/all` must be registered before `DELETE /api/logs/:id` to avoid `all` matching as an id).

### Theme

daisyUI v4 custom theme `clamav-dark` defined in `packages/frontend/tailwind.config.js`. Applied via `data-theme="clamav-dark"` on `<html>` in `index.html`. Primary color `#e53535` (red).

### Notifications

`App.vue` provides a `notifier` object (thin wrapper over the browser Notification API) via Vue `provide`/`inject`; permission is requested once on mount if still `default`. `ScanPanel.vue` and `UpdatePanel.vue` inject it to fire a notification when their SSE stream finishes (scan summary / freshclam done).

### Tabs stay mounted (`App.vue`)

The four panels (Status/Scan/Update/Logs) are toggled with `v-show`, not `v-if`, so in-flight SSE streams and form state survive switching tabs. `LogsPanel` is force-remounted via a `:key="logsKey"` bump on the scan panel's `scan-complete` event, since it only fetches logs `onMounted`.

### Path picker (`PathPicker.vue`)

Modal folder/drive browser opened from `ScanPanel`'s browse button, backed by `/api/browse`. Selecting a folder drills in (re-fetches `/api/browse?path=...`); selecting a file emits immediately. `ScanPanel` also strips wrapping quotes from pasted paths (`sanitizePath`), since Windows Explorer's "Copy as path" wraps in `"..."`.

### Scan options → clamscan flags (`ScanPanel.vue` → `routes/scan.js`)

`infectedOnly` → `--infected`; `moveToQuarantine` + non-empty `quarantinePath` → `--move=<path>` (quarantine folder must already exist — clamscan won't create it).

### freshclam vs. the Windows ClamAV service

If ClamAV was installed with its Windows scheduled task/service, that service holds a lock on the database and freshclam run from this app gets killed (surfaces as `exitCode: null` + a signal, not a normal error). `UpdatePanel.vue` special-cases `exitCode === null` with in-UI instructions: stop the Windows service, or run this Node process as Administrator.

### PM2

`ecosystem.config.cjs` (CommonJS, required by PM2) hardcodes `cwd: 'C:/Users/USUARIO/Desktop/clamav-ui'` and `PORT: 47219`. For a different machine, update `cwd`. The app runs with `NODE_ENV=production` which enables static file serving and disables CORS.
