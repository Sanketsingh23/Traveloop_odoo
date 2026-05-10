import axios, { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type UserProfile = {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phone: string
  city: string
  country: string
  profileImage: string
  preferredDestinations: string[]
  travelPreferences: string[]
}

type ProfileResponse = {
  profile: UserProfile
}

const preferenceOptions = ['Leisure', 'Business', 'Adventure', 'Family', 'Romantic', 'Wellness', 'Culture', 'Food', 'Budget', 'Luxury']

const UserProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preferredDestinations, setPreferredDestinations] = useState('')
  const [travelPreferences, setTravelPreferences] = useState<string[]>([])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('travelloop_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined

  useEffect(() => {
    if (!token) {
      window.location.href = '/'
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get<ProfileResponse>('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const nextProfile = response.data.profile
        setProfile(nextProfile)
        setFirstName(nextProfile.firstName)
        setLastName(nextProfile.lastName)
        setEmail(nextProfile.email)
        setPhone(nextProfile.phone)
        setCity(nextProfile.city)
        setCountry(nextProfile.country)
        setProfileImage(nextProfile.profileImage)
        setPreferredDestinations(nextProfile.preferredDestinations.join(', '))
        setTravelPreferences(nextProfile.travelPreferences)
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    void fetchProfile()
  }, [token])

  const imagePreview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile)
    return profileImage
  }, [imageFile, profileImage])

  const destinationList = useMemo(() => {
    return preferredDestinations
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }, [preferredDestinations])

  const passwordMismatch = Boolean(confirmPassword && newPassword !== confirmPassword)

  const showMessage = (value: string) => {
    setMessage(value)
    window.setTimeout(() => setMessage(''), 3000)
  }

  const togglePreference = (preference: string) => {
    setTravelPreferences((current) => (
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference]
    ))
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!headers) return

    const formData = new FormData()
    formData.append('firstName', firstName.trim())
    formData.append('lastName', lastName.trim())
    formData.append('email', email.trim())
    formData.append('phone', phone.trim())
    formData.append('city', city.trim())
    formData.append('country', country.trim())
    formData.append('profileImageUrl', profileImage.trim())
    formData.append('preferredDestinations', JSON.stringify(destinationList))
    formData.append('travelPreferences', JSON.stringify(travelPreferences))
    if (imageFile) formData.append('profileImage', imageFile)

    try {
      setSavingProfile(true)
      setError('')
      const response = await axios.put<ProfileResponse>('/api/users/profile', formData, { headers })
      const nextProfile = response.data.profile
      setProfile(nextProfile)
      setProfileImage(nextProfile.profileImage)
      setImageFile(null)
      localStorage.setItem('travelloop_user', JSON.stringify({ id: nextProfile.id, name: nextProfile.name, email: nextProfile.email }))
      showMessage('Profile updated.')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!headers || passwordMismatch) return

    try {
      setSavingPassword(true)
      setError('')
      await axios.put('/api/users/profile/password', { currentPassword, newPassword }, { headers })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showMessage('Password updated.')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to update password')
    } finally {
      setSavingPassword(false)
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
            <a href="/trips" className="hover:text-cyan-700">My Trips</a>
            <a href="/packing-checklist" className="hover:text-cyan-700">Checklist</a>
            <a href="/profile" className="text-cyan-700">Profile</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-3xl bg-linear-to-r from-cyan-700 via-blue-700 to-indigo-700 p-8 text-white shadow-lg shadow-cyan-200/30">
          <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-100/80">Page 12</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">User Profile</h1>
          <p className="mt-3 max-w-2xl text-slate-100/90">Manage your account details, profile image, destinations, preferences, and password.</p>
        </div>

        {loading && <p className="rounded-3xl bg-white p-6 text-slate-700 shadow-sm">Loading profile...</p>}
        {error && <p className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">{error}</p>}
        {message && <p className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 shadow-sm">{message}</p>}

        {!loading && profile && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-40 w-40 place-items-center overflow-hidden rounded-full bg-cyan-50 text-5xl font-bold text-cyan-700 ring-4 ring-white shadow-lg">
                  {imagePreview ? (
                    <img src={imagePreview} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{firstName.charAt(0)}{lastName.charAt(0)}</span>
                  )}
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-slate-900">{firstName} {lastName}</h2>
                <p className="mt-1 text-sm text-slate-500">{email}</p>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Preferred destinations</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {destinationList.length === 0 ? (
                    <span className="text-sm text-slate-500">No destinations added</span>
                  ) : (
                    destinationList.map((destination) => (
                      <span key={destination} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{destination}</span>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <form onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Profile information</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">First name</span>
                    <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Last name</span>
                    <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Email</span>
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Phone</span>
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">City</span>
                    <input value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Country</span>
                    <input value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Profile image</span>
                    <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Or image URL</span>
                    <input value={profileImage} onChange={(event) => setProfileImage(event.target.value)} placeholder="https://example.com/avatar.jpg" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                </div>

                <label className="mt-5 block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Preferred destinations</span>
                  <input value={preferredDestinations} onChange={(event) => setPreferredDestinations(event.target.value)} placeholder="Japan, Iceland, New Zealand" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                </label>

                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-700">Travel preferences</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {preferenceOptions.map((preference) => (
                      <label key={preference} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={travelPreferences.includes(preference)} onChange={() => togglePreference(preference)} className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500" />
                        {preference}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={savingProfile} className="mt-6 w-full rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400">
                  {savingProfile ? 'Saving profile...' : 'Save profile'}
                </button>
              </form>

              <form onSubmit={savePassword} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Update password</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Current password</span>
                    <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">New password</span>
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Confirm password</span>
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" />
                  </label>
                </div>
                {passwordMismatch && <p className="mt-3 text-sm text-rose-600">Passwords do not match.</p>}
                <button type="submit" disabled={savingPassword || passwordMismatch || !currentPassword || newPassword.length < 8} className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                  {savingPassword ? 'Updating password...' : 'Update password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default UserProfilePage
