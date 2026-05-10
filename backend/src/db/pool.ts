import { Pool } from 'pg'

import { env } from '../config/env.js'

if (!env.databaseUrl) {
  console.warn('DATABASE_URL is not configured. Registration API will fail until it is set.')
}

export const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
})
