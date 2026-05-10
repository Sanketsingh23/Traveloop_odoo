import path from 'path'
import { Router } from 'express'
import multer from 'multer'

import { pool } from '../db/pool.js'
import { authenticate } from '../middleware/auth.js'

const tripsRouter = Router()
const uploadsDir = path.resolve(process.cwd(), 'uploads')
const upload = multer({ dest: uploadsDir })

const ensureTripsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trips (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      destination VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      cover_image VARCHAR(1024),
      budget_limit NUMERIC(12,2) NOT NULL,
      travel_type VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL,
      destination_count INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

const calculateStatus = (startDate: string, endDate: string) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start <= now && end >= now) return 'Ongoing'
  if (start > now) return 'Upcoming'
  return 'Completed'
}

const mapRowToTrip = (row: any) => ({
  id: String(row.id),
  name: row.title,
  destination: row.destination,
  destinationCount: row.destination_count,
  startDate: row.start_date.toISOString().slice(0, 10),
  endDate: row.end_date.toISOString().slice(0, 10),
  status: row.status,
  budget: Number(row.budget_limit),
  coverImage: row.cover_image ?? '',
})

const daysBetweenInclusive = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const difference = end.getTime() - start.getTime()
  return Math.max(1, Math.floor(difference / 86400000) + 1)
}

tripsRouter.get('/', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)

  try {
    await ensureTripsTable()
    const result = await pool.query(
      `SELECT id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count
       FROM trips
       WHERE user_id = $1
       ORDER BY start_date ASC`,
      [userId],
    )

    return res.status(200).json({
      success: true,
      trips: result.rows.map(mapRowToTrip),
    })
  } catch (error) {
    console.error('Fetch trips error', error)
    return res.status(500).json({ success: false, message: 'Failed to load trips' })
  }
})

tripsRouter.get('/recent', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const userName = req.user?.email?.split('@')[0] ?? 'Traveler'

  try {
    await ensureTripsTable()
    const result = await pool.query(
      `SELECT id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count
       FROM trips
       WHERE user_id = $1
       ORDER BY start_date ASC
       LIMIT 3`,
      [userId],
    )

    return res.status(200).json({
      success: true,
      trips: result.rows.map(mapRowToTrip),
      recommendedDestinations: [
        { id: 'dest_001', name: 'Santorini', country: 'Greece' },
        { id: 'dest_002', name: 'Queenstown', country: 'New Zealand' },
        { id: 'dest_003', name: 'Marrakesh', country: 'Morocco' },
      ],
      userLabel: userName,
    })
  } catch (error) {
    console.error('Fetch recent trips error', error)
    return res.status(500).json({ success: false, message: 'Failed to load recent trips' })
  }
})

