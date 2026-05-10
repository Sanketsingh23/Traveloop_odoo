import { Router } from 'express'

import { supabase } from '../db/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { resolveAuthenticatedUserId } from '../utils/auth-user.js'

const budgetRouter = Router()

const daysBetweenInclusive = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const difference = end.getTime() - start.getTime()
  return Math.max(1, Math.floor(difference / 86400000) + 1)
}

budgetRouter.get('/:tripId', authenticate, async (req, res) => {
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) return res.status(401).json({ success: false, message: 'Invalid user session' })
  const { tripId } = req.params

  try {
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, title, start_date, end_date, budget_limit')
      .eq('id', tripId)
      .eq('user_id', userId)
      .maybeSingle()

    if (tripError) throw tripError
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const { data: stops, error: stopsError } = await supabase
      .from('stops')
      .select('id, city')
      .eq('trip_id', tripId)

    if (stopsError) throw stopsError

    const stopIds = (stops ?? []).map((stop) => stop.id)
    const { data: activities, error: activitiesError } = stopIds.length
      ? await supabase
          .from('activities')
          .select('activity_date, cost, stop_id')
          .in('stop_id', stopIds)
          .order('activity_date', { ascending: true })
      : { data: [], error: null }

    if (activitiesError) throw activitiesError

    const totalDays = daysBetweenInclusive(trip.start_date, trip.end_date)
    const budgetLimit = Number(trip.budget_limit)
    const activityCost = (activities ?? []).reduce((sum, activity) => sum + Number(activity.cost ?? 0), 0)
    const hotelCost = Math.round(totalDays * 95)
    const foodCost = Math.round(totalDays * 42)
    const transportCost = Math.round(Math.max(1, stops?.length || 1) * 55 + totalDays * 18)
    const totalCost = activityCost + hotelCost + foodCost + transportCost
    const remaining = budgetLimit - totalCost
    const costPerDay = Math.round(totalCost / totalDays)

    const dailyCostMap = new Map<string, number>()
    for (const activity of activities ?? []) {
      const date = String(activity.activity_date)
      dailyCostMap.set(date, (dailyCostMap.get(date) ?? 0) + Number(activity.cost ?? 0))
    }

    const cityCostMap = new Map<string, number>()
    for (const stop of stops ?? []) cityCostMap.set(stop.city, 0)
    for (const activity of activities ?? []) {
      const stop = (stops ?? []).find((item) => item.id === activity.stop_id)
      if (stop) cityCostMap.set(stop.city, (cityCostMap.get(stop.city) ?? 0) + Number(activity.cost ?? 0))
    }

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
        categories: [
          { name: 'Activities', value: activityCost },
          { name: 'Hotel', value: hotelCost },
          { name: 'Food', value: foodCost },
          { name: 'Transport', value: transportCost },
        ],
        dailyCosts: [...dailyCostMap.entries()].map(([date, activitiesTotal]) => ({
          date,
          activities: activitiesTotal,
          total: activitiesTotal + Math.round(hotelCost / totalDays) + Math.round(foodCost / totalDays) + Math.round(transportCost / totalDays),
        })),
        cityCosts: [...cityCostMap.entries()].map(([city, activitiesTotal]) => ({
          city,
          activities: activitiesTotal,
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
