import axios, { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type Category = 'Adventure' | 'Food' | 'Historical' | 'Nature' | 'Shopping' | 'Entertainment'
type CostFilter = 'All' | 'Free' | 'Low' | 'Mid' | 'High'
type DurationFilter = 'All' | 'Under 2 hours' | '2-4 hours' | 'Half day'

type Activity = {
  id: string
  title: string
  category: Category
  city: string
  description: string
  cost: number
  durationHours: number
  bestTime: string
  imageUrl: string
}

type Trip = {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
}

type Stop = {
  id: string
  city: string
  startDate: string
}

const categories: Category[] = ['Adventure', 'Food', 'Historical', 'Nature', 'Shopping', 'Entertainment']
const costOptions: CostFilter[] = ['All', 'Free', 'Low', 'Mid', 'High']
const durationOptions: DurationFilter[] = ['All', 'Under 2 hours', '2-4 hours', 'Half day']

const activities: Activity[] = [
  {
    id: 'paris-food-walk',
    title: 'Le Marais food walk',
    category: 'Food',
    city: 'Paris',
    description: 'Bakeries, cheese counters, chocolate shops, and relaxed neighborhood tasting stops.',
    cost: 58,
    durationHours: 3,
    bestTime: 'Late morning',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'rome-ancient-forum',
    title: 'Forum and Palatine route',
    category: 'Historical',
    city: 'Rome',
    description: 'A structured walk through imperial ruins with time for overlooks and museum stops.',
    cost: 32,
    durationHours: 4,
    bestTime: 'Morning',
    imageUrl: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'tokyo-arcade-night',
    title: 'Akihabara arcade night',
    category: 'Entertainment',
    city: 'Tokyo',
    description: 'Retro games, music rooms, capsule toy stops, and neon side streets after dark.',
    cost: 45,
    durationHours: 2,
    bestTime: 'Evening',
    imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'bangkok-market',
    title: 'Floating market tasting loop',
    category: 'Shopping',
    city: 'Bangkok',
    description: 'Canal vendors, craft stalls, fruit boats, and casual snacks in a single route.',
    cost: 24,
    durationHours: 5,
    bestTime: 'Early morning',
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'sydney-coastal-hike',
    title: 'Bondi to Coogee coastal walk',
    category: 'Nature',
    city: 'Sydney',
    description: 'Clifftop paths, ocean pools, beach pauses, and easy cafe breaks along the route.',
    cost: 0,
    durationHours: 3,
    bestTime: 'Morning',
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'dubai-desert-drive',
    title: 'Desert dune drive',
    category: 'Adventure',
    city: 'Dubai',
    description: 'A guided desert run with dune viewpoints, sandboarding, and sunset photo stops.',
    cost: 96,
    durationHours: 6,
    bestTime: 'Afternoon',
    imageUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'amsterdam-canal-museum',
    title: 'Canal house museum crawl',
    category: 'Historical',
    city: 'Amsterdam',
    description: 'Compact museum visits, canal architecture, quiet courtyards, and design shops nearby.',
    cost: 38,
    durationHours: 3,
    bestTime: 'Afternoon',
    imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'lisbon-viewpoints',
    title: 'Lisbon viewpoint climb',
    category: 'Nature',
    city: 'Lisbon',
    description: 'Hilltop terraces, tiled lanes, tram sightings, and sunset views over the river.',
    cost: 0,
    durationHours: 2,
    bestTime: 'Sunset',
    imageUrl: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'seoul-street-food',
    title: 'Myeongdong street food sprint',
    category: 'Food',
    city: 'Seoul',
    description: 'Savory snacks, sweets, cosmetics shops, and lively lanes packed into one evening.',
    cost: 22,
    durationHours: 2,
    bestTime: 'Evening',
    imageUrl: 'https://images.unsplash.com/photo-1538485399081-7c8a9f3a1f3c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'nyc-broadway',
    title: 'Broadway matinee block',
    category: 'Entertainment',
    city: 'New York',
    description: 'A show-focused afternoon with nearby dinner options and a short Times Square walk.',
    cost: 125,
    durationHours: 4,
    bestTime: 'Afternoon',
    imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80',
  },
]

const costLabel = (cost: number) => {
  if (cost === 0) return 'Free'
  if (cost <= 35) return 'Low'
  if (cost <= 80) return 'Mid'
  return 'High'
}

const durationLabel = (hours: number) => {
  if (hours < 2) return 'Under 2 hours'
  if (hours <= 4) return '2-4 hours'
  return 'Half day'
}

const ActivitySearchPage = () => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [cost, setCost] = useState<CostFilter>('All')
  const [duration, setDuration] = useState<DurationFilter>('All')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [addedActivityIds, setAddedActivityIds] = useState<string[]>([])

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return activities.filter((activity) => {
      if (category !== 'All' && activity.category !== category) return false
      if (cost !== 'All' && costLabel(activity.cost) !== cost) return false
      if (duration !== 'All' && durationLabel(activity.durationHours) !== duration) return false
      if (!normalizedSearch) return true

      return [
        activity.title,
        activity.category,
        activity.city,
        activity.description,
        activity.bestTime,
      ].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [category, cost, duration, search])

  const averageCost = useMemo(() => {
    if (!filteredActivities.length) return 0
    return Math.round(filteredActivities.reduce((sum, activity) => sum + activity.cost, 0) / filteredActivities.length)
  }, [filteredActivities])

  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setCost('All')
    setDuration('All')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-700 font-bold text-white">T</span>
            <span className="text-lg font-bold text-slate-900">TravelLoop</span>
          </div>
          <div className="flex items-center gap-5 text-sm font-medium text-slate-700">
            <a href="/dashboard" className="hover:text-cyan-700">Dashboard</a>
            <a href="/trips" className="hover:text-cyan-700">My Trips</a>
            <a href="/city-search" className="hover:text-cyan-700">Explore</a>
            <a href="/activity-search" className="text-cyan-700">Activities</a>
            <a href="/itinerary-budget" className="hover:text-cyan-700">Budget</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-3xl bg-linear-to-r from-cyan-700 via-blue-700 to-indigo-700 p-8 text-white shadow-lg shadow-cyan-200/30">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-100/80">Page 8</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Activity Search</h1>
              <p className="mt-3 max-w-2xl text-slate-100/90">
                Discover experiences by category, cost, and duration, then place the best fit directly into a trip itinerary.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Results</p>
                <p className="mt-2 text-3xl font-bold">{filteredActivities.length}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Avg cost</p>
                <p className="mt-2 text-3xl font-bold">${averageCost}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Added</p>
                <p className="mt-2 text-3xl font-bold">{addedActivityIds.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                <p className="text-sm text-slate-500">Narrow activities quickly.</p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Clear
              </button>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as Category | 'All')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200">
                  <option>All</option>
                  {categories.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Cost</span>
                <select value={cost} onChange={(event) => setCost(event.target.value as CostFilter)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200">
                  {costOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Duration</span>
                <select value={duration} onChange={(event) => setDuration(event.target.value as DurationFilter)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200">
                  {durationOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>
          </aside>

          <div>
            <form onSubmit={(event) => event.preventDefault()} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <label htmlFor="activity-search" className="sr-only">Search activities</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="activity-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search activity, city, category, or best time"
                  className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                />
                <button type="submit" className="min-h-12 rounded-2xl bg-cyan-700 px-6 text-sm font-semibold text-white transition hover:bg-cyan-800">
                  Search
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Activities</h2>
                <p className="text-sm text-slate-500">Showing matching experiences from all categories.</p>
              </div>
              <a href="/city-search" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Explore cities
              </a>
            </div>

            {filteredActivities.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">No activities found</h3>
                <p className="mt-2 text-sm text-slate-500">Try a different category, cost, duration, or search term.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                {filteredActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isAdded={addedActivityIds.includes(activity.id)}
                    onAdd={() => setSelectedActivity(activity)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedActivity && (
        <AddActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onAdded={() => {
            setAddedActivityIds((current) => (
              current.includes(selectedActivity.id) ? current : [...current, selectedActivity.id]
            ))
            setSelectedActivity(null)
          }}
        />
      )}
    </main>
  )
}

const ActivityCard = ({
  activity,
  isAdded,
  onAdd,
}: {
  activity: Activity
  isAdded: boolean
  onAdd: () => void
}) => (
  <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative h-52 overflow-hidden">
      <img src={activity.imageUrl} alt={activity.title} className="h-full w-full object-cover" />
      <div className="absolute left-4 top-4 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-white">
        {activity.category}
      </div>
    </div>
    <div className="space-y-4 p-5">
      <div>
        <p className="text-sm font-medium text-cyan-700">{activity.city}</p>
        <h3 className="mt-1 text-2xl font-semibold text-slate-900">{activity.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{activity.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Cost</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{activity.cost === 0 ? 'Free' : `$${activity.cost}`}</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-sky-700">Time</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{activity.durationHours}h</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-700">Best</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{activity.bestTime}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isAdded
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'bg-cyan-700 text-white hover:bg-cyan-800'
        }`}
      >
        {isAdded ? 'Add again' : 'Add to itinerary'}
      </button>
    </div>
  </article>
)

const AddActivityModal = ({
  activity,
  onClose,
  onAdded,
}: {
  activity: Activity
  onClose: () => void
  onAdded: () => void
}) => {
  const [trips, setTrips] = useState<Trip[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [tripId, setTripId] = useState('')
  const [stopId, setStopId] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [loadingStops, setLoadingStops] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('travelloop_token')

  useEffect(() => {
    if (!token) {
      setMessage('Please log in before adding activities to an itinerary.')
      setLoadingTrips(false)
      return
    }

    const fetchTrips = async () => {
      try {
        const response = await axios.get<{ trips: Trip[] }>('/api/trips', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTrips(response.data.trips)
        if (response.data.trips[0]) {
          setTripId(response.data.trips[0].id)
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>
        setMessage(axiosError.response?.data?.message ?? 'Failed to load trips.')
      } finally {
        setLoadingTrips(false)
      }
    }

    void fetchTrips()
  }, [token])

  useEffect(() => {
    if (!token || !tripId) return

    const fetchStops = async () => {
      try {
        setLoadingStops(true)
        setStops([])
        setStopId('')
        const response = await axios.get<{ stops: Stop[] }>(`/api/trips/${tripId}/itinerary`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setStops(response.data.stops)
        if (response.data.stops[0]) {
          setStopId(response.data.stops[0].id)
          setActivityDate(response.data.stops[0].startDate)
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>
        setMessage(axiosError.response?.data?.message ?? 'Failed to load itinerary stops.')
      } finally {
        setLoadingStops(false)
      }
    }

    void fetchStops()
  }, [token, tripId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return
    if (!tripId || !stopId || !activityDate) {
      setMessage('Choose a trip, stop, and date before adding this activity.')
      return
    }

    try {
      setSubmitting(true)
      await axios.post(
        `/api/trips/${tripId}/stops/${stopId}/activities`,
        {
          title: activity.title,
          description: `${activity.description} Category: ${activity.category}. Best time: ${activity.bestTime}.`,
          activityDate,
          startTime: startTime || null,
          endTime: null,
          cost: activity.cost,
          orderIndex: 0,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      onAdded()
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      setMessage(axiosError.response?.data?.message ?? 'Failed to add activity.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-700">{activity.category}</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Add {activity.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            Close
          </button>
        </div>

        {loadingTrips ? (
          <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Loading trips...</p>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Trip</span>
              <select value={tripId} onChange={(event) => setTripId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500">
                {trips.length === 0 && <option value="">No trips available</option>}
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>{trip.name} - {trip.destination}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Itinerary stop</span>
              <select value={stopId} onChange={(event) => {
                setStopId(event.target.value)
                const nextStop = stops.find((stop) => stop.id === event.target.value)
                if (nextStop) setActivityDate(nextStop.startDate)
              }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500">
                {loadingStops && <option value="">Loading stops...</option>}
                {!loadingStops && stops.length === 0 && <option value="">No stops available</option>}
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>{stop.city}</option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Date</span>
                <input type="date" value={activityDate} onChange={(event) => setActivityDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Start time</span>
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500" />
              </label>
            </div>

            {message && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <a href="/trips/create" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Create trip
              </a>
              <button type="submit" disabled={submitting || !tripId || !stopId || !activityDate} className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-500">
                {submitting ? 'Adding...' : 'Add activity'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ActivitySearchPage
