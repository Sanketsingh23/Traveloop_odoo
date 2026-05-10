import axios, { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type ChecklistCategory = 'Clothes' | 'Electronics' | 'Documents' | 'Toiletries' | 'Medicines'

type ChecklistItem = {
  id: string
  title: string
  category: ChecklistCategory
  packed: boolean
  createdAt: string
}

type ChecklistResponse = {
  items: ChecklistItem[]
}

type ChecklistItemResponse = {
  item: ChecklistItem
}

const categories: ChecklistCategory[] = ['Clothes', 'Electronics', 'Documents', 'Toiletries', 'Medicines']

const PackingChecklistPage = () => {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ChecklistCategory>('Clothes')
  const [filter, setFilter] = useState<ChecklistCategory | 'All'>('All')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('travelloop_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined

  useEffect(() => {
    if (!token) {
      window.location.href = '/'
      return
    }

    const fetchChecklist = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get<ChecklistResponse>('/checklist', { headers: { Authorization: `Bearer ${token}` } })
        setItems(response.data.items)
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Failed to load checklist')
      } finally {
        setLoading(false)
      }
    }

    void fetchChecklist()
  }, [token])

  const filteredItems = useMemo(() => {
    return filter === 'All' ? items : items.filter((item) => item.category === filter)
  }, [filter, items])

  const packedCount = items.filter((item) => item.packed).length
  const progress = items.length === 0 ? 0 : Math.round((packedCount / items.length) * 100)

  const showMessage = (value: string) => {
    setMessage(value)
    window.setTimeout(() => setMessage(''), 2500)
  }

  const addItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!headers || !nextTitle) return

    try {
      setSaving(true)
      setError('')
      const response = await axios.post<ChecklistItemResponse>('/checklist', { title: nextTitle, category }, { headers })
      setItems((current) => [response.data.item, ...current])
      setTitle('')
      showMessage('Item added.')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const togglePacked = async (item: ChecklistItem) => {
    if (!headers) return

    try {
      const response = await axios.put<ChecklistItemResponse>(`/checklist/${item.id}`, { packed: !item.packed }, { headers })
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? response.data.item : currentItem))
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to update item')
    }
  }

  const removeItem = async (id: string) => {
    if (!headers) return

    try {
      await axios.delete(`/checklist/${id}`, { headers })
      setItems((current) => current.filter((item) => item.id !== id))
      showMessage('Item removed.')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to remove item')
    }
  }

  const resetChecklist = async () => {
    if (!headers || items.length === 0) return
    const confirmed = window.confirm('Reset the full packing checklist?')
    if (!confirmed) return

    try {
      setSaving(true)
      await Promise.all(items.map((item) => axios.delete(`/checklist/${item.id}`, { headers })))
      setItems([])
      setFilter('All')
      showMessage('Checklist reset.')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Failed to reset checklist')
    } finally {
      setSaving(false)
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
            <a href="/activity-search" className="hover:text-cyan-700">Activities</a>
            <a href="/packing-checklist" className="text-cyan-700">Checklist</a>
            <a href="/profile" className="hover:text-cyan-700">Profile</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-3xl bg-linear-to-r from-cyan-700 via-blue-700 to-indigo-700 p-8 text-white shadow-lg shadow-cyan-200/30">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-100/80">Page 10</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Packing Checklist</h1>
              <p className="mt-3 max-w-2xl text-slate-100/90">Add essentials, group them by travel category, and mark each item as packed before departure.</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-100/80">Packed</p>
              <p className="mt-2 text-4xl font-bold">{progress}%</p>
              <p className="mt-2 text-sm text-cyan-50/90">{packedCount} of {items.length} items ready</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <form onSubmit={addItem} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Add item</h2>
              <div className="mt-5 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Item name</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Passport, charger, jacket"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as ChecklistCategory)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  >
                    {categories.map((itemCategory) => <option key={itemCategory}>{itemCategory}</option>)}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
                >
                  {saving ? 'Saving...' : 'Add item'}
                </button>
              </div>
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Filter</h2>
              <div className="mt-4 grid gap-2">
                {(['All', ...categories] as const).map((itemCategory) => (
                  <button
                    key={itemCategory}
                    type="button"
                    onClick={() => setFilter(itemCategory)}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${filter === itemCategory ? 'bg-cyan-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {itemCategory}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void resetChecklist()}
                disabled={saving || items.length === 0}
                className="mt-5 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset checklist
              </button>
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Packing items</h2>
                <p className="text-sm text-slate-500">{filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} shown</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 sm:w-56">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {loading && <p className="rounded-2xl bg-slate-50 p-5 text-slate-600">Loading checklist...</p>}
            {error && <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</p>}
            {message && <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{message}</p>}

            {!loading && filteredItems.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                No packing items in this view.
              </div>
            )}

            {!loading && filteredItems.length > 0 && (
              <div className="grid gap-3">
                {filteredItems.map((item) => (
                  <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.packed}
                        onChange={() => void togglePacked(item)}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
                      />
                      <span>
                        <span className={`block font-semibold ${item.packed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.title}</span>
                        <span className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{item.category}</span>
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => void removeItem(item.id)}
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default PackingChecklistPage
