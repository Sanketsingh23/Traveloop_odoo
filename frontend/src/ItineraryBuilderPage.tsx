import axios, { AxiosError } from 'axios'
import { useEffect, useState, useMemo } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormEvent } from 'react'

type Stop = {
  id: string
  city: string
  orderIndex: number
  startDate: string
  endDate?: string
  notes: string
  activities: Activity[]
}

type Activity = {
  id: string
  title: string
  description: string
  activityDate: string
  startTime: string | null
  endTime: string | null
  cost: number
  orderIndex: number
}

type Trip = {
  id: string
  name: string
  startDate: string
  endDate: string
  budget: number
  status: string
}

const TimelineBlock = ({ time }: { time: string | null }) => {
  if (!time) return null
  return <div className="text-xs font-mono text-slate-500">{time.substring(0, 5)}</div>
}

const ActivityCard = ({
  activity,
  onDelete,
}: {
  activity: Activity
  onDelete: (id: string) => void
}) => {
  const totalCost = activity.cost ? `$${activity.cost.toFixed(2)}` : 'Free'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{activity.title}</h4>
          {activity.description && <p className="mt-1 text-sm text-slate-600">{activity.description}</p>}
        </div>
        <button
          onClick={() => onDelete(activity.id)}
          className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <div className="flex gap-3">
          {activity.startTime && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">🕐</span>
              <TimelineBlock time={activity.startTime} />
            </div>
          )}
          {activity.endTime && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">→</span>
              <TimelineBlock time={activity.endTime} />
            </div>
          )}
        </div>
        <span className="font-semibold text-cyan-700">{totalCost}</span>
      </div>
    </div>
  )
}

const SortableStopItem = ({ stop, onDeleteActivity }: { stop: Stop; onDeleteActivity: (activityId: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stop.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="space-y-4">
      <div className="rounded-3xl border-2 border-dashed border-cyan-300 bg-cyan-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-700 text-white font-bold">📍</div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{stop.city}</h3>
            <p className="text-sm text-slate-600">
              {stop.startDate}
              {stop.endDate ? ` → ${stop.endDate}` : ''}
            </p>
          </div>
        </div>
        {stop.notes && <p className="mt-3 text-sm text-slate-700">{stop.notes}</p>}
        {stop.activities.length > 0 && (
          <div className="mt-4 space-y-2">
            {stop.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} onDelete={onDeleteActivity} />
            ))}
          </div>
        )}
        {stop.activities.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">No activities yet. Add one to get started.</p>
        )}
      </div>
    </div>
  )
}