tripsRouter.get('/:id/summary', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { id } = req.params

  try {
    await ensureTripsTable()
    await ensureStopsTable()
    await ensureActivitiesTable()

    const tripResult = await pool.query(
      `SELECT id, title, destination, start_date, end_date, budget_limit, status
       FROM trips
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (tripResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const trip = tripResult.rows[0]
    const stopsResult = await pool.query(
      `SELECT id, city, order_index, start_date, end_date, notes
       FROM stops
       WHERE trip_id = $1
       ORDER BY order_index ASC, start_date ASC`,
      [id],
    )

    const stops = await Promise.all(
      stopsResult.rows.map(async (stop: any) => {
        const activitiesResult = await pool.query(
          `SELECT id, title, description, activity_date, start_time, end_time, cost, order_index
           FROM activities
           WHERE stop_id = $1
           ORDER BY activity_date ASC, start_time ASC NULLS LAST, order_index ASC`,
          [stop.id],
        )

        return {
          id: String(stop.id),
          city: stop.city,
          orderIndex: stop.order_index,
          startDate: stop.start_date.toISOString().slice(0, 10),
          endDate: stop.end_date?.toISOString().slice(0, 10),
          notes: stop.notes ?? '',
          activities: activitiesResult.rows.map((activity: any) => ({
            id: String(activity.id),
            title: activity.title,
            description: activity.description ?? '',
            activityDate: activity.activity_date.toISOString().slice(0, 10),
            startTime: activity.start_time,
            endTime: activity.end_time,
            cost: activity.cost ? Number(activity.cost) : 0,
            orderIndex: activity.order_index,
          })),
        }
      }),
    )

    return res.status(200).json({
      success: true,
      trip: {
        id: String(trip.id),
        name: trip.title,
        destination: trip.destination,
        startDate: trip.start_date.toISOString().slice(0, 10),
        endDate: trip.end_date.toISOString().slice(0, 10),
        status: trip.status,
        budget: Number(trip.budget_limit),
        totalDays: daysBetweenInclusive(trip.start_date, trip.end_date),
      },
      stops,
    })
  } catch (error) {
    console.error('Fetch trip summary error', error)
    return res.status(500).json({ success: false, message: 'Failed to load trip summary' })
  }
})

tripsRouter.get('/:id', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { id } = req.params

  try {
    await ensureTripsTable()
    const result = await pool.query(
      `SELECT id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count
       FROM trips
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    return res.status(200).json({ success: true, trip: mapRowToTrip(result.rows[0]) })
  } catch (error) {
    console.error('Fetch trip detail error', error)
    return res.status(500).json({ success: false, message: 'Failed to load trip details' })
  }
})

tripsRouter.put('/:id', authenticate, upload.single('coverImage'), async (req, res) => {
  const userId = Number(req.user?.userId)
  const { id } = req.params
  const title = String(req.body.title ?? '').trim()
  const destination = String(req.body.destination ?? 'Multiple destinations').trim() || 'Multiple destinations'
  const description = String(req.body.description ?? '').trim()
  const startDate = String(req.body.startDate ?? '').trim()
  const endDate = String(req.body.endDate ?? '').trim()
  const budgetLimit = Number(req.body.budgetLimit)
  const travelType = String(req.body.travelType ?? '').trim()
  const coverImageUrl = String(req.body.coverImageUrl ?? '').trim()

  if (!title || !destination || !startDate || !endDate || !travelType || !budgetLimit || Number.isNaN(budgetLimit) || budgetLimit <= 0) {
    return res.status(400).json({ success: false, message: 'Missing or invalid trip fields' })
  }

  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before start date' })
  }

  try {
    await ensureTripsTable()
    const existing = await pool.query('SELECT cover_image FROM trips WHERE id = $1 AND user_id = $2', [id, userId])
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const coverImage = req.file ? `/uploads/${req.file.filename}` : coverImageUrl || existing.rows[0].cover_image
    const status = calculateStatus(startDate, endDate)

    const updateResult = await pool.query(
      `UPDATE trips
       SET title = $1,
           destination = $2,
           description = $3,
           start_date = $4,
           end_date = $5,
           cover_image = $6,
           budget_limit = $7,
           travel_type = $8,
           status = $9
       WHERE id = $10 AND user_id = $11
       RETURNING id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count`,
      [title, destination, description, startDate, endDate, coverImage, budgetLimit, travelType, status, id, userId],
    )

    return res.status(200).json({ success: true, trip: mapRowToTrip(updateResult.rows[0]) })
  } catch (error) {
    console.error('Update trip error', error)
    return res.status(500).json({ success: false, message: 'Failed to update trip' })
  }
})

