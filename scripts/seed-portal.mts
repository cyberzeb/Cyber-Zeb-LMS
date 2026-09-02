import { buildSeedPayload } from '../src/shared/storage/buildSeedPayload'

const base = process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'
const collections = buildSeedPayload()

const res = await fetch(`${base}/data/seed?tenant_code=berana`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Tenant-Code': 'berana' },
  body: JSON.stringify({ collections }),
})

console.log('POST /data/seed ->', res.status)
console.log(await res.text())
console.log('collections seeded:', Object.keys(collections).length)
