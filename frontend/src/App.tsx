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
import './App.css'

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
  <main className="auth-page">
    <section className="auth-shell">
      <aside className="auth-visual" aria-label="TravelLoop">
        <div className="brand-lockup">
          <span className="brand-mark">T</span>
          <div>
            <p className="brand-name">TravelLoop</p>
            <p className="brand-tagline">Plan. Loop. Go.</p>
          </div>
        </div>
        <div className="auth-copy">
          <p className="auth-kicker">Smart travel workspace</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="auth-metrics" aria-label="TravelLoop highlights">
          <span>Trips</span>
          <span>Budgets</span>
          <span>Itinerary</span>
        </div>
      </aside>
      <div className="auth-panel">
        <div className="mobile-brand">
          <span className="brand-mark">T</span>
          <p className="brand-name">TravelLoop</p>
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
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">Login to continue planning your next route.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="form-control"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {email && emailError && <p className="field-error">{emailError}</p>}
        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-control"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="ghost-toggle"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {password && passwordError && <p className="field-error">{passwordError}</p>}
        </div>

        <div className="form-links">
          <a href="/forgot-password">Forgot password?</a>
          <a href="/register">Create account</a>
        </div>

        {errorMessage && <p className="alert alert-error">{errorMessage}</p>}

        <button
          type="submit"
          disabled={loading}
          className="primary-action"
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
      <h2 className="auth-title">Create account</h2>
      <p className="auth-subtitle">Save your trips, budgets, and checklist in one place.</p>

      <form className="auth-form compact" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <input className="form-control" placeholder="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          <input className="form-control" placeholder="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </div>
        <div className="form-grid">
          <div>
            <input className="form-control" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            {email && emailError && <p className="field-error">{emailError}</p>}
          </div>
          <input className="form-control" placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div className="form-grid">
          <input className="form-control" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <input className="form-control" placeholder="Country" value={country} onChange={(event) => setCountry(event.target.value)} />
        </div>
        <input className="form-control" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <div>
          <input className="form-control" placeholder="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          {confirmPassword && !passwordsMatch && <p className="field-error">Passwords do not match</p>}
        </div>

        {errorMessage && <p className="alert alert-error">{errorMessage}</p>}
        {successMessage && <p className="alert alert-success">{successMessage}</p>}

        <button type="submit" disabled={loading} className="primary-action">
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="switch-auth">
          Already have an account? <a href="/">Login</a>
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
    <main className="dashboard-page">
      <nav className="app-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="brand-mark">T</span>
            <span>TravelLoop</span>
          </div>
          <div className="nav-links">
            <a href="/dashboard" className="active">Dashboard</a>
            <a href="/trips">My Trips</a>
            <a href="/city-search">Explore</a>
            <a href="/activity-search">Activities</a>
            <a href="/itinerary-budget">Budget</a>
            <a href="/packing-checklist">Checklist</a>
            <a href="/profile">Profile</a>
            <button type="button" onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <section className="dashboard-shell">
        <div className="dashboard-hero">
          <div>
            <p className="dashboard-kicker">Your travel command center</p>
            <h1>Welcome to your Dashboard</h1>
            <p>Quick access to trips, budget insights, destinations, and reminders.</p>
          </div>
          <a href="/trips/create" className="hero-action">Plan trip</a>
        </div>

        {loading && <p className="surface-message">Loading dashboard...</p>}
        {errorMessage && <p className="alert alert-error">{errorMessage}</p>}

        {!loading && !errorMessage && (
          <div className="dashboard-grid">
            <section className="dashboard-section">
              <div className="section-heading">
                <h2>Budget Summary</h2>
                <span>Live overview</span>
              </div>
              <div className="stats-grid">
                <StatCard label="Total Trips" value={stats?.totalTrips ?? 0} />
                <StatCard label="Upcoming" value={stats?.upcomingTrips ?? 0} />
                <StatCard label="Budget" value={`$${stats?.totalBudget ?? 0}`} />
                <StatCard label="Spent" value={`$${stats?.spent ?? 0}`} />
                <StatCard label="Remaining" value={`$${stats?.remaining ?? 0}`} />
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <h2>Recommended Destinations</h2>
                <span>Picked for you</span>
              </div>
              <div className="content-grid">
                {recommended.map((item) => (
                  <article key={item.id} className="destination-card">
                    <span className="card-marker">{item.name.slice(0, 1)}</span>
                    <div>
                      <p>{item.name}</p>
                      <span>{item.country}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <h2>Recent Trips</h2>
                <span>Continue planning</span>
              </div>
              <div className="content-grid">
                {trips.map((trip) => (
                  <article key={trip.id} className="trip-card">
                    <div className="trip-card-top">
                      <p>{trip.destination}</p>
                      <span>{trip.status}</span>
                    </div>
                    <p className="trip-dates">{trip.startDate} to {trip.endDate}</p>
                    <p className="trip-budget">Budget: ${trip.budget}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <h2>Upcoming Trip Reminders</h2>
                <span>Do not miss</span>
              </div>
              <div className="reminder-panel">
                <ul>
                  {reminders.map((reminder) => (
                    <li key={reminder.id}>
                      <span>{reminder.title}</span>
                      <strong>{reminder.date}</strong>
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
  <article className="stat-card">
    <p>{label}</p>
    <strong>{value}</strong>
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
