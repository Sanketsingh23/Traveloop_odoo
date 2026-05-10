import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Request } from 'express'

import { findUserByEmail } from '../data/users.js'
import { requireSupabase, supabase } from '../db/supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const registeredUsersPath = path.join(__dirname, '../data/registered-users.json')

type RegisteredUser = {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  country: string
  passwordHash: string
}

const loadRegisteredUsers = async (): Promise<RegisteredUser[]> => {
  try {
    const data = await fs.readFile(registeredUsersPath, 'utf-8')
    return JSON.parse(data) as RegisteredUser[]
  } catch {
    return []
  }
}

const findOrCreateUserByEmail = async (email: string) => {
  requireSupabase()

  const normalizedEmail = email.trim().toLowerCase()
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return Number(existing.id)

  const registeredUsers = await loadRegisteredUsers()
  const fileUser = registeredUsers.find((user) => user.email.toLowerCase() === normalizedEmail)
  if (fileUser) {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          first_name: fileUser.firstName,
          last_name: fileUser.lastName,
          email: normalizedEmail,
          phone: fileUser.phone,
          city: fileUser.city,
          country: fileUser.country,
          password_hash: fileUser.passwordHash,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single()

    if (error) throw error
    return Number(data.id)
  }

  const demoUser = findUserByEmail(normalizedEmail)
  if (demoUser) {
    const [firstName, ...lastNameParts] = demoUser.name.split(' ')
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          first_name: firstName || 'TravelLoop',
          last_name: lastNameParts.join(' ') || 'Demo',
          email: normalizedEmail,
          phone: '0000000000',
          city: 'Demo City',
          country: 'Demo Country',
          password_hash: demoUser.passwordHash,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single()

    if (error) throw error
    return Number(data.id)
  }

  return null
}

export const resolveAuthenticatedUserId = async (req: Request) => {
  const tokenUserId = Number(req.user?.userId)
  if (Number.isInteger(tokenUserId) && tokenUserId > 0) {
    return tokenUserId
  }

  if (!req.user?.email) {
    return null
  }

  return findOrCreateUserByEmail(req.user.email)
}
