import axios, { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, compareAsc } from 'date-fns'

type Trip = {
  id: string
  name: string
  destination: string
  destinationCount: number
  startDate: string
  endDate: string
  status: string
  budget: number
  coverImage: string
}

type ApiResponse = {
  trips: Trip[]
}

const statusGroups = [
  { key: 'Ongoing', label: 'Ongoing trips' },
  { key: 'Upcoming', label: 'Upcoming trips' },
  { key: 'Completed', label: 'Completed trips' },
]

const defaultCover = (destination: string) =>
  `https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80&crop=entropy&sat=-30&blend=0&sig=${encodeURIComponent(destination)}`

const formatRange = (startDate: string, endDate: string) => {
  try {
    return `${format(parseISO(startDate), 'MMM d, yyyy')} — ${format(parseISO(endDate), 'MMM d, yyyy')}`
  } catch {
    return `${startDate} — ${endDate}`
  }
}

const TripsPage = () => {
  const [trips, setTrips] = useState<Trip[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortOption, setSortOption] = useState('startDateAsc')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('travelloop_token')
    if (!token) {
      window.location.href = '/'
      return
    }

    const fetchTrips = async () => {
      try {
        setLoading(true)
        const response = await axios.get<ApiResponse>('/api/trips', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTrips(response.data.trips)
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>
        setErrorMessage(axiosError.response?.data?.message ?? 'Failed to load trips')
      } finally {
        setLoading(false)
      }
    }

    void fetchTrips()
  }, [])

  const filteredTrips = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return trips
      .filter((trip) => {
        if (statusFilter !== 'All' && trip.status !== statusFilter) return false
        if (!normalizedSearch) return true
        return [trip.name, trip.destination].some((value) => value.toLowerCase().includes(normalizedSearch))
      })
      .sort((a, b) => {
        const aDate = parseISO(sortOption.includes('startDate') ? a.startDate : a.endDate)
        const bDate = parseISO(sortOption.includes('startDate') ? b.startDate : b.endDate)
        return sortOption.includes('Asc') ? compareAsc(aDate, bDate) : compareAsc(bDate, aDate)
      })
  }, [trips, search, statusFilter, sortOption])

  const groupedTrips = useMemo(() => {
    return statusGroups.map((group) => ({
      ...group,
      trips: filteredTrips.filter((trip) => trip.status === group.key),
    }))
  }, [filteredTrips])

  const deleteTrip = async (id: string) => {
    const token = localStorage.getItem('travelloop_token')
    if (!token) {
      window.location.href = '/'
      return
    }

    const confirmed = window.confirm('Delete this trip? This action cannot be undone.')
    if (!confirmed) return

    try {
      await axios.delete(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTrips((current) => current.filter((trip) => trip.id !== id))
      setActionMessage('Trip deleted successfully.')
      window.setTimeout(() => setActionMessage(''), 3000)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      setErrorMessage(axiosError.response?.data?.message ?? 'Failed to delete trip')
    }
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
            <a href="/trips" className="text-cyan-700">My Trips</a>
            <a href="/city-search" className="hover:text-cyan-700">Explore</a>
            <a href="/activity-search" className="hover:text-cyan-700">Activities</a>
            <a href="/itinerary-budget" className="hover:text-cyan-700">Budget</a>
            <a href="/packing-checklist" className="hover:text-cyan-700">Checklist</a>
            <a href="/profile" className="hover:text-cyan-700">Profile</a>
            <button
              type="button"
              onClick={() => { localStorage.removeItem('travelloop_token'); localStorage.removeItem('travelloop_user'); window.location.href = '/' }}
              className="rounded-lg bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-3xl bg-linear-to-r from-cyan-700 via-blue-700 to-indigo-700 p-8 text-white shadow-lg shadow-cyan-200/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Trip Listing</h1>
              <p className="mt-2 max-w-2xl text-slate-100/90">Review all your trips in one place, filter by status, search by name or destination, and manage your itinerary.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/trips/create"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                + Create trip
              </a>
              <div className="grid gap-3 sm:grid-cols-2 md:w-auto md:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-4 text-center">
                  <p className="text-sm uppercase tracking-[.24em] text-cyan-100/80">All trips</p>
                  <p className="mt-2 text-3xl font-semibold">{trips.length}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4 text-center">
                  <p className="text-sm uppercase tracking-[.24em] text-cyan-100/80">Ongoing</p>
                  <p className="mt-2 text-3xl font-semibold">{trips.filter((trip) => trip.status === 'Ongoing').length}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4 text-center">
                  <p className="text-sm uppercase tracking-[.24em] text-cyan-100/80">Upcoming</p>
                  <p className="mt-2 text-3xl font-semibold">{trips.filter((trip) => trip.status === 'Upcoming').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Search trips</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by trip name or destination"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Filter status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              <option>All</option>
              <option>Ongoing</option>
              <option>Upcoming</option>
              <option>Completed</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Sort by date</span>
            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="startDateAsc">Start date ↑</option>
              <option value="startDateDesc">Start date ↓</option>
              <option value="endDateAsc">End date ↑</option>
              <option value="endDateDesc">End date ↓</option>
            </select>
          </label>
        </div>

        {loading && <p className="rounded-3xl bg-white p-6 text-slate-700 shadow">Loading trips...</p>}
        {errorMessage && <p className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{errorMessage}</p>}
        {actionMessage && <p className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700 shadow-sm">{actionMessage}</p>}

        {!loading && !errorMessage && (
          <div className="space-y-10">
            {groupedTrips.map((group) => (
              <section key={group.key}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{group.label}</h2>
                    <p className="text-sm text-slate-500">{group.trips.length} trip{group.trips.length === 1 ? '' : 's'} found</p>
                  </div>
                </div>
                {group.trips.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                    No {group.label.toLowerCase()} matching your filters.
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {group.trips.map((trip) => (
                      <article key={trip.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={trip.coverImage || defaultCover(trip.destination)}
                            alt={trip.name}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-4 top-4 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold uppercase tracking-[.24em] text-white">
                            {trip.status}
                          </span>
                        </div>
                        <div className="space-y-3 p-5">
                          <div>
                            <p className="text-sm uppercase tracking-[.24em] text-slate-400">{trip.destination}</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">{trip.name}</h3>
                          </div>
                          <div className="grid gap-2 text-sm text-slate-600">
                            <p>{trip.destinationCount} destination{trip.destinationCount === 1 ? '' : 's'}</p>
                            <p>{formatRange(trip.startDate, trip.endDate)}</p>
                            <p className="font-semibold text-slate-900">Budget: ${trip.budget.toLocaleString()}</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-5">
                            <a
                              href="/activity-search"
                              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Activities
                            </a>
                            <a
                              href={`/itinerary-builder/${trip.id}`}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              View
                            </a>
                            <a
                              href={`/itinerary-budget/${trip.id}`}
                              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Budget
                            </a>
                            <a
                              href={`/trips/edit/${trip.id}`}
                              className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-center text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                            >
                              Edit
                            </a>
                            <button
                              type="button"
                              onClick={() => void deleteTrip(trip.id)}
                              className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default TripsPage
