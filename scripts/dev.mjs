/**
 * One-command local development: FastAPI backend (port 8001) + Vite frontend (port 5173).
 * Vite proxies /api to 127.0.0.1:8001 (see vite.config.ts), so both must run together.
 *
 * Usage: npm run dev:full
 * Uses backend/.venv if present, otherwise the `python` on PATH.
 *
 * The API restarts itself when a backend .py file changes. We do this here instead
 * of `uvicorn --reload`, whose reloader can hang on Windows and keep serving old code.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, watch } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const backendDir = join(root, 'backend')
const isWindows = process.platform === 'win32'

const venvPython = isWindows
  ? join(backendDir, '.venv', 'Scripts', 'python.exe')
  : join(backendDir, '.venv', 'bin', 'python')
const python = existsSync(venvPython) ? venvPython : 'python'
const apiArgs = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8001']

if (!existsSync(join(backendDir, '.env'))) {
  console.warn('[dev] backend/.env not found — copy backend/.env.example to backend/.env first.')
}

let shuttingDown = false
let api = null
let web = null

function start(command, args, cwd) {
  // shell is needed on Windows to resolve npx; quote paths that contain spaces.
  const cmd = isWindows && command.includes(' ') ? `"${command}"` : command
  return spawn(cmd, args, { cwd, stdio: 'inherit', shell: isWindows })
}

function stop(child) {
  if (!child || child.exitCode !== null || !child.pid) return
  if (isWindows) {
    // child.kill() only stops the cmd.exe wrapper; kill the whole tree.
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill()
  }
}

function shutdown(code) {
  shuttingDown = true
  stop(api)
  stop(web)
  process.exit(code)
}

function startApi() {
  api = start(python, apiArgs, backendDir)
  const current = api
  current.on('exit', (code) => {
    // Exits caused by a restart are expected; anything else ends the session.
    if (!shuttingDown && current === api) {
      console.log(`[dev] api exited with code ${code}`)
      shutdown(code ?? 0)
    }
  })
}

let restartTimer = null
function restartApi(file) {
  clearTimeout(restartTimer)
  restartTimer = setTimeout(() => {
    console.log(`[dev] ${file} changed — restarting API`)
    const previous = api
    api = null
    stop(previous)
    startApi()
  }, 300)
}

watch(join(backendDir, 'app'), { recursive: true }, (_event, file) => {
  if (file && file.endsWith('.py')) restartApi(file)
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

startApi()
web = start('npx', ['vite'], root)
web.on('exit', (code) => {
  if (!shuttingDown) {
    console.log(`[dev] web exited with code ${code}`)
    shutdown(code ?? 0)
  }
})
