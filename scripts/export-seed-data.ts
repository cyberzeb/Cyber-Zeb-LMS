import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSeedPayload } from '../src/shared/storage/buildSeedPayload'

const root = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(root, '..')
const outDir = join(repoRoot, 'backend', 'seed_data')
mkdirSync(outDir, { recursive: true })

const payload = { collections: buildSeedPayload() }
const outPath = join(outDir, 'demo.json')
writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8')
console.log(`Wrote ${outPath} (${Object.keys(payload.collections).length} collections)`)
