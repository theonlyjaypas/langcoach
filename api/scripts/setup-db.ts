import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

const __dirname = join(fileURLToPath(import.meta.url), '..')

async function setupDatabase() {
  if (!process.env.POSTGRES_URL) {
    console.error('Error: POSTGRES_URL environment variable is not set')
    console.error('Set it in your .env file or as an environment variable')
    process.exit(1)
  }

  const sql = postgres(process.env.POSTGRES_URL)

  try {
    const schemaPath = join(__dirname, '..', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    console.log(`Executing ${statements.length} SQL statements...`)

    for (const statement of statements) {
      await sql.unsafe(statement)
      console.log('✓', statement.substring(0, 60) + '...')
    }

    console.log('\nDatabase setup completed successfully!')
    await sql.end()
  } catch (error) {
    console.error('Database setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()
