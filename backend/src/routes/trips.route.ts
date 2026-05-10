import path from 'path'
import { Router } from 'express'
import multer from 'multer'

import { supabase } from '../db/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { resolveAuthenticatedUserId } from '../utils/auth-user.js'

const tripsRouter = Router()
const uploadsDir = path.resolve(process.cwd(), 'uploads')
const upload = multer({ dest: uploadsDir })
const recommendedDestinations = [
  { id: 'dest_001', name: 'Santorini', country: 'Greece' },
  { id: 'dest_002', name: 'Queenstown', country: 'New Zealand' },
  { id: 'dest_003', name: 'Marrakesh', country: 'Morocco' },
]

const toDateString = (value: string | Date | null | undefined) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
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
  destinationCount: row.destination_count ?? 1,
  startDate: toDateString(row.start_date),
  endDate: toDateString(row.end_date),
  status: row.status ?? calculateStatus(row.start_date, row.end_date),
  budget: Number(row.budget_limit ?? 0),
  coverImage: row.cover_image ?? '',
})

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message)
  }
  return 'Unknown error'
}

const isMissingSupabaseTableError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('could not find the table') || message.includes('schema cache')
}

const mapStop = (stop: any, activities: any[] = []) => ({
  id: String(stop.id),
  city: stop.city,
  orderIndex: stop.order_index,
  startDate: toDateString(stop.start_date),
  endDate: stop.end_date ? toDateString(stop.end_date) : undefined,
  notes: stop.notes ?? '',
  activities: activities.map(mapActivity),
})

const mapActivity = (activity: any) => ({
  id: String(activity.id),
  title: activity.title,
  description: activity.description ?? '',
  activityDate: toDateString(activity.activity_date),
  startTime: activity.start_time,
  endTime: activity.end_time,
  cost: activity.cost ? Number(activity.cost) : 0,
  orderIndex: activity.order_index,
})

const daysBetweenInclusive = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const difference = end.getTime() - start.getTime()
  return Math.max(1, Math.floor(difference / 86400000) + 1)
}

const getUserId = async (req: Parameters<typeof resolveAuthenticatedUserId>[0], res: any) => {
  const userId = await resolveAuthenticatedUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: 'Invalid user session' })
    return null
  }
  return userId
}

const getOwnedTrip = async (tripId: string, userId: number, select = 'id') => {
  const { data, error } = await supabase
    .from('trips')
    .select(select)
    .eq('id', tripId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as any
}

tripsRouter.get('/', authenticate, async (req, res) => {
  try {
    const userId = await getUserId(req, res)
    if (!userId) return

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true })

    if (error) throw error
    return res.status(200).json({ success: true, trips: (data ?? []).map(mapRowToTrip) })
  } catch (error) {
    console.error('Fetch trips error', error)
    if (isMissingSupabaseTableError(error)) {
      return res.status(200).json({ success: true, trips: [] })
    }
    return res.status(500).json({ success: false, message: `Failed to load trips: ${getErrorMessage(error)}` })
  }
})

tripsRouter.get('/recent', authenticate, async (req, res) => {
  const userName = req.user?.email?.split('@')[0] ?? 'Traveler'

  try {
    const userId = await getUserId(req, res)
    if (!userId) return

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true })
      .limit(3)

    if (error) throw error
    return res.status(200).json({
      success: true,
      trips: (data ?? []).map(mapRowToTrip),
      recommendedDestinations,
      userLabel: userName,
    })
  } catch (error) {
    console.error('Fetch recent trips error', error)
    if (isMissingSupabaseTableError(error)) {
      return res.status(200).json({
        success: true,
        trips: [],
        recommendedDestinations,
        userLabel: userName,
      })
    }
    return res.status(500).json({ success: false, message: `Failed to load recent trips: ${getErrorMessage(error)}` })
  }
})