tripsRouter.post('/', authenticate, upload.single('coverImage'), async (req, res) => {
  const userId = Number(req.user?.userId)
  const title = String(req.body.title ?? '').trim()
  const destination = String(req.body.destination ?? 'Multiple destinations').trim() || 'Multiple destinations'
  const description = String(req.body.description ?? '').trim()
  const startDate = String(req.body.startDate ?? '').trim()
  const endDate = String(req.body.endDate ?? '').trim()
  const budgetLimit = Number(req.body.budgetLimit)
  const travelType = String(req.body.travelType ?? '').trim()
  const coverImageUrl = String(req.body.coverImageUrl ?? '').trim()

  if (!title || !destination || !startDate || !endDate || !travelType || !budgetLimit || Number.isNaN(budgetLimit) || budgetLimit <= 0) {
    return res.status(400).json({ success: false, message: 'Missing or invalid trip fields' })
  }

  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before start date' })
  }

  const status = calculateStatus(startDate, endDate)
  const coverImage = req.file ? `/uploads/${req.file.filename}` : coverImageUrl || null

  try {
    await ensureTripsTable()
    const insertResult = await pool.query(
      `INSERT INTO trips (user_id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count`,
      [userId, title, destination, description, startDate, endDate, coverImage, budgetLimit, travelType, status, 1],
    )

    return res.status(201).json({ success: true, trip: mapRowToTrip(insertResult.rows[0]) })
  } catch (error) {
    console.error('Create trip error', error)
    return res.status(500).json({ success: false, message: 'Failed to create trip' })
  }
})

tripsRouter.delete('/:id', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { id } = req.params

  try {
    await ensureTripsTable()
    const result = await pool.query('DELETE FROM trips WHERE id = $1 AND user_id = $2', [id, userId])

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    return res.status(200).json({ success: true, message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Delete trip error', error)
    return res.status(500).json({ success: false, message: 'Failed to delete trip' })
  }
})

export { tripsRouter }

const ensureStopsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stops (
      id SERIAL PRIMARY KEY,
      trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      city VARCHAR(255) NOT NULL,
      order_index INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

const ensureActivitiesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      stop_id INT NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      activity_date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      cost NUMERIC(10,2),
      order_index INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

tripsRouter.get('/:tripId/itinerary', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { tripId } = req.params

  try {
    await ensureStopsTable()
    await ensureActivitiesTable()
    
    const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId])
    if (tripResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const stopsResult = await pool.query(
      `SELECT id, city, order_index, start_date, end_date, notes FROM stops WHERE trip_id = $1 ORDER BY order_index ASC`,
      [tripId],
    )

    const stops = await Promise.all(
      stopsResult.rows.map(async (stop: any) => {
        const activitiesResult = await pool.query(
          `SELECT id, title, description, activity_date, start_time, end_time, cost, order_index FROM activities WHERE stop_id = $1 ORDER BY order_index ASC`,
          [stop.id],
        )
        return {
          id: String(stop.id),
          city: stop.city,
          orderIndex: stop.order_index,
          startDate: stop.start_date.toISOString().slice(0, 10),
          endDate: stop.end_date?.toISOString().slice(0, 10),
          notes: stop.notes ?? '',
          activities: activitiesResult.rows.map((activity: any) => ({
            id: String(activity.id),
            title: activity.title,
            description: activity.description ?? '',
            activityDate: activity.activity_date.toISOString().slice(0, 10),
            startTime: activity.start_time,
            endTime: activity.end_time,
            cost: activity.cost ? Number(activity.cost) : 0,
            orderIndex: activity.order_index,
          })),
        }
      }),
    )

    return res.status(200).json({ success: true, stops })
  } catch (error) {
    console.error('Fetch itinerary error', error)
    return res.status(500).json({ success: false, message: 'Failed to load itinerary' })
  }
})

tripsRouter.post('/:tripId/stops', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { tripId } = req.params
  const { city, startDate, endDate, notes, orderIndex } = req.body as {
    city?: string
    startDate?: string
    endDate?: string
    notes?: string
    orderIndex?: number
  }

  if (!city || !startDate) {
    return res.status(400).json({ success: false, message: 'City and start date are required' })
  }

  try {
    await ensureStopsTable()
    const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId])
    if (tripResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const insertResult = await pool.query(
      `INSERT INTO stops (trip_id, city, order_index, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, city, order_index, start_date, end_date, notes`,
      [tripId, city, orderIndex ?? 0, startDate, endDate ?? null, notes ?? ''],
    )

    const stop = insertResult.rows[0]
    return res.status(201).json({
      success: true,
      stop: {
        id: String(stop.id),
        city: stop.city,
        orderIndex: stop.order_index,
        startDate: stop.start_date.toISOString().slice(0, 10),
        endDate: stop.end_date?.toISOString().slice(0, 10),
        notes: stop.notes ?? '',
      },
    })
  } catch (error) {
    console.error('Create stop error', error)
    return res.status(500).json({ success: false, message: 'Failed to create stop' })
  }
})

