import { createClient } from '@supabase/supabase-js'
import type { WebSocketLikeConstructor } from '@supabase/realtime-js'
import WebSocket from 'ws'

import { env } from '../config/env.js'

const createUnavailableSupabase = (message: string) => {
  const terminalResult = Promise.resolve({
    data: null,
    error: new Error(message),
  })

  const proxyTarget = () => proxy

  const proxy = new Proxy(proxyTarget, {
    apply: () => proxy,
    get: (_target, property) => {
      if (property === 'then') {
        return (resolve: (value: unknown) => void) => resolve(terminalResult)
      }

      if (property === 'catch') {
        return () => terminalResult
      }

      if (property === 'finally') {
        return (handler: () => void) => terminalResult.finally(handler)
      }

      return proxy
    },
  })

  return proxy
}

export const supabase = env.supabaseUrl && env.supabaseKey
  ? createClient(env.supabaseUrl, env.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: WebSocket as unknown as WebSocketLikeConstructor,
      },
    })
  : createUnavailableSupabase('Supabase is not configured')

if (!env.supabaseUrl || !env.supabaseKey) {
  console.warn('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.')
}

export const requireSupabase = () => {
  if (!env.supabaseUrl || !env.supabaseKey) {
    throw new Error('Supabase is not configured')
  }
}
