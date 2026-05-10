import { useCallback, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type City = {
  id: string
  name: string
  country: string
  region: string
  popularity: number
  estimatedCost: number
  imageUrl: string
  description: string
  highlights: string[]
}

type FilterOptions = {
  country: string
  region: string
}

const cities: City[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'Ile-de-France',
    popularity: 96,
    estimatedCost: 185,
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80',
    description: 'Museums, grand boulevards, cafe culture, and classic first-trip icons.',
    highlights: ['Art', 'Food', 'Architecture'],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'Kanto',
    popularity: 94,
    estimatedCost: 155,
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80',
    description: 'Neon neighborhoods, calm gardens, serious food, and effortless transit.',
    highlights: ['Food', 'Nightlife', 'Culture'],
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    region: 'Catalonia',
    popularity: 91,
    estimatedCost: 130,
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=80',
    description: 'Beach days, Gaudi landmarks, tapas routes, and late golden evenings.',
    highlights: ['Beach', 'Design', 'Food'],
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    region: 'New York',
    popularity: 93,
    estimatedCost: 230,
    imageUrl: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=80',
    description: 'A dense city break for skyline walks, shows, galleries, and late dinners.',
    highlights: ['Museums', 'Shows', 'Shopping'],
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    region: 'Central Thailand',
    popularity: 89,
    estimatedCost: 75,
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80',
    description: 'Street food, temples, markets, river ferries, and easy onward travel.',
    highlights: ['Budget', 'Food', 'Temples'],
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    region: 'Lazio',
    popularity: 92,
    estimatedCost: 150,
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80',
    description: 'Ancient ruins, trattorias, piazzas, and compact walking routes.',
    highlights: ['History', 'Food', 'Walks'],
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    region: 'England',
    popularity: 90,
    estimatedCost: 210,
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80',
    description: 'Historic sights, neighborhoods with distinct moods, and strong rail links.',
    highlights: ['Museums', 'Theatre', 'Transit'],
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    region: 'New South Wales',
    popularity: 86,
    estimatedCost: 175,
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=80',
    description: 'Harbor views, coastal walks, beaches, ferries, and relaxed city energy.',
    highlights: ['Beach', 'Outdoors', 'Harbor'],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Dubai',
    popularity: 88,
    estimatedCost: 220,
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80',
    description: 'High-design hotels, desert trips, skyline views, and polished shopping.',
    highlights: ['Luxury', 'Desert', 'Shopping'],
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    region: 'North Holland',
    popularity: 87,
    estimatedCost: 145,
    imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=80',
    description: 'Canals, cycling, design shops, galleries, and easy day trips.',
    highlights: ['Canals', 'Art', 'Cycling'],
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    region: 'Lisbon',
    popularity: 85,
    estimatedCost: 115,
    imageUrl: 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=900&q=80',
    description: 'Hilltop viewpoints, tile-lined streets, seafood, and Atlantic light.',
    highlights: ['Views', 'Food', 'Coast'],
  },
  {
    id: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    region: 'Capital Area',
    popularity: 88,
    estimatedCost: 125,
    imageUrl: 'https://images.unsplash.com/photo-1538485399081-7c8a9f3a1f3c?auto=format&fit=crop&w=900&q=80',
    description: 'Palaces, cafes, fashion districts, mountain trails, and late-night dining.',
    highlights: ['Culture', 'Food', 'Shopping'],
  },
]

const getCostTone = (cost: number) => {
  if (cost < 100) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (cost < 180) return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

const getCostLabel = (cost: number) => {
  if (cost < 100) return 'Budget'
  if (cost < 180) return 'Moderate'
  return 'Premium'
}

const SearchBar = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <label htmlFor="city-search" className="sr-only">Search city</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="city-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search city, country, region, or vibe"
          className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
        />
        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-cyan-700 px-6 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          Search
        </button>
      </div>
    </form>
  )
}

