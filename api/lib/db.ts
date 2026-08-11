import postgres from 'postgres'

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is required')
}

const sql = postgres(process.env.POSTGRES_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

export { sql }