const AddStopModal = ({
  tripId,
  token,
  onStopAdded,
  onClose,
}: {
  tripId: string
  token: string
  onStopAdded: (stop: Stop) => void
  onClose: () => void
}) => {
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!city.trim() || !startDate) {
      setError('City and start date are required')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(
        `/api/trips/${tripId}/stops`,
        {
          city: city.trim(),
          startDate,
          endDate: endDate || null,
          notes: notes.trim() || null,
          orderIndex: 0,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      onStopAdded({ ...response.data.stop, activities: [] })
      onClose()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to add stop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold text-slate-900">Add Stop</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End date (optional)"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:bg-cyan-500"
            >
              {loading ? 'Adding...' : 'Add Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AddActivityModal = ({
  stopCity,
  tripId,
  stopId,
  token,
  onActivityAdded,
  onClose,
}: {
  stopCity: string
  tripId: string
  stopId: string
  token: string
  onActivityAdded: (activity: Activity) => void
  onClose: () => void
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [cost, setCost] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !activityDate) {
      setError('Activity title and date are required')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(
        `/api/trips/${tripId}/stops/${stopId}/activities`,
        {
          title: title.trim(),
          description: description.trim() || null,
          activityDate,
          startTime: startTime || null,
          endTime: endTime || null,
          cost: cost ? Number(cost) : 0,
          orderIndex: 0,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      onActivityAdded(response.data.activity)
      onClose()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to add activity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold text-slate-900">Add Activity in {stopCity}</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Activity title"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="Start time (optional)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="End time (optional)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
            />
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Cost (optional)"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:bg-cyan-500"
            >
              {loading ? 'Adding...' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ItineraryBuilderPage = ({ tripId }: { tripId: string }) => {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddStopModal, setShowAddStopModal] = useState(false)
  const [showAddActivityModal, setShowAddActivityModal] = useState<string | null>(null)
  const [selectedStopCity, setSelectedStopCity] = useState('')

  const token = localStorage.getItem('travelloop_token')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!token) {
      window.location.href = '/login'
      return
    }

    const fetchData = async () => {
      try {
        const [tripRes, itineraryRes] = await Promise.all([
          axios.get(`/api/trips/${tripId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`/api/trips/${tripId}/itinerary`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setTrip(tripRes.data.trip)
        setStops(itineraryRes.data.stops)
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Failed to load trip')
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [tripId, token])

  const totalCost = useMemo(() => {
    return stops.reduce((sum, stop) => sum + stop.activities.reduce((subSum, act) => subSum + (act.cost || 0), 0), 0)
  }, [stops])

  const handleAddStop = (newStop: Stop) => {
    setStops((prev) => [...prev, newStop])
  }

  const handleAddActivity = (stopId: string, activity: Activity) => {
    setStops((prev) =>
      prev.map((stop) =>
        stop.id === stopId
          ? { ...stop, activities: [...stop.activities, activity] }
          : stop,
      ),
    )
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!token) return
    try {
      await axios.delete(`/api/trips/${tripId}/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStops((prev) =>
        prev.map((stop) => ({
          ...stop,
          activities: stop.activities.filter((a) => a.id !== activityId),
        })),
      )
    } catch (err) {
      setError('Failed to delete activity')
    }
  }

  if (loading) return <p className="p-6 text-slate-700">Loading itinerary...</p>
  if (error) return <p className="p-6 text-rose-700">{error}</p>

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-700 font-bold text-white">T</span>
            <span className="text-lg font-bold text-slate-900">TravelLoop</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <a href="/activity-search" className="hover:text-cyan-700">Find Activities</a>
            <a href={`/itinerary-budget/${tripId}`} className="hover:text-cyan-700">Budget View</a>
            <a href="/trips" className="hover:text-cyan-700">Back to Trips</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        {trip && (
          <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
            <h1 className="text-3xl font-semibold text-slate-900">{trip.name}</h1>
            <p className="mt-2 text-slate-600">{trip.startDate} → {trip.endDate}</p>
            <div className="mt-4 flex items-center gap-6">
              <div className="rounded-2xl bg-cyan-50 px-4 py-2">
                <p className="text-sm text-slate-600">Budget</p>
                <p className="text-2xl font-bold text-cyan-700">${trip.budget.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-2">
                <p className="text-sm text-slate-600">Activities Cost</p>
                <p className="text-2xl font-bold text-emerald-700">${totalCost.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 px-4 py-2">
                <p className="text-sm text-slate-600">Remaining</p>
                <p className="text-2xl font-bold text-blue-700">${(trip.budget - totalCost).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Trip Itinerary ({stops.length} stops)</h2>
          <button
            onClick={() => setShowAddStopModal(true)}
            className="rounded-2xl bg-cyan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            + Add Stop
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter}>
          <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {stops.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                  <p>No stops yet. Add one to get started building your itinerary.</p>
                </div>
              ) : (
                stops.map((stop) => (
                  <div key={stop.id} className="relative">
                    <SortableStopItem
                      stop={stop}
                      onDeleteActivity={handleDeleteActivity}
                    />
                    <button
                      onClick={() => {
                        setSelectedStopCity(stop.city)
                        setShowAddActivityModal(stop.id)
                      }}
                      className="mt-4 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      + Add Activity
                    </button>
                  </div>
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        <a
          href="/trips"
          className="mt-8 inline-flex rounded-2xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
        >
          ← Back to Trips
        </a>
      </section>

      {showAddStopModal && token && (
        <AddStopModal
          tripId={tripId}
          token={token}
          onStopAdded={handleAddStop}
          onClose={() => setShowAddStopModal(false)}
        />
      )}

      {showAddActivityModal && token && (
        <AddActivityModal
          stopCity={selectedStopCity}
          tripId={tripId}
          stopId={showAddActivityModal}
          token={token}
          onActivityAdded={(activity) => handleAddActivity(showAddActivityModal, activity)}
          onClose={() => setShowAddActivityModal(null)}
        />
      )}
    </main>
  )
}

export default ItineraryBuilderPage

