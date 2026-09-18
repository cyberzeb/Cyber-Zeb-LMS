/**
 * One-command local development: FastAPI backend (port 8001) + Vite frontend (port 5173).
 * Vite proxies /api to 127.0.0.1:8001 (see vite.config.ts), so both must run together.
 *
 * Usage: npm run dev:full
 * Uses backend/.venv if present, otherwise the `python` on PATH.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const backendDir = join(root, 'backend')
const isWindows = process.platform === 'win32'

const venvPython = isWindows
  ? join(backendDir, '.venv', 'Scripts', 'python.exe')
  : join(backendDir, '.venv', 'bin', 'python')
const python = existsSync(venvPython) ? venvPython : 'python'

if (!existsSync(join(backendDir, '.env'))) {
  console.warn('[dev] backend/.env not found — copy backend/.env.example to backend/.env first.')
}

const children = []

function run(name, command, args, cwd) {
  // shell is needed on Windows to resolve npx; quote paths that contain spaces.
  const cmd = isWindows && command.includes(' ') ? `"${command}"` : command
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: isWindows })
  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`)
    shutdown(code ?? 0)
  })
  children.push(child)
}

function shutdown(code) {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

run(
  'api',
  python,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8001'],
  backendDir,
)
run('web', 'npx', ['vite'], root)
