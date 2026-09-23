/**
 * Writes the demo seed payloads the backend seeds tenants from.
 *
 * One file per edition: the university demo (`berana`) and the corporate demo
 * (`horizon`). Run with `npm run export-seed` after changing any seed module.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSeedPayload } from '../src/shared/storage/buildSeedPayload'
import { buildCorporateSeedPayload } from '../src/shared/storage/buildCorporateSeedPayload'

const root = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(root, '..')
const outDir = join(repoRoot, 'backend', 'seed_data')
mkdirSync(outDir, { recursive: true })

const targets = [
  { file: 'demo.json', collections: buildSeedPayload() },
  { file: 'corporate.json', collections: buildCorporateSeedPayload() },
]

for (const target of targets) {
  const outPath = join(outDir, target.file)
  writeFileSync(outPath, JSON.stringify({ collections: target.collections }, null, 2), 'utf8')
  console.log(`Wrote ${outPath} (${Object.keys(target.collections).length} collections)`)
}
