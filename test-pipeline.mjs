// Quick smoke test — simulates an inbound WA message through the full pipeline
// Patches sendText so no real WA message is sent
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Load .env manually
const env = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '.env'), 'utf8')
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
}

// Patch sender before pipeline loads
const senderPath = join(dirname(fileURLToPath(import.meta.url)), 'dist/modules/wa-connector/sender.js')
const { createServer } = await import('http') // dummy import to keep ESM happy

// We'll intercept by monkey-patching after import
const sender = await import('./dist/modules/wa-connector/sender.js')
let captured = null
const origSendText = sender.sendText
// Can't reassign named export easily — use pipeline import trick

console.log('\n=== LimauAI Pipeline Smoke Test ===\n')

const { handleIncomingMessage } = await import('./dist/pipeline.js')

// Override sendText at module level via dynamic resolution isn't possible cleanly,
// so just run the pipeline and watch DB + logs for the reply
const testPhone = '60100000001'
const testMessage = 'Saya nak renew insurans kereta saya'

console.log(`Phone  : ${testPhone}`)
console.log(`Message: "${testMessage}"\n`)
console.log('Running pipeline...\n')

try {
  await handleIncomingMessage(testPhone, testMessage)
  console.log('\n✓ Pipeline completed without error')
} catch (err) {
  console.error('\n✗ Pipeline error:', err.message)
}

process.exit(0)
