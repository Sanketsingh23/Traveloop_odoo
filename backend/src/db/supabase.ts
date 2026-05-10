import { createClient } from '@supabase/supabase-js'
import type { WebSocketLikeConstructor } from '@supabase/realtime-js'
import WebSocket from 'ws'

import { env } from '../config/env.js'

if (!env.supabaseUrl || !env.supabaseKey) {
  console.warn('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.')
}

export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: WebSocket as unknown as WebSocketLikeConstructor,
  },
})

export const requireSupabase = () => {
  if (!env.supabaseUrl || !env.supabaseKey) {
    throw new Error('Supabase is not configured')
  }
}
