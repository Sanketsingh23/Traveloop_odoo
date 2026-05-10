import { Router } from 'express'

import { pool } from '../db/pool.js'
import { authenticate } from '../middleware/auth.js'

const budgetRouter = Router()

const ensureBudgetTables = async () => {
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

const daysBetweenInclusive = (startDate: Date, endDate: Date) => {
  const difference = endDate.getTime() - startDate.getTime()
  return Math.max(1, Math.floor(difference / 86400000) + 1)
}

budgetRouter.get('/:tripId', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId)
  const { tripId } = req.params

  try {
    await ensureBudgetTables()

    const tripResult = await pool.query(
      `SELECT id, title, start_date, end_date, budget_limit
       FROM trips
       WHERE id = $1 AND user_id = $2`,
      [tripId, userId],
    )

    if (tripResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' })
    }

    const trip = tripResult.rows[0]
    const activityResult = await pool.query(
      `SELECT COALESCE(SUM(a.cost), 0) AS activity_cost
       FROM activities a
       INNER JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = $1`,
      [tripId],
    )

    const dayResult = await pool.query(
      `SELECT a.activity_date, COALESCE(SUM(a.cost), 0) AS activity_cost
       FROM activities a
       INNER JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = $1
       GROUP BY a.activity_date
       ORDER BY a.activity_date ASC`,
      [tripId],
    )

    const cityResult = await pool.query(
      `SELECT s.city, COALESCE(SUM(a.cost), 0) AS activity_cost
       FROM stops s
       LEFT JOIN activities a ON a.stop_id = s.id
       WHERE s.trip_id = $1
       GROUP BY s.city
       ORDER BY s.city ASC`,
      [tripId],
    )

    const totalDays = daysBetweenInclusive(trip.start_date, trip.end_date)
    const budgetLimit = Number(trip.budget_limit)
    const activityCost = Number(activityResult.rows[0]?.activity_cost ?? 0)
    const hotelCost = Math.round(totalDays * 95)
    const foodCost = Math.round(totalDays * 42)
    const transportCost = Math.round(Math.max(1, cityResult.rowCount || 1) * 55 + totalDays * 18)
    const totalCost = activityCost + hotelCost + foodCost + transportCost
    const remaining = budgetLimit - totalCost
    const costPerDay = Math.round(totalCost / totalDays)

    const categories = [
      { name: 'Activities', value: activityCost },
      { name: 'Hotel', value: hotelCost },
      { name: 'Food', value: foodCost },
      { name: 'Transport', value: transportCost },
    ]

    const dailyCosts = dayResult.rows.map((row: any) => ({
      date: row.activity_date.toISOString().slice(0, 10),
      activities: Number(row.activity_cost),
      total: Number(row.activity_cost) + Math.round(hotelCost / totalDays) + Math.round(foodCost / totalDays) + Math.round(transportCost / totalDays),
    }))

    const alerts = []
    if (remaining < 0) {
      alerts.push({ type: 'danger', message: `Projected spend is $${Math.abs(remaining).toLocaleString()} over budget.` })
    } else if (totalCost / budgetLimit >= 0.85) {
      alerts.push({ type: 'warning', message: 'Projected spend is above 85% of the trip budget.' })
    } else {
      alerts.push({ type: 'success', message: 'Projected spend is within the current budget.' })
    }

    return res.status(200).json({
      success: true,
      budget: {
        tripId: String(trip.id),
        tripName: trip.title,
        budgetLimit,
        totalCost,
        remaining,
        totalDays,
        costPerDay,
        activityCost,
        hotelCost,
        foodCost,
        transportCost,
        categories,
        dailyCosts,
        cityCosts: cityResult.rows.map((row: any) => ({
          city: row.city,
          activities: Number(row.activity_cost),
        })),
        alerts,
      },
    })
  } catch (error) {
    console.error('Fetch budget error', error)
    return res.status(500).json({ success: false, message: 'Failed to load budget' })
  }
})

export { budgetRouter }
