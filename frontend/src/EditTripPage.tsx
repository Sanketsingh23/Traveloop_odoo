import axios, { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type EditTripPageProps = {
  tripId: string
}

const travelTypes = ['Leisure', 'Business', 'Adventure', 'Family', 'Romantic', 'Wellness', 'Other']
const toDateInputValue = (date: Date | null) => date?.toISOString().slice(0, 10) ?? ''

const EditTripPage = ({ tripId }: EditTripPageProps) => {
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [budget, setBudget] = useState('')
  const [travelType, setTravelType] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [existingCover, setExistingCover] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('travelloop_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    const fetchTrip = async () => {
      try {
        const response = await axios.get(`/api/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const trip = response.data.trip
        setTitle(trip.name)
        setDestination(trip.destination)
        setDescription(trip.description ?? '')
        setStartDate(new Date(trip.startDate))
        setEndDate(new Date(trip.endDate))
        setBudget(String(trip.budget))
        setTravelType(trip.travelType)
        setExistingCover(trip.coverImage ?? '')
        setCoverUrl(trip.coverImage ?? '')
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>
        setErrorMessage(axiosError.response?.data?.message ?? 'Failed to load trip details')
      } finally {
        setLoading(false)
      }
    }

    void fetchTrip()
  }, [tripId])

  const titleError = useMemo(() => (!title.trim() ? 'Trip title is required' : ''), [title])
  const destinationError = useMemo(() => (!destination.trim() ? 'Destination is required' : ''), [destination])
  const travelTypeError = useMemo(() => (!travelType ? 'Travel type is required' : ''), [travelType])
  const budgetError = useMemo(() => {
    if (!budget.trim()) return 'Budget limit is required'
    const amount = Number(budget)
    return Number.isFinite(amount) && amount > 0 ? '' : 'Enter a valid budget amount'
  }, [budget])
  const dateError = useMemo(() => {
    if (!startDate || !endDate) return 'Both dates are required'
    return endDate < startDate ? 'End date cannot be before start date' : ''
  }, [startDate, endDate])

  const isFormValid = !titleError && !destinationError && !travelTypeError && !budgetError && !dateError

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!isFormValid) {
      setErrorMessage('Please fix validation errors to continue.')
      return
    }

    const token = localStorage.getItem('travelloop_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('destination', destination.trim())
    formData.append('description', description.trim())
    formData.append('startDate', startDate?.toISOString().slice(0, 10) ?? '')
    formData.append('endDate', endDate?.toISOString().slice(0, 10) ?? '')
    formData.append('budgetLimit', budget.trim())
    formData.append('travelType', travelType)
    if (coverFile) {
      formData.append('coverImage', coverFile)
    } else if (coverUrl.trim()) {
      formData.append('coverImageUrl', coverUrl.trim())
    }

    try {
      setSubmitting(true)
      await axios.put(`/api/trips/${tripId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      window.location.href = '/trips'
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      setErrorMessage(axiosError.response?.data?.message ?? 'Failed to update trip. Please try again.')
    } finally {
      setSubmitting(false)
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
          <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <a href="/dashboard" className="hover:text-cyan-700">Dashboard</a>
            <a href="/trips" className="hover:text-cyan-700">My Trips</a>
            <a href="/city-search" className="hover:text-cyan-700">Explore</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Edit Trip</h1>
              <p className="mt-2 text-slate-600">Update the trip details and save changes to your itinerary.</p>
            </div>
            <a href="/trips" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Back to trips</a>
          </div>

          {loading ? (
            <p className="rounded-3xl bg-slate-50 px-6 py-5 text-slate-700">Loading trip data...</p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Trip title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="My summer adventure"
                  />
                  {titleError && <p className="text-xs text-rose-600">{titleError}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Destination</span>
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="Bali, Indonesia"
                  />
                  {destinationError && <p className="text-xs text-rose-600">{destinationError}</p>}
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </label>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Start date</span>
                  <input
                    type="date"
                    value={toDateInputValue(startDate)}
                    onChange={(event) => setStartDate(event.target.value ? new Date(event.target.value) : null)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">End date</span>
                  <input
                    type="date"
                    value={toDateInputValue(endDate)}
                    onChange={(event) => setEndDate(event.target.value ? new Date(event.target.value) : null)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Budget limit</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="2500"
                  />
                  {budgetError && <p className="text-xs text-rose-600">{budgetError}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Travel type</span>
                  <select
                    value={travelType}
                    onChange={(event) => setTravelType(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  >
                    <option value="">Select trip type</option>
                    {travelTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {travelTypeError && <p className="text-xs text-rose-600">{travelTypeError}</p>}
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Cover image file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Or image URL</span>
                  <input
                    value={coverUrl}
                    onChange={(event) => setCoverUrl(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="https://example.com/cover.jpg"
                  />
                </label>
              </div>

              {existingCover && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">Current cover preview</p>
                  <img src={existingCover} alt="Current cover" className="mt-3 h-40 w-full rounded-2xl object-cover" />
                </div>
              )}

              {errorMessage && <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-cyan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-500"
              >
                {submitting ? 'Saving changes...' : 'Save trip'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

export default EditTripPage

