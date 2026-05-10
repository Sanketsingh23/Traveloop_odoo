import { Router } from 'express'

import { pool } from '../db/pool.js'
import { authenticate } from '../middleware/auth.js'

const checklistRouter = Router()

const categories = ['Clothes', 'Electronics', 'Documents', 'Toiletries', 'Medicines'] as const
type ChecklistCategory = (typeof categories)[number]

const ensureChecklistTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      packed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

const isChecklistCategory = (value: string): value is ChecklistCategory => {
  return categories.includes(value as ChecklistCategory)
}

const mapRowToChecklistItem = (row: any) => ({
  id: String(row.id),
  title: row.title,
  category: row.category,
  packed: Boolean(row.packed),
  createdAt: row.created_at?.toISOString?.() ?? row.created_at,
})

checklistRouter.get('/', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)

  try {
    await ensureChecklistTable()
    const result = await pool.query(
      `SELECT id, title, category, packed, created_at
       FROM checklist_items
       WHERE user_id = $1
       ORDER BY packed ASC, created_at DESC`,
      [userId],
    )

    return res.status(200).json({ success: true, items: result.rows.map(mapRowToChecklistItem) })
  } catch (error) {
    console.error('Fetch checklist error', error)
    return res.status(500).json({ success: false, message: 'Failed to load checklist' })
  }
})

checklistRouter.post('/', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const title = String(req.body.title ?? '').trim()
  const category = String(req.body.category ?? '').trim()

  if (!title || !isChecklistCategory(category)) {
    return res.status(400).json({ success: false, message: 'Item name and valid category are required' })
  }

  try {
    await ensureChecklistTable()
    const result = await pool.query(
      `INSERT INTO checklist_items (user_id, title, category)
       VALUES ($1, $2, $3)
       RETURNING id, title, category, packed, created_at`,
      [userId, title, category],
    )

    return res.status(201).json({ success: true, item: mapRowToChecklistItem(result.rows[0]) })
  } catch (error) {
    console.error('Create checklist item error', error)
    return res.status(500).json({ success: false, message: 'Failed to add checklist item' })
  }
})

checklistRouter.put('/:id', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { id } = req.params
  const title = req.body.title === undefined ? undefined : String(req.body.title).trim()
  const category = req.body.category === undefined ? undefined : String(req.body.category).trim()
  const packed = req.body.packed === undefined ? undefined : Boolean(req.body.packed)

  if (title !== undefined && !title) {
    return res.status(400).json({ success: false, message: 'Item name cannot be empty' })
  }

  if (category !== undefined && !isChecklistCategory(category)) {
    return res.status(400).json({ success: false, message: 'Valid category is required' })
  }

  try {
    await ensureChecklistTable()
    const existing = await pool.query(
      `SELECT title, category, packed
       FROM checklist_items
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    const current = existing.rows[0]
    const result = await pool.query(
      `UPDATE checklist_items
       SET title = $1, category = $2, packed = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, title, category, packed, created_at`,
      [title ?? current.title, category ?? current.category, packed ?? current.packed, id, userId],
    )

    return res.status(200).json({ success: true, item: mapRowToChecklistItem(result.rows[0]) })
  } catch (error) {
    console.error('Update checklist item error', error)
    return res.status(500).json({ success: false, message: 'Failed to update checklist item' })
  }
})

checklistRouter.delete('/:id', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { id } = req.params

  try {
    await ensureChecklistTable()
    const result = await pool.query('DELETE FROM checklist_items WHERE id = $1 AND user_id = $2', [id, userId])

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    return res.status(200).json({ success: true, message: 'Checklist item removed successfully' })
  } catch (error) {
    console.error('Delete checklist item error', error)
    return res.status(500).json({ success: false, message: 'Failed to remove checklist item' })
  }
})

export { checklistRouter }