tripsRouter.get('/:id/summary', authenticate, async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const id = String(req.params.id)

  try {
    const trip = await getOwnedTrip(id, userId, 'id, title, destination, start_date, end_date, budget_limit, status')
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const stops = await loadStopsWithActivities(id)

    return res.status(200).json({
      success: true,
      trip: {
        id: String(trip.id),
        name: trip.title,
        destination: trip.destination,
        startDate: toDateString(trip.start_date),
        endDate: toDateString(trip.end_date),
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
  const userId = await getUserId(req, res)
  if (!userId) return
  const id = String(req.params.id)

  try {
    const trip = await getOwnedTrip(id, userId, '*')
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    return res.status(200).json({ success: true, trip: mapRowToTrip(trip) })
  } catch (error) {
    console.error('Fetch trip detail error', error)
    return res.status(500).json({ success: false, message: 'Failed to load trip details' })
  }
})

tripsRouter.put('/:id', authenticate, upload.single('coverImage'), async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const id = String(req.params.id)
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
    const existing = await getOwnedTrip(id, userId, 'cover_image')
    if (!existing) return res.status(404).json({ success: false, message: 'Trip not found' })

    const coverImage = req.file ? `/uploads/${req.file.filename}` : coverImageUrl || existing.cover_image
    const { data, error } = await supabase
      .from('trips')
      .update({
        title,
        destination,
        description,
        start_date: startDate,
        end_date: endDate,
        cover_image: coverImage,
        budget_limit: budgetLimit,
        travel_type: travelType,
        status: calculateStatus(startDate, endDate),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count')
      .single()

    if (error) throw error
    return res.status(200).json({ success: true, trip: mapRowToTrip(data) })
  } catch (error) {
    console.error('Update trip error', error)
    return res.status(500).json({ success: false, message: 'Failed to update trip' })
  }
})

tripsRouter.post('/', authenticate, upload.single('coverImage'), async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
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
    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        title,
        destination,
        description,
        start_date: startDate,
        end_date: endDate,
        cover_image: req.file ? `/uploads/${req.file.filename}` : coverImageUrl || null,
        budget_limit: budgetLimit,
        travel_type: travelType,
        status: calculateStatus(startDate, endDate),
        destination_count: 1,
      })
      .select('id, title, destination, description, start_date, end_date, cover_image, budget_limit, travel_type, status, destination_count')
      .single()

    if (error) throw error
    return res.status(201).json({ success: true, trip: mapRowToTrip(data) })
  } catch (error) {
    console.error('Create trip error', error)
    return res.status(500).json({ success: false, message: 'Failed to create trip' })
  }
})

tripsRouter.delete('/:id', authenticate, async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const id = String(req.params.id)

  try {
    const { data, error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ success: false, message: 'Trip not found' })
    return res.status(200).json({ success: true, message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Delete trip error', error)
    return res.status(500).json({ success: false, message: 'Failed to delete trip' })
  }
})

const loadStopsWithActivities = async (tripId: string) => {
  const { data: stops, error: stopsError } = await supabase
    .from('stops')
    .select('id, city, order_index, start_date, end_date, notes')
    .eq('trip_id', tripId)
    .order('order_index', { ascending: true })
    .order('start_date', { ascending: true })

  if (stopsError) throw stopsError

  const stopIds = (stops ?? []).map((stop) => stop.id)
  const { data: activities, error: activitiesError } = stopIds.length
    ? await supabase
        .from('activities')
        .select('id, title, description, activity_date, start_time, end_time, cost, order_index, stop_id')
        .in('stop_id', stopIds)
        .order('activity_date', { ascending: true })
        .order('start_time', { ascending: true })
        .order('order_index', { ascending: true })
    : { data: [], error: null }

  if (activitiesError) throw activitiesError

  return (stops ?? []).map((stop) => mapStop(stop, (activities ?? []).filter((activity) => activity.stop_id === stop.id)))
}

tripsRouter.get('/:tripId/itinerary', authenticate, async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const tripId = String(req.params.tripId)

  try {
    const trip = await getOwnedTrip(tripId, userId)
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const stops = await loadStopsWithActivities(tripId)
    return res.status(200).json({ success: true, stops })
  } catch (error) {
    console.error('Fetch itinerary error', error)
    return res.status(500).json({ success: false, message: 'Failed to load itinerary' })
  }
})

