import { Pool } from 'pg'

import { env } from '../config/env.js'

if (!env.databaseUrl) {
  console.warn('DATABASE_URL is not configured. Auth will use the local in-memory fallback.')
}

export const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
})
