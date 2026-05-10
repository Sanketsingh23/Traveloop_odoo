import axios, { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'

type Activity = {
  id: string
  title: string
  description: string
  activityDate: string
  startTime: string | null
  endTime: string | null
  cost: number
}

type Stop = {
  id: string
  city: string
  startDate: string
  endDate?: string
  notes: string
  activities: Activity[]
}

type TripSummary = {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  status: string
  budget: number
  totalDays: number
}

type BudgetAlert = {
  type: 'danger' | 'warning' | 'success'
  message: string
}

type Budget = {
  tripId: string
  tripName: string
  budgetLimit: number
  totalCost: number
  remaining: number
  totalDays: number
  costPerDay: number
  activityCost: number
  hotelCost: number
  foodCost: number
  transportCost: number
  categories: { name: string; value: number }[]
  dailyCosts: { date: string; activities: number; total: number }[]
  cityCosts: { city: string; activities: number }[]
  alerts: BudgetAlert[]
}

type TripOption = {
  id: string
  name: string
  destination: string
}

const chartColors = ['#0891b2', '#16a34a', '#f59e0b', '#7c3aed']

const currency = (value: number) => `$${Math.round(value).toLocaleString()}`

const formatDate = (value: string) => {
  try {
    return format(parseISO(value), 'MMM d')
  } catch {
    return value
  }
}

const ItineraryBudgetPage = ({ tripId: initialTripId }: { tripId?: string }) => {
  const [tripId, setTripId] = useState(initialTripId ?? '')
  const [trips, setTrips] = useState<TripOption[]>([])
  const [trip, setTrip] = useState<TripSummary | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('travelloop_token')

  useEffect(() => {
    if (!token) {
      window.location.href = '/'
      return
    }

    if (initialTripId) return

    const fetchTrips = async () => {
      try {
        const response = await axios.get<{ trips: TripOption[] }>('/api/trips', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTrips(response.data.trips)
        if (response.data.trips[0]) {
          setTripId(response.data.trips[0].id)
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Failed to load trips')
      }
    }

    void fetchTrips()
  }, [initialTripId, token])

  useEffect(() => {
    if (!token || !tripId) {
      setLoading(false)
      return
    }

    const fetchPageData = async () => {
      try {
        setLoading(true)
        setError('')
        const [summaryResponse, budgetResponse] = await Promise.all([
          axios.get<{ trip: TripSummary; stops: Stop[] }>(`/api/trips/${tripId}/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<{ budget: Budget }>(`/api/budget/${tripId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        setTrip(summaryResponse.data.trip)
        setStops(summaryResponse.data.stops)
        setBudget(budgetResponse.data.budget)
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Failed to load itinerary and budget')
      } finally {
        setLoading(false)
      }
    }

    void fetchPageData()
  }, [token, tripId])

  const dayWiseItinerary = useMemo(() => {
    const activityDays = new Map<string, Activity[]>()
    stops.forEach((stop) => {
      stop.activities.forEach((activity) => {
        activityDays.set(activity.activityDate, [...(activityDays.get(activity.activityDate) ?? []), activity])
      })
    })

    return Array.from(activityDays.entries())
      .map(([date, activities]) => ({
        date,
        activities: activities.sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [stops])

  const budgetUsage = budget ? Math.round((budget.totalCost / budget.budgetLimit) * 100) : 0

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
            <a href="/activity-search" className="hover:text-cyan-700">Activities</a>
            <a href="/packing-checklist" className="hover:text-cyan-700">Checklist</a>
            <a href="/profile" className="hover:text-cyan-700">Profile</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-3xl bg-linear-to-r from-cyan-700 via-blue-700 to-indigo-700 p-8 text-white shadow-lg shadow-cyan-200/30">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-100/80">Page 9</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Itinerary View + Budget</h1>
              <p className="mt-3 max-w-2xl text-slate-100/90">
                Visualize the full trip timeline, day-wise activities, city grouping, budget totals, and spend alerts.
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Budget used</p>
              <p className="mt-2 text-4xl font-bold">{budget ? `${budgetUsage}%` : '--'}</p>
              {trip && <p className="mt-2 text-sm text-cyan-50/90">{trip.name}</p>}
            </div>
          </div>
        </div>

        {!initialTripId && trips.length > 0 && (
          <label className="mb-6 block max-w-md space-y-2">
            <span className="text-sm font-medium text-slate-700">Trip</span>
            <select
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              {trips.map((item) => (
                <option key={item.id} value={item.id}>{item.name} - {item.destination}</option>
              ))}
            </select>
          </label>
        )}

        {loading && <p className="rounded-3xl bg-white p-6 text-slate-700 shadow-sm">Loading trip view...</p>}
        {error && <p className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</p>}

        {!loading && !error && trip && budget && (
          <div className="grid gap-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total cost" value={currency(budget.totalCost)} detail={`${currency(budget.remaining)} remaining`} />
              <MetricCard label="Cost per day" value={currency(budget.costPerDay)} detail={`${budget.totalDays} day trip`} />
              <MetricCard label="Activity cost" value={currency(budget.activityCost)} detail={`${stops.reduce((sum, stop) => sum + stop.activities.length, 0)} activities`} />
              <MetricCard label="Budget limit" value={currency(budget.budgetLimit)} detail={`${budgetUsage}% projected use`} />
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Hotel cost" value={currency(budget.hotelCost)} detail="Estimated lodging" />
              <MetricCard label="Food cost" value={currency(budget.foodCost)} detail="Estimated meals" />
              <MetricCard label="Transport cost" value={currency(budget.transportCost)} detail="Estimated transfers" />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-slate-900">Trip Timeline</h2>
                  <p className="text-sm text-slate-500">{formatDate(trip.startDate)} to {formatDate(trip.endDate)} across {stops.length} city stop{stops.length === 1 ? '' : 's'}.</p>
                </div>
                <div className="space-y-5">
                  {stops.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">No stops yet.</p>
                  ) : (
                    stops.map((stop, index) => (
                      <article key={stop.id} className="grid gap-4 border-l-4 border-cyan-600 pl-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[.16em] text-cyan-700">Stop {index + 1}</p>
                            <h3 className="text-2xl font-semibold text-slate-900">{stop.city}</h3>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                            {formatDate(stop.startDate)}{stop.endDate ? ` - ${formatDate(stop.endDate)}` : ''}
                          </span>
                        </div>
                        {stop.notes && <p className="text-sm text-slate-600">{stop.notes}</p>}
                        <div className="grid gap-3">
                          {stop.activities.length === 0 ? (
                            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No activities scheduled in this city.</p>
                          ) : (
                            stop.activities.map((activity) => <ActivityTimelineItem key={activity.id} activity={activity} />)
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">Budget Alerts</h2>
                  <div className="mt-4 grid gap-3">
                    {budget.alerts.map((alert) => (
                      <p key={alert.message} className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${alert.type === 'danger' ? 'border-rose-200 bg-rose-50 text-rose-700' : alert.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {alert.message}
                      </p>
                    ))}
                  </div>
                </div>

                <ChartPanel title="Spend by category">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={budget.categories} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
                        {budget.categories.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => currency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartPanel title="Daily budget">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budget.dailyCosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip labelFormatter={(value) => formatDate(String(value))} formatter={(value) => currency(Number(value))} />
                    <Legend />
                    <Bar dataKey="activities" name="Activities" fill="#0891b2" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="total" name="Projected total" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="City activity cost">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budget.cityCosts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => currency(Number(value))} />
                    <Bar dataKey="activities" name="Activity cost" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">Day-wise Itinerary</h2>
                <p className="text-sm text-slate-500">Activities grouped by scheduled date.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {dayWiseItinerary.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">No dated activities yet.</p>
                ) : (
                  dayWiseItinerary.map((day) => (
                    <article key={day.date} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-lg font-semibold text-slate-900">{formatDate(day.date)}</h3>
                      <div className="mt-3 grid gap-3">
                        {day.activities.map((activity) => <ActivityTimelineItem key={activity.id} activity={activity} compact />)}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

const MetricCard = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{detail}</p>
  </article>
)

const ChartPanel = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>
    {children}
  </div>
)

const ActivityTimelineItem = ({ activity, compact = false }: { activity: Activity; compact?: boolean }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-semibold text-slate-900">{activity.title}</p>
        {!compact && activity.description && <p className="mt-1 text-sm text-slate-600">{activity.description}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
        {currency(activity.cost)}
      </span>
    </div>
    <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
      <span>{formatDate(activity.activityDate)}</span>
      {activity.startTime && <span>{activity.startTime.substring(0, 5)}</span>}
      {activity.endTime && <span>to {activity.endTime.substring(0, 5)}</span>}
    </div>
  </div>
)

export default ItineraryBudgetPage
