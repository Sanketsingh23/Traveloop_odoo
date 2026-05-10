import axios, { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import TripsPage from './TripsPage.tsx'
import CreateTripPage from './CreateTripPage.tsx'
import EditTripPage from './EditTripPage.tsx'
import ItineraryBuilderPage from './ItineraryBuilderPage.tsx'
import CitySearchPage from './CitySearchPage.tsx'
import ActivitySearchPage from './ActivitySearchPage.tsx'
import ItineraryBudgetPage from './ItineraryBudgetPage.tsx'
import PackingChecklistPage from './PackingChecklistPage.tsx'
import UserProfilePage from './UserProfilePage.tsx'
import { supabase } from "./lib/supabase";


type LoginResponse = {
  token: string
  user: { id: string; name: string; email: string }
  message: string
}

type RegisterResponse = {
  message: string
}

type Trip = {
  id: string
  destination: string
  startDate: string
  endDate: string
  status: string
  budget: number
}

type DashboardStats = {
  totalTrips: number
  upcomingTrips: number
  totalBudget: number
  spent: number
  remaining: number
}

type Reminder = {
  id: string
  title: string
  date: string
}

type Destination = {
  id: string
  name: string
  country: string
}

const AuthLayout = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#c1f2ff_0%,transparent_45%),radial-gradient(circle_at_90%_20%,#d6ffd5_0%,transparent_40%),linear-gradient(145deg,#f7fbff,#eef8ff)] px-4 py-10">
    <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 md:grid-cols-2">
      <div className="hidden bg-linear-to-br from-cyan-700 via-blue-700 to-cyan-900 p-10 text-cyan-50 md:block">
        <div className="mb-12 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-300/20 text-2xl font-bold">T</span>
          <div>
            <p className="text-xl font-semibold tracking-wide">TravelLoop</p>
            <p className="text-sm text-cyan-100/80">Plan. Loop. Go.</p>
          </div>
        </div>
        <h1 className="max-w-sm text-4xl font-bold leading-tight">{title}</h1>
        <p className="mt-5 max-w-sm text-cyan-100/90">{subtitle}</p>
      </div>
      <div className="p-6 sm:p-10">
        <div className="mb-8 flex items-center gap-3 md:hidden">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-700 text-lg font-bold text-cyan-50">T</span>
          <p className="text-lg font-semibold text-slate-900">TravelLoop</p>
        </div>
        {children}
      </div>
    </section>
  </main>
)

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const emailError = useMemo(() => {
    if (!email.trim()) return 'Email is required'
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address'
  }, [email])

  const passwordError = useMemo(() => {
    if (!password.trim()) return 'Password is required'
    return password.length >= 8 ? '' : 'Password must be at least 8 characters'
  }, [password])

  const isFormValid = !emailError && !passwordError

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!isFormValid) {
      setErrorMessage('Please fix validation errors before logging in')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post<LoginResponse>('/api/auth/login', { email, password })
      localStorage.setItem('travelloop_token', response.data.token)
      localStorage.setItem('travelloop_user', JSON.stringify(response.data.user))
      window.location.href = '/dashboard'
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      setErrorMessage(axiosError.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in to continue your journey."
      subtitle="Access your itineraries, saved destinations, and personalized travel insights."
    >
      <h2 className="text-2xl font-bold text-slate-900">Login</h2>
      <p className="mt-1 text-sm text-slate-600">Authenticate your account to continue.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {email && emailError && <p className="mt-2 text-xs text-rose-600">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-24 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {password && passwordError && <p className="mt-2 text-xs text-rose-600">{passwordError}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <a href="/forgot-password" className="font-medium text-cyan-700 hover:text-cyan-800">Forgot password?</a>
          <a href="/register" className="font-medium text-slate-700 hover:text-slate-900">Register</a>
        </div>

        {errorMessage && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-500"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </AuthLayout>
  )
}

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const emailError = useMemo(() => {
    if (!email.trim()) return 'Email is required'
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address'
  }, [email])

  const hasRequiredFields = [firstName, lastName, email, phone, city, country, password, confirmPassword]
    .map((value) => value.trim())
    .every(Boolean)

  const passwordsMatch = password === confirmPassword

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!hasRequiredFields) {
      setErrorMessage('All fields are required')
      return
    }

    if (emailError) {
      setErrorMessage(emailError)
      return
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post<RegisterResponse>('/auth/register', {
        firstName,
        lastName,
        email,
        phone,
        city,
        country,
        password,
        confirmPassword,
      })

      setSuccessMessage(`${response.data.message}. You can now login.`)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setCity('')
      setCountry('')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      setErrorMessage(axiosError.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your TravelLoop account."
      subtitle="Sign up to manage trips, save destinations, and personalize your travel profile."
    >
      <h2 className="text-2xl font-bold text-slate-900">Register</h2>
      <p className="mt-1 text-sm text-slate-600">Create your new account.</p>

      <form className="mt-8 grid gap-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            {email && emailError && <p className="mt-2 text-xs text-rose-600">{emailError}</p>}
          </div>
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Country" value={country} onChange={(event) => setCountry(event.target.value)} />
        </div>
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <div>
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          {confirmPassword && !passwordsMatch && <p className="mt-2 text-xs text-rose-600">Passwords do not match</p>}
        </div>

        {errorMessage && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>}
        {successMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-800 disabled:bg-cyan-500">
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account? <a href="/" className="font-semibold text-cyan-700">Login</a>
        </p>
      </form>
    </AuthLayout>
  )
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [trips, setTrips] = useState<Trip[]>([])
  const [recommended, setRecommended] = useState<Destination[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])

  useEffect(() => {
    const token = localStorage.getItem('travelloop_token')
    if (!token) {
      window.location.href = '/'
      return
    }

    const headers = { Authorization: `Bearer ${token}` }

    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const [tripsResponse, statsResponse] = await Promise.all([
          axios.get<{ trips: Trip[]; recommendedDestinations: Destination[] }>('/trips/recent', { headers }),
          axios.get<{ stats: DashboardStats; reminders: Reminder[] }>('/users/dashboard-stats', { headers }),
        ])

        setTrips(tripsResponse.data.trips)
        setRecommended(tripsResponse.data.recommendedDestinations)
        setStats(statsResponse.data.stats)
        setReminders(statsResponse.data.reminders)
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>
        setErrorMessage(axiosError.response?.data?.message ?? 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    void fetchDashboard()
  }, [])

  const logout = () => {
    localStorage.removeItem('travelloop_token')
    localStorage.removeItem('travelloop_user')
    window.location.href = '/'
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-700 font-bold text-white">T</span>
            <span className="text-lg font-bold text-slate-900">TravelLoop</span>
          </div>
          <div className="flex items-center gap-5 text-sm font-medium text-slate-700">
            <a href="/dashboard" className="text-cyan-700">Dashboard</a>
            <a href="/trips" className="hover:text-cyan-700">My Trips</a>
            <a href="/city-search" className="hover:text-cyan-700">Explore</a>
            <a href="/activity-search" className="hover:text-cyan-700">Activities</a>
            <a href="/itinerary-budget" className="hover:text-cyan-700">Budget</a>
            <a href="/packing-checklist" className="hover:text-cyan-700">Checklist</a>
            <a href="/profile" className="hover:text-cyan-700">Profile</a>
            <button type="button" onClick={logout} className="rounded-lg bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100">Logout</button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 rounded-2xl bg-linear-to-r from-cyan-700 via-blue-700 to-indigo-700 p-6 text-white">
          <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
          <p className="mt-2 text-cyan-50/90">Quick access to trips, budget insights, and travel reminders.</p>
        </div>

        {loading && <p className="rounded-xl bg-white p-4 text-slate-700 shadow">Loading dashboard...</p>}
        {errorMessage && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{errorMessage}</p>}

        {!loading && !errorMessage && (
          <div className="grid gap-6">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">Budget Summary</h2>
              <div className="grid gap-4 md:grid-cols-5">
                <StatCard label="Total Trips" value={stats?.totalTrips ?? 0} />
                <StatCard label="Upcoming" value={stats?.upcomingTrips ?? 0} />
                <StatCard label="Budget" value={`$${stats?.totalBudget ?? 0}`} />
                <StatCard label="Spent" value={`$${stats?.spent ?? 0}`} />
                <StatCard label="Remaining" value={`$${stats?.remaining ?? 0}`} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">Recommended Destinations</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {recommended.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">{item.country}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">Recent Trips</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {trips.map((trip) => (
                  <article key={trip.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-lg font-semibold text-slate-900">{trip.destination}</p>
                    <p className="mt-1 text-sm text-slate-600">{trip.startDate} to {trip.endDate}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">{trip.status}</p>
                    <p className="mt-2 text-sm text-slate-700">Budget: ${trip.budget}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">Upcoming Trip Reminders</h2>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <ul className="space-y-3">
                  {reminders.map((reminder) => (
                    <li key={reminder.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                      <span className="text-slate-700">{reminder.title}</span>
                      <span className="text-sm font-medium text-cyan-700">{reminder.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
  </article>
)

function App() {
  const path = window.location.pathname

  if (path === '/register') return <RegisterPage />
  if (path === '/dashboard') return <DashboardPage />
  if (path === '/trips/create') return <CreateTripPage />
  if (path.startsWith('/trips/edit/')) {
    const tripId = path.replace('/trips/edit/', '')
    return <EditTripPage tripId={tripId} />
  }
  if (path.startsWith('/itinerary-builder/')) {
    const tripId = path.replace('/itinerary-builder/', '')
    return <ItineraryBuilderPage tripId={tripId} />
  }
  if (path.startsWith('/itinerary-budget/')) {
    const tripId = path.replace('/itinerary-budget/', '')
    return <ItineraryBudgetPage tripId={tripId} />
  }
  if (path === '/city-search') return <CitySearchPage />
  if (path === '/activity-search') return <ActivitySearchPage />
  if (path === '/itinerary-budget') return <ItineraryBudgetPage />
  if (path === '/packing-checklist') return <PackingChecklistPage />
  if (path === '/profile') return <UserProfilePage />
  if (path === '/trips') return <TripsPage />

  return <LoginPage />
}

export default App