tripsRouter.post('/:tripId/stops/:stopId/activities', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { tripId, stopId } = req.params
  const { title, description, activityDate, startTime, endTime, cost, orderIndex } = req.body as {
    title?: string
    description?: string
    activityDate?: string
    startTime?: string
    endTime?: string
    cost?: number
    orderIndex?: number
  }

  if (!title || !activityDate) {
    return res.status(400).json({ success: false, message: 'Title and activity date are required' })
  }

  try {
    await ensureStopsTable()
    const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId])
    if (tripResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const stopResult = await pool.query('SELECT id FROM stops WHERE id = $1 AND trip_id = $2', [stopId, tripId])
    if (stopResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Stop not found' })
    }

    await ensureActivitiesTable()
    const insertResult = await pool.query(
      `INSERT INTO activities (stop_id, title, description, activity_date, start_time, end_time, cost, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, activity_date, start_time, end_time, cost, order_index`,
      [stopId, title, description ?? '', activityDate, startTime ?? null, endTime ?? null, cost ?? 0, orderIndex ?? 0],
    )

    const activity = insertResult.rows[0]
    return res.status(201).json({
      success: true,
      activity: {
        id: String(activity.id),
        title: activity.title,
        description: activity.description ?? '',
        activityDate: activity.activity_date.toISOString().slice(0, 10),
        startTime: activity.start_time,
        endTime: activity.end_time,
        cost: activity.cost ? Number(activity.cost) : 0,
        orderIndex: activity.order_index,
      },
    })
  } catch (error) {
    console.error('Create activity error', error)
    return res.status(500).json({ success: false, message: 'Failed to create activity' })
  }
})

tripsRouter.put('/:tripId/activities/:activityId', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { tripId, activityId } = req.params
  const { title, description, startTime, endTime, cost } = req.body

  try {
    const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId])
    if (tripResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const updateResult = await pool.query(
      `UPDATE activities SET title = $1, description = $2, start_time = $3, end_time = $4, cost = $5
       WHERE id = $7 AND stop_id IN (SELECT id FROM stops WHERE trip_id = $6)
       RETURNING id, title, description, activity_date, start_time, end_time, cost, order_index`,
      [title ?? '', description ?? '', startTime ?? null, endTime ?? null, cost ?? 0, tripId, activityId],
    )

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' })
    }

    const activity = updateResult.rows[0]
    return res.status(200).json({
      success: true,
      activity: {
        id: String(activity.id),
        title: activity.title,
        description: activity.description ?? '',
        activityDate: activity.activity_date.toISOString().slice(0, 10),
        startTime: activity.start_time,
        endTime: activity.end_time,
        cost: activity.cost ? Number(activity.cost) : 0,
        orderIndex: activity.order_index,
      },
    })
  } catch (error) {
    console.error('Update activity error', error)
    return res.status(500).json({ success: false, message: 'Failed to update activity' })
  }
})

tripsRouter.delete('/:tripId/activities/:activityId', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { tripId, activityId } = req.params

  try {
    const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId])
    if (tripResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const result = await pool.query(
      `DELETE FROM activities WHERE id = $1 AND stop_id IN (SELECT id FROM stops WHERE trip_id = $2)`,
      [activityId, tripId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' })
    }

    return res.status(200).json({ success: true, message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Delete activity error', error)
    return res.status(500).json({ success: false, message: 'Failed to delete activity' })
  }
})
