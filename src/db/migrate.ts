import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from './index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const migrationsDir = join(__dirname, 'migrations')
  const files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const { rows } = await db.query('SELECT 1 FROM _migrations WHERE filename = $1', [file])
    if (rows.length > 0) continue

    const sql = await readFile(join(migrationsDir, file), 'utf8')
    await db.query(sql)
    await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
    console.log(`✓ ${file}`)
  }

  await db.end()
  console.log('Migrations complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
