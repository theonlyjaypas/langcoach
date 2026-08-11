import { sql } from './db'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function initializeDatabase(): Promise<void> {
  try {
    const schemaPath = join(import.meta.url, '../../schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    const statements = schema.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement)
      }
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error)
}
