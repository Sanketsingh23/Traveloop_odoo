import bcrypt from 'bcrypt'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

import { pool } from '../db/pool.js'
import { env } from '../config/env.js'
import { addUser, findUserByEmail } from '../data/users.js'

const authRouter = Router()

const ensureUsersTable = async () => {
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
    if (env.databaseUrl) {
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
    }
  } catch (error) {
    console.error('Login lookup error', error)
  }

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
    if (env.databaseUrl) {
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
    }
  } catch (error) {
    console.error('Demo login migration error', error)
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

  const normalizedEmail = email.trim().toLowerCase()

  if (!env.databaseUrl) {
    if (findUserByEmail(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = `local_${Date.now()}`

    addUser({
      id: userId,
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: normalizedEmail,
      passwordHash,
    })

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        city: city.trim(),
        country: country.trim(),
      },
    })
  }

  try {
    await ensureUsersTable()

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
  } catch (error) {
    console.error('Registration error', error)
    return res.status(500).json({
      success: false,
      message: 'Registration failed due to server error',
    })
  }
})

export { authRouter }
