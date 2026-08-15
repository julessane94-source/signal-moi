import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://signal-moi-api.onrender.com/api'
const endpoint = `${apiUrl.replace(/\/api\/?$/, '')}/api/pages/logo`
const output = path.resolve('assets', 'icon.png')

function decodeDataUri(dataUri) {
  const match = String(dataUri || '').match(/^data:image\/\w+;base64,(.+)$/)
  if (!match) return null
  return Buffer.from(match[1], 'base64')
}

const response = await fetch(endpoint)
if (!response.ok) {
  throw new Error(`Logo introuvable: ${response.status}`)
}

const data = await response.json()
const buffer = decodeDataUri(data.logoUrl)
if (!buffer) {
  throw new Error('Le logo BD doit etre retourne en data:image/...;base64')
}

await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, buffer)
console.log(`Icone mobile mise a jour: ${output}`)
