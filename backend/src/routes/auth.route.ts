import bcrypt from 'bcrypt'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { pool } from '../db/pool.js'
import { env } from '../config/env.js'
import { findUserByEmail } from '../data/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const usersFilePath = path.join(__dirname, '../data/registered-users.json')

const authRouter = Router()

// Load users from file
const loadRegisteredUsers = async () => {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Save users to file
const saveRegisteredUsers = async (users: any[]) => {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2))
}

const ensureUsersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(30) NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error creating users table:', errorMessage)
    throw error
  }
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
    await ensureUsersTable()
    const userResult = await pool.query(
      `SELECT id, first_name, last_name, email, password_hash
       FROM users
       WHERE email = $1`,
      [normalizedEmail],
    )

    if (userResult.rowCount && userResult.rowCount > 0) {
      const dbUser = userResult.rows[0]
      const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
      }

      const token = jwt.sign(
        { userId: String(dbUser.id), email: dbUser.email },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
      )

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: String(dbUser.id),
          name: `${dbUser.first_name} ${dbUser.last_name}`.trim(),
          email: dbUser.email,
        },
      })
    }
  } catch (dbError) {
    const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError)
    console.error('Database login failed:', dbErrorMessage, 'Falling back to file-based storage...')

    // Fallback to file-based storage
    try {
      const registeredUsers = await loadRegisteredUsers()
      const user = registeredUsers.find((u: any) => u.email === normalizedEmail)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Email is not registered',
        })
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
      )

      console.log('User logged in successfully using file-based storage (fallback mode)')

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
        },
      })
    } catch (fileError) {
      const fileErrorMessage = fileError instanceof Error ? fileError.message : String(fileError)
      console.error('File-based login also failed:', fileErrorMessage)
      return res.status(500).json({
        success: false,
        message: 'Login failed due to server error',
        error: fileErrorMessage,
      })
    }
  }

  // Fallback to demo users if both database and file storage fail
  const existingUser = findUserByEmail(normalizedEmail)
  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: 'Email is not registered',
    })
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash)
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    })
  }

  try {
    await ensureUsersTable()
    const [firstName, ...lastNameParts] = existingUser.name.split(' ')
    const insertResult = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, city, country, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id, first_name, last_name, email`,
      [
        firstName || 'TravelLoop',
        lastNameParts.join(' ') || 'Demo',
        existingUser.email.toLowerCase(),
        '0000000000',
        'Demo City',
        'Demo Country',
        existingUser.passwordHash,
      ],
    )

    const demoUser = insertResult.rows[0]
    const token = jwt.sign(
      { userId: String(demoUser.id), email: demoUser.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
    )

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: String(demoUser.id),
        name: `${demoUser.first_name} ${demoUser.last_name}`.trim(),
        email: demoUser.email,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Demo login migration error:', errorMessage, error)
  }

  const token = jwt.sign(
    { userId: existingUser.id, email: existingUser.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] },
  )

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    },
  })
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

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !city ||
    !country ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    })
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    })
  }

  try {
    await ensureUsersTable()

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const insertResult = await pool.query(
      `
        INSERT INTO users (first_name, last_name, email, phone, city, country, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, first_name, last_name, email, phone, city, country
      `,
      [
        firstName.trim(),
        lastName.trim(),
        normalizedEmail,
        phone.trim(),
        city.trim(),
        country.trim(),
        passwordHash,
      ],
    )

    const newUser = insertResult.rows[0]

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
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
    console.error('Database registration failed:', dbErrorMessage, 'Falling back to file-based storage...')

    // Fallback to file-based storage when database is unavailable
    try {
      const registeredUsers = await loadRegisteredUsers()
      const normalizedEmail = email.trim().toLowerCase()

      // Check if email already exists
      if (registeredUsers.some((u: any) => u.email === normalizedEmail)) {
        return res.status(409).json({
          success: false,
          message: 'Email is already registered',
        })
      }

      const passwordHash = await bcrypt.hash(password, 10)

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
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

      console.log('User registered successfully using file-based storage (fallback mode)')

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
      return res.status(500).json({
        success: false,
        message: 'Registration failed due to server error',
        error: fileErrorMessage,
      })
    }
  }
})

export { authRouter }