const FilterPanel = ({
  filters,
  onFilterChange,
  onClear,
}: {
  filters: FilterOptions
  onFilterChange: (key: keyof FilterOptions, value: string) => void
  onClear: () => void
}) => {
  const countries = useMemo(() => Array.from(new Set(cities.map((city) => city.country))).sort(), [])
  const regions = useMemo(() => {
    const source = filters.country ? cities.filter((city) => city.country === filters.country) : cities
    return Array.from(new Set(source.map((city) => city.region))).sort()
  }, [filters.country])

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <p className="text-sm text-slate-500">Narrow destinations by location.</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Country</span>
          <select
            value={filters.country}
            onChange={(event) => {
              onFilterChange('country', event.target.value)
              onFilterChange('region', '')
            }}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Region</span>
          <select
            value={filters.region}
            onChange={(event) => onFilterChange('region', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="">All regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  )
}

const CityCard = ({
  city,
  isSaved,
  onAddToTrip,
}: {
  city: City
  isSaved: boolean
  onAddToTrip: (city: City) => void
}) => (
  <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative h-52 overflow-hidden">
      <img src={city.imageUrl} alt={city.name} className="h-full w-full object-cover" />
      <div className="absolute left-4 top-4 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-white">
        {city.country}
      </div>
    </div>

    <div className="space-y-4 p-5">
      <div>
        <p className="text-sm font-medium text-cyan-700">{city.region}</p>
        <h3 className="mt-1 text-2xl font-semibold text-slate-900">{city.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{city.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-yellow-700">Popularity</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{city.popularity}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${getCostTone(city.estimatedCost)}`}>
          <p className="text-xs font-semibold uppercase tracking-[.16em]">Est. cost</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">${city.estimatedCost}</p>
          <p className="text-xs font-semibold">{getCostLabel(city.estimatedCost)} / day</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {city.highlights.map((highlight) => (
          <span key={highlight} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {highlight}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddToTrip(city)}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isSaved
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'bg-cyan-700 text-white hover:bg-cyan-800'
        }`}
      >
        {isSaved ? 'Added to trip' : 'Add to trip'}
      </button>
    </div>
  </article>
)

const CitySearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({ country: '', region: '' })
  const [savedCityIds, setSavedCityIds] = useState<string[]>(() => {
    try {
      const savedCities = JSON.parse(localStorage.getItem('destinationList') || '[]') as City[]
      return savedCities.map((city) => city.id)
    } catch {
      return []
    }
  })
  const [message, setMessage] = useState('')

  const filteredCities = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return cities
      .filter((city) => {
        if (filters.country && city.country !== filters.country) return false
        if (filters.region && city.region !== filters.region) return false
        if (!normalizedQuery) return true

        return [
          city.name,
          city.country,
          city.region,
          city.description,
          ...city.highlights,
        ].some((value) => value.toLowerCase().includes(normalizedQuery))
      })
      .sort((a, b) => b.popularity - a.popularity)
  }, [filters.country, filters.region, searchQuery])

  const averageCost = useMemo(() => {
    if (!filteredCities.length) return 0
    const total = filteredCities.reduce((sum, city) => sum + city.estimatedCost, 0)
    return Math.round(total / filteredCities.length)
  }, [filteredCities])

  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }, [])

  const clearFilters = () => {
    setFilters({ country: '', region: '' })
    setSearchQuery('')
  }

  const handleAddToTrip = (city: City) => {
    try {
      const savedCities = JSON.parse(localStorage.getItem('destinationList') || '[]') as City[]
      const alreadySaved = savedCities.some((savedCity) => savedCity.id === city.id)
      const nextCities = alreadySaved ? savedCities : [...savedCities, city]

      localStorage.setItem('destinationList', JSON.stringify(nextCities))
      setSavedCityIds(nextCities.map((savedCity) => savedCity.id))
      setMessage(alreadySaved ? `${city.name} is already in your trip ideas.` : `${city.name} added to your trip ideas.`)
      window.setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('Could not update your trip ideas. Please try again.')
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
            <a href="/city-search" className="text-cyan-700">Explore</a>
            <a href="/activity-search" className="hover:text-cyan-700">Activities</a>
            <a href="/itinerary-budget" className="hover:text-cyan-700">Budget</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-3xl bg-linear-to-r from-cyan-700 via-blue-700 to-indigo-700 p-8 text-white shadow-lg shadow-cyan-200/30">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-100/80">Page 7</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">City Search</h1>
              <p className="mt-3 max-w-2xl text-slate-100/90">
                Search destinations, compare popularity, estimate daily cost, and save cities to shape the next trip.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Results</p>
                <p className="mt-2 text-3xl font-bold">{filteredCities.length}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Avg cost</p>
                <p className="mt-2 text-3xl font-bold">${averageCost}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Saved</p>
                <p className="mt-2 text-3xl font-bold">{savedCityIds.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-6">
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} />
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Optional APIs</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page is ready for OpenTripMap or Google Places data. The current dataset keeps the UI usable without API keys.
              </p>
            </div>
          </div>

          <div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />

            {message && (
              <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {message}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Destinations</h2>
                <p className="text-sm text-slate-500">
                  Sorted by popularity score, highest first.
                </p>
              </div>
              <a
                href="/activity-search"
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Find activities
              </a>
            </div>

            {filteredCities.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">No destinations found</h3>
                <p className="mt-2 text-sm text-slate-500">Try a different city name, country, or region.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                {filteredCities.map((city) => (
                  <CityCard
                    key={city.id}
                    city={city}
                    isSaved={savedCityIds.includes(city.id)}
                    onAddToTrip={handleAddToTrip}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default CitySearchPage
