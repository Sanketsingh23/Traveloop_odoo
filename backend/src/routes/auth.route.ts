import bcrypt from 'bcrypt'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { env } from '../config/env.js'
import { findUserByEmail } from '../data/users.js'
import { requireSupabase, supabase } from '../db/supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const usersFilePath = path.join(__dirname, '../data/registered-users.json')

const authRouter = Router()

const loadRegisteredUsers = async () => {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

const saveRegisteredUsers = async (users: any[]) => {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2))
}

const signToken = (userId: string | number, email: string) =>
  jwt.sign(
    { userId: String(userId), email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
  )

const toAuthUser = (user: any) => ({
  id: String(user.id),
  name: `${user.first_name} ${user.last_name}`.trim(),
  email: user.email,
})

const toFileAuthUser = (user: any) => ({
  id: String(user.id),
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
})

const findFileUser = async (email: string) => {
  const registeredUsers = await loadRegisteredUsers()
  return registeredUsers.find((user: any) => user.email === email)
}

const migrateFileUser = async (fileUser: any, email: string) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        first_name: fileUser.firstName,
        last_name: fileUser.lastName,
        email,
        phone: fileUser.phone,
        city: fileUser.city,
        country: fileUser.country,
        password_hash: fileUser.passwordHash,
      },
      { onConflict: 'email' },
    )
    .select('id, first_name, last_name, email')
    .single()

  if (error) throw error
  return data
}

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    })
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    requireSupabase()

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) throw error

    if (dbUser) {
      const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash)
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' })
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: signToken(dbUser.id, dbUser.email),
        user: toAuthUser(dbUser),
      })
    }

    const fileUser = await findFileUser(normalizedEmail)
    if (fileUser) {
      const isPasswordValid = await bcrypt.compare(password, fileUser.passwordHash)
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' })
      }

      const migratedUser = await migrateFileUser(fileUser, normalizedEmail)
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: signToken(migratedUser.id, migratedUser.email),
        user: toAuthUser(migratedUser),
      })
    }

    const demoUser = findUserByEmail(normalizedEmail)
    if (demoUser) {
      const isPasswordValid = await bcrypt.compare(password, demoUser.passwordHash)
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' })
      }

      const [firstName, ...lastNameParts] = demoUser.name.split(' ')
      const { data: migratedUser, error: migrationError } = await supabase
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
        .select('id, first_name, last_name, email')
        .single()

      if (migrationError) throw migrationError

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: signToken(migratedUser.id, migratedUser.email),
        user: toAuthUser(migratedUser),
      })
    }

    return res.status(404).json({ success: false, message: 'Email is not registered' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Supabase login failed:', errorMessage, 'Falling back to file-based storage...')

    try {
      const fileUser = await findFileUser(normalizedEmail)
      if (fileUser) {
        const isPasswordValid = await bcrypt.compare(password, fileUser.passwordHash)
        if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' })
        }

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token: signToken(fileUser.id, fileUser.email),
          user: toFileAuthUser(fileUser),
        })
      }

      const demoUser = findUserByEmail(normalizedEmail)
      if (demoUser) {
        const isPasswordValid = await bcrypt.compare(password, demoUser.passwordHash)
        if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' })
        }

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token: signToken(demoUser.id, demoUser.email),
          user: {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
          },
        })
      }

      return res.status(404).json({ success: false, message: 'Email is not registered' })
    } catch (fileError) {
      const fileErrorMessage = fileError instanceof Error ? fileError.message : String(fileError)
      console.error('File-based login also failed:', fileErrorMessage)
      return res.status(500).json({ success: false, message: 'Login failed due to server error' })
    }
  }
})

authRouter.post('/register', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    city,
    country,
    password,
    confirmPassword,
  } = req.body as {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    city?: string
    country?: string
    password?: string
    confirmPassword?: string
  }

  if (!firstName || !lastName || !email || !phone || !city || !country || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' })
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' })
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    requireSupabase()

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingError) throw existingError
    if (existingUser || findUserByEmail(normalizedEmail) || await findFileUser(normalizedEmail)) {
      return res.status(409).json({ success: false, message: 'Email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        city: city.trim(),
        country: country.trim(),
        password_hash: passwordHash,
      })
      .select('id, first_name, last_name, email, phone, city, country')
      .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: String(newUser.id),
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        city: newUser.city,
        country: newUser.country,
      },
    })
  } catch (dbError) {
    const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError)
    console.error('Supabase registration failed:', dbErrorMessage, 'Falling back to file-based storage...')

    try {
      const registeredUsers = await loadRegisteredUsers()

      if (registeredUsers.some((user: any) => user.email === normalizedEmail)) {
        return res.status(409).json({ success: false, message: 'Email is already registered' })
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = {
        id: Math.random().toString(36).slice(2, 11),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        city: city.trim(),
        country: country.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
      }

      registeredUsers.push(newUser)
      await saveRegisteredUsers(registeredUsers)

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          city: newUser.city,
          country: newUser.country,
        },
      })
    } catch (fileError) {
      const fileErrorMessage = fileError instanceof Error ? fileError.message : String(fileError)
      console.error('File-based registration also failed:', fileErrorMessage)
      return res.status(500).json({ success: false, message: 'Registration failed due to server error' })
    }
  }
})

export { authRouter }
