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
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`✓ ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw new Error(`Migration failed: ${file}\n${(err as Error).message}`)
    } finally {
      client.release()
    }
  }

  await db.end()
  console.log('Migrations complete.')
}

migrate().catch(err => { console.error(err.message); process.exit(1) })
