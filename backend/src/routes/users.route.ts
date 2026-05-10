import path from 'path'
import bcrypt from 'bcrypt'
import { Router } from 'express'
import multer from 'multer'

import { authenticate } from '../middleware/auth.js'
import { supabase } from '../db/supabase.js'
import { resolveAuthenticatedUserId } from '../utils/auth-user.js'

const usersRouter = Router()
const uploadsDir = path.resolve(process.cwd(), 'uploads')
const upload = multer({ dest: uploadsDir })

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
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) return res.status(404).json({ success: false, message: 'Profile not found' })

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, city, country, profile_image, preferred_destinations, travel_preferences')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) return res.status(404).json({ success: false, message: 'Profile not found' })

    return res.status(200).json({ success: true, profile: mapRowToProfile(data) })
  } catch (error) {
    console.error('Fetch profile error', error)
    return res.status(500).json({ success: false, message: 'Failed to load profile' })
  }
})

usersRouter.put('/profile', authenticate, upload.single('profileImage'), async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) return res.status(404).json({ success: false, message: 'Profile not found' })

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
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('profile_image')
      .eq('id', userId)
      .maybeSingle()

    if (existingError) throw existingError
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found' })

    const { data: duplicate, error: duplicateError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle()

    if (duplicateError) throw duplicateError
    if (duplicate) return res.status(409).json({ success: false, message: 'Email is already in use' })

    const profileImage = req.file ? `/uploads/${req.file.filename}` : String(req.body.profileImageUrl ?? existing.profile_image ?? '').trim()
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        city,
        country,
        profile_image: profileImage,
        preferred_destinations: preferredDestinations,
        travel_preferences: travelPreferences,
      })
      .eq('id', userId)
      .select('id, first_name, last_name, email, phone, city, country, profile_image, preferred_destinations, travel_preferences')
      .single()

    if (error) throw error
    return res.status(200).json({ success: true, profile: mapRowToProfile(data) })
  } catch (error) {
    console.error('Update profile error', error)
    return res.status(500).json({ success: false, message: 'Failed to update profile' })
  }
})

usersRouter.put('/profile/password', authenticate, async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  const currentPassword = String(req.body.currentPassword ?? '')
  const newPassword = String(req.body.newPassword ?? '')

  if (!userId) return res.status(404).json({ success: false, message: 'Profile not found' })
  if (!currentPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Current password and an 8 character new password are required' })
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!user) return res.status(404).json({ success: false, message: 'Profile not found' })

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    const { error } = await supabase.from('users').update({ password_hash: passwordHash }).eq('id', userId)
    if (error) throw error

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
      { id: 'rem_001', title: 'Visa check for Japan trip', date: '2026-06-20' },
      { id: 'rem_002', title: 'Book airport transfer for Kyoto', date: '2026-06-28' },
      { id: 'rem_003', title: 'Travel insurance renewal', date: '2026-07-01' },
    ],
  })
})

export { usersRouter }
