import path from 'path'
import bcrypt from 'bcrypt'
import { Router } from 'express'
import multer from 'multer'

import { authenticate } from '../middleware/auth.js'
import { pool } from '../db/pool.js'

const usersRouter = Router()
const uploadsDir = path.resolve(process.cwd(), 'uploads')
const upload = multer({ dest: uploadsDir })

const ensureProfileColumns = async () => {
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

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(1024)')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_destinations JSONB NOT NULL DEFAULT \'[]\'::jsonb')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS travel_preferences JSONB NOT NULL DEFAULT \'[]\'::jsonb')
}

const safeList = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
}

const parseList = (value: unknown) => {
  try {
    return safeList(JSON.parse(String(value ?? '[]')))
  } catch {
    return []
  }
}

const mapRowToProfile = (row: any) => ({
  id: String(row.id),
  firstName: row.first_name,
  lastName: row.last_name,
  name: `${row.first_name} ${row.last_name}`.trim(),
  email: row.email,
  phone: row.phone,
  city: row.city,
  country: row.country,
  profileImage: row.profile_image ?? '',
  preferredDestinations: safeList(row.preferred_destinations),
  travelPreferences: safeList(row.travel_preferences),
})

usersRouter.get('/profile', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)

  if (!Number.isFinite(userId)) {
    return res.status(404).json({ success: false, message: 'Profile not found' })
  }

  try {
    await ensureProfileColumns()
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, city, country, profile_image, preferred_destinations, travel_preferences
       FROM users
       WHERE id = $1`,
      [userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }

    return res.status(200).json({ success: true, profile: mapRowToProfile(result.rows[0]) })
  } catch (error) {
    console.error('Fetch profile error', error)
    return res.status(500).json({ success: false, message: 'Failed to load profile' })
  }
})

usersRouter.put('/profile', authenticate, upload.single('profileImage'), async (req, res) => {
  const userId = Number(req.user?.userId)

  if (!Number.isFinite(userId)) {
    return res.status(404).json({ success: false, message: 'Profile not found' })
  }

  const firstName = String(req.body.firstName ?? '').trim()
  const lastName = String(req.body.lastName ?? '').trim()
  const email = String(req.body.email ?? '').trim().toLowerCase()
  const phone = String(req.body.phone ?? '').trim()
  const city = String(req.body.city ?? '').trim()
  const country = String(req.body.country ?? '').trim()
  const preferredDestinations = parseList(req.body.preferredDestinations)
  const travelPreferences = parseList(req.body.travelPreferences)

  if (!firstName || !lastName || !email || !phone || !city || !country) {
    return res.status(400).json({ success: false, message: 'Name, email, phone, city, and country are required' })
  }

  try {
    await ensureProfileColumns()
    const existing = await pool.query('SELECT profile_image FROM users WHERE id = $1', [userId])
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }

    const duplicate = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, userId])
    if (duplicate.rowCount && duplicate.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Email is already in use' })
    }

    const profileImage = req.file ? `/uploads/${req.file.filename}` : String(req.body.profileImageUrl ?? existing.rows[0].profile_image ?? '').trim()
    const result = await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           email = $3,
           phone = $4,
           city = $5,
           country = $6,
           profile_image = $7,
           preferred_destinations = $8::jsonb,
           travel_preferences = $9::jsonb
       WHERE id = $10
       RETURNING id, first_name, last_name, email, phone, city, country, profile_image, preferred_destinations, travel_preferences`,
      [
        firstName,
        lastName,
        email,
        phone,
        city,
        country,
        profileImage,
        JSON.stringify(preferredDestinations),
        JSON.stringify(travelPreferences),
        userId,
      ],
    )

    return res.status(200).json({ success: true, profile: mapRowToProfile(result.rows[0]) })
  } catch (error) {
    console.error('Update profile error', error)
    return res.status(500).json({ success: false, message: 'Failed to update profile' })
  }
})

usersRouter.put('/profile/password', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const currentPassword = String(req.body.currentPassword ?? '')
  const newPassword = String(req.body.newPassword ?? '')

  if (!Number.isFinite(userId)) {
    return res.status(404).json({ success: false, message: 'Profile not found' })
  }

  if (!currentPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Current password and an 8 character new password are required' })
  }

  try {
    await ensureProfileColumns()
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId])
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId])

    return res.status(200).json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Update password error', error)
    return res.status(500).json({ success: false, message: 'Failed to update password' })
  }
})

usersRouter.get('/dashboard-stats', authenticate, (_req, res) => {
  res.status(200).json({
    success: true,
    stats: {
      totalTrips: 12,
      upcomingTrips: 2,
      totalBudget: 6800,
      spent: 3420,
      remaining: 3380,
    },
    reminders: [
      {
        id: 'rem_001',
        title: 'Visa check for Japan trip',
        date: '2026-06-20',
      },
      {
        id: 'rem_002',
        title: 'Book airport transfer for Kyoto',
        date: '2026-06-28',
      },
      {
        id: 'rem_003',
        title: 'Travel insurance renewal',
        date: '2026-07-01',
      },
    ],
  })
})

export { usersRouter }
