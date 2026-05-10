import { Router } from 'express'

import { supabase } from '../db/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { resolveAuthenticatedUserId } from '../utils/auth-user.js'

const checklistRouter = Router()

const mapRowToChecklistItem = (row: any) => ({
  id: String(row.id),
  title: row.title,
  category: row.category,
  packed: row.packed,
  createdAt: row.created_at,
})

checklistRouter.get('/', authenticate, async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) return res.status(401).json({ success: false, message: 'Invalid user session' })

  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('id, title, category, packed, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return res.status(200).json({ success: true, items: (data ?? []).map(mapRowToChecklistItem) })
  } catch (error) {
    console.error('Fetch checklist error', error)
    return res.status(500).json({ success: false, message: 'Failed to load checklist' })
  }
})

checklistRouter.post('/', authenticate, async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) return res.status(401).json({ success: false, message: 'Invalid user session' })
  const title = String(req.body.title ?? '').trim()
  const category = String(req.body.category ?? '').trim()

  if (!title || !category) {
    return res.status(400).json({ success: false, message: 'Title and category are required' })
  }

  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({ user_id: userId, title, category })
      .select('id, title, category, packed, created_at')
      .single()

    if (error) throw error
    return res.status(201).json({ success: true, item: mapRowToChecklistItem(data) })
  } catch (error) {
    console.error('Create checklist item error', error)
    return res.status(500).json({ success: false, message: 'Failed to add checklist item' })
  }
})

checklistRouter.put('/:id', authenticate, async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) return res.status(401).json({ success: false, message: 'Invalid user session' })
  const { id } = req.params
  const title = req.body.title === undefined ? undefined : String(req.body.title).trim()
  const category = req.body.category === undefined ? undefined : String(req.body.category).trim()
  const packed = req.body.packed === undefined ? undefined : Boolean(req.body.packed)

  try {
    const { data: existing, error: existingError } = await supabase
      .from('checklist_items')
      .select('title, category, packed')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) throw existingError
    if (!existing) return res.status(404).json({ success: false, message: 'Checklist item not found' })

    const { data, error } = await supabase
      .from('checklist_items')
      .update({
        title: title ?? existing.title,
        category: category ?? existing.category,
        packed: packed ?? existing.packed,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, category, packed, created_at')
      .single()

    if (error) throw error
    return res.status(200).json({ success: true, item: mapRowToChecklistItem(data) })
  } catch (error) {
    console.error('Update checklist item error', error)
    return res.status(500).json({ success: false, message: 'Failed to update checklist item' })
  }
})

checklistRouter.delete('/:id', authenticate, async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) return res.status(401).json({ success: false, message: 'Invalid user session' })
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) throw error
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    return res.status(200).json({ success: true, message: 'Checklist item removed' })
  } catch (error) {
    console.error('Delete checklist item error', error)
    return res.status(500).json({ success: false, message: 'Failed to remove checklist item' })
  }
})

export { checklistRouter }