tripsRouter.post('/:tripId/stops', authenticate, async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const tripId = String(req.params.tripId)
  const { city, startDate, endDate, notes, orderIndex } = req.body as {
    city?: string
    startDate?: string
    endDate?: string
    notes?: string
    orderIndex?: number
  }

  if (!city || !startDate) return res.status(400).json({ success: false, message: 'City and start date are required' })

  try {
    const trip = await getOwnedTrip(tripId, userId)
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const { data, error } = await supabase
      .from('stops')
      .insert({ trip_id: tripId, city, order_index: orderIndex ?? 0, start_date: startDate, end_date: endDate ?? null, notes: notes ?? '' })
      .select('id, city, order_index, start_date, end_date, notes')
      .single()

    if (error) throw error
    return res.status(201).json({ success: true, stop: mapStop(data) })
  } catch (error) {
    console.error('Create stop error', error)
    return res.status(500).json({ success: false, message: 'Failed to create stop' })
  }
})

tripsRouter.post('/:tripId/stops/:stopId/activities', authenticate, async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const tripId = String(req.params.tripId)
  const stopId = String(req.params.stopId)
  const { title, description, activityDate, startTime, endTime, cost, orderIndex } = req.body as {
    title?: string
    description?: string
    activityDate?: string
    startTime?: string
    endTime?: string
    cost?: number
    orderIndex?: number
  }

  if (!title || !activityDate) return res.status(400).json({ success: false, message: 'Title and activity date are required' })

  try {
    const trip = await getOwnedTrip(tripId, userId)
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const { data: stop, error: stopError } = await supabase
      .from('stops')
      .select('id')
      .eq('id', stopId)
      .eq('trip_id', tripId)
      .maybeSingle()

    if (stopError) throw stopError
    if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' })

    const { data, error } = await supabase
      .from('activities')
      .insert({
        stop_id: stopId,
        title,
        description: description ?? '',
        activity_date: activityDate,
        start_time: startTime ?? null,
        end_time: endTime ?? null,
        cost: cost ?? 0,
        order_index: orderIndex ?? 0,
      })
      .select('id, title, description, activity_date, start_time, end_time, cost, order_index')
      .single()

    if (error) throw error
    return res.status(201).json({ success: true, activity: mapActivity(data) })
  } catch (error) {
    console.error('Create activity error', error)
    return res.status(500).json({ success: false, message: 'Failed to create activity' })
  }
})

tripsRouter.put('/:tripId/activities/:activityId', authenticate, async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const tripId = String(req.params.tripId)
  const activityId = String(req.params.activityId)
  const { title, description, startTime, endTime, cost } = req.body

  try {
    const trip = await getOwnedTrip(tripId, userId)
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const stops = await loadStopsWithActivities(tripId)
    const activityExists = stops.some((stop) => stop.activities.some((activity) => activity.id === String(activityId)))
    if (!activityExists) return res.status(404).json({ success: false, message: 'Activity not found' })

    const { data, error } = await supabase
      .from('activities')
      .update({ title: title ?? '', description: description ?? '', start_time: startTime ?? null, end_time: endTime ?? null, cost: cost ?? 0 })
      .eq('id', activityId)
      .select('id, title, description, activity_date, start_time, end_time, cost, order_index')
      .single()

    if (error) throw error
    return res.status(200).json({ success: true, activity: mapActivity(data) })
  } catch (error) {
    console.error('Update activity error', error)
    return res.status(500).json({ success: false, message: 'Failed to update activity' })
  }
})

tripsRouter.delete('/:tripId/activities/:activityId', authenticate, async (req, res) => {
  const userId = await getUserId(req, res)
  if (!userId) return
  const tripId = String(req.params.tripId)
  const activityId = String(req.params.activityId)

  try {
    const trip = await getOwnedTrip(tripId, userId)
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const stops = await loadStopsWithActivities(tripId)
    const activityExists = stops.some((stop) => stop.activities.some((activity) => activity.id === String(activityId)))
    if (!activityExists) return res.status(404).json({ success: false, message: 'Activity not found' })

    const { data, error } = await supabase.from('activities').delete().eq('id', activityId).select('id')
    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ success: false, message: 'Activity not found' })

    return res.status(200).json({ success: true, message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Delete activity error', error)
    return res.status(500).json({ success: false, message: 'Failed to delete activity' })
  }
})

export { tripsRouter }
