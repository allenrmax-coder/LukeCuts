'use client'
import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, Upload, Trash2, Lock, Unlock,
  CalendarOff, Calendar, Instagram, Video, VideoOff,
  Plus, GripVertical, Settings, RefreshCw, Edit2, ImageIcon, Check as CheckIcon,
} from 'lucide-react'
import { format, addDays, subDays, startOfToday } from 'date-fns'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(time: string) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Types ───────────────────────────────────────────────────────────────────

interface Slot { time: string; status: 'available' | 'booked' | 'blocked' }
interface Photo { id: string; filename: string; url: string; alt: string; uploadedAt: string }
interface AvailabilitySettings {
  allowedDays: number[]
  startTime: string
  endTime: string
  slotDuration: number
  advanceDays: number
}
interface StoredPost { id: string; url: string; addedAt: string }
type MediaMode = 'none' | 'video' | 'photo'
interface AboutContent { mode: MediaMode; videoUrl: string; photoId: string }

// ─── Slots Tab ────────────────────────────────────────────────────────────────

function SlotsTab() {
  const [date, setDate] = useState(startOfToday())
  const [slots, setSlots] = useState<Slot[]>([])
  const [dayBlocked, setDayBlockedState] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const dateStr = format(date, 'yyyy-MM-dd')

  async function loadSlots() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/slots?date=${dateStr}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
      setDayBlockedState(data.dayBlocked ?? false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSlots() }, [dateStr])

  async function toggleSlot(time: string, currentStatus: string) {
    if (currentStatus === 'booked') return
    setSaving(time)
    await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, time, blocked: currentStatus !== 'blocked' }),
    })
    await loadSlots()
    setSaving(null)
  }

  async function toggleDay() {
    setSaving('day')
    await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, dayBlocked: !dayBlocked }),
    })
    await loadSlots()
    setSaving(null)
  }

  const statusColor: Record<string, string> = {
    available: 'border-white/10 bg-white/3 text-white hover:border-white/25',
    blocked: 'border-white/20 bg-white/8 text-gray-400 line-through hover:border-white/30',
    booked: 'border-white/5 bg-white/5 text-gray-600 cursor-not-allowed',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setDate(d => subDays(d, 1))} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-black text-xl">{format(date, 'EEEE')}</p>
          <p className="text-gray-500 text-sm">{format(date, 'MMMM d, yyyy')}</p>
        </div>
        <button onClick={() => setDate(d => addDays(d, 1))} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={toggleDay}
        disabled={saving === 'day'}
        className={`w-full mb-6 py-2.5 rounded-xl border text-sm font-medium transition-all ${
          dayBlocked
            ? 'border-white/20 bg-white/8 text-white hover:bg-white/12'
            : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/5'
        }`}
      >
        {dayBlocked
          ? <span className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /> Unblock Entire Day</span>
          : <span className="flex items-center justify-center gap-2"><CalendarOff className="w-4 h-4" /> Block Entire Day</span>
        }
      </button>

      {loading
        ? <div className="text-center text-gray-600 py-12">Loading...</div>
        : slots.length === 0
          ? <p className="text-center text-gray-600 py-12 text-sm">No slots configured for this day. Update availability settings.</p>
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  onClick={() => toggleSlot(slot.time, slot.status)}
                  disabled={slot.status === 'booked' || saving === slot.time}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-150 text-sm font-medium ${statusColor[slot.status]}`}
                >
                  <span>{fmt(slot.time)}</span>
                  {slot.status === 'available' && <Unlock className="w-3.5 h-3.5 text-gray-500" />}
                  {slot.status === 'blocked' && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                  {slot.status === 'booked' && <CalendarOff className="w-3.5 h-3.5 text-gray-600" />}
                </button>
              ))}
            </div>
          )
      }

      <div className="mt-6 flex items-center gap-6 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><Unlock className="w-3 h-3" /> Available</span>
        <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Blocked</span>
        <span className="flex items-center gap-1.5"><CalendarOff className="w-3 h-3" /> Booked</span>
      </div>
    </div>
  )
}

// ─── Availability Tab ─────────────────────────────────────────────────────────

function AvailabilityTab() {
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/availability')
      .then(r => r.json())
      .then(d => setSettings(d.settings))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setError('')
    setSaved(false)
    const res = await fetch('/api/admin/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Save failed'); setSaving(false); return }
    setSettings(data.settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleDay(d: number) {
    if (!settings) return
    const days = settings.allowedDays.includes(d)
      ? settings.allowedDays.filter(x => x !== d)
      : [...settings.allowedDays, d].sort()
    setSettings({ ...settings, allowedDays: days })
  }

  if (!settings) return <div className="text-gray-600 py-12 text-center">Loading...</div>

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-md">
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Available Days</label>
        <div className="flex gap-2 flex-wrap">
          {DAY_NAMES.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                settings.allowedDays.includes(i)
                  ? 'bg-white text-black border-white'
                  : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Start Time</label>
          <input
            type="time"
            value={settings.startTime}
            onChange={e => setSettings({ ...settings, startTime: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-2">End Time</label>
          <input
            type="time"
            value={settings.endTime}
            onChange={e => setSettings({ ...settings, endTime: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Slot Duration</label>
          <select
            value={settings.slotDuration}
            onChange={e => setSettings({ ...settings, slotDuration: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
          >
            {[15, 30, 45, 60, 90].map(d => (
              <option key={d} value={d} className="bg-[#0f0f0f]">{d} minutes</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Book Up To</label>
          <select
            value={settings.advanceDays}
            onChange={e => setSettings({ ...settings, advanceDays: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
          >
            {[1, 3, 7, 14, 21, 30].map(d => (
              <option key={d} value={d} className="bg-[#0f0f0f]">{d} day{d > 1 ? 's' : ''} ahead</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-sm font-semibold transition-all disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </form>
  )
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  onDelete,
  onReplace,
  onSaveCaption,
}: {
  photo: Photo
  onDelete: (id: string) => void
  onReplace: (id: string, file: File) => void
  onSaveCaption: (id: string, alt: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState(photo.alt)
  const replaceRef = useRef<HTMLInputElement>(null)

  function handleCaptionKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); saveCaption() }
    if (e.key === 'Escape') { setCaption(photo.alt); setEditing(false) }
  }

  function saveCaption() {
    onSaveCaption(photo.id, caption)
    setEditing(false)
  }

  function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onReplace(photo.id, file)
    e.target.value = ''
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/3">
      {/* Image */}
      <div className="relative aspect-square group">
        <img src={photo.url} alt={photo.alt || photo.filename} className="w-full h-full object-cover" />
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => replaceRef.current?.click()}
            title="Replace image"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Replace
          </button>
          <button
            onClick={() => { if (confirm('Delete this photo?')) onDelete(photo.id) }}
            title="Delete"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
        <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleReplaceFile} />
      </div>

      {/* Caption row */}
      <div className="px-3 py-2">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={caption}
              onChange={e => setCaption(e.target.value)}
              onKeyDown={handleCaptionKey}
              onBlur={saveCaption}
              maxLength={200}
              className="flex-1 text-xs bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-white/30 transition-colors"
              placeholder="Add caption..."
            />
            <button onClick={saveCaption} className="shrink-0 text-gray-400 hover:text-white transition-colors">
              <CheckIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full flex items-center gap-1.5 text-left text-xs text-gray-600 hover:text-gray-300 transition-colors group/cap"
          >
            <Edit2 className="w-3 h-3 shrink-0 opacity-0 group-hover/cap:opacity-100 transition-opacity" />
            <span className="truncate">{caption || 'Add caption...'}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function PhotosTab() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [altText, setAltText] = useState('')
  const [error, setError] = useState('')
  const [replacing, setReplacing] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadPhotos() {
    const res = await fetch('/api/admin/photos')
    const data = await res.json()
    setPhotos(data.photos ?? [])
    setLoading(false)
  }
  useEffect(() => { loadPhotos() }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setError(''); setUploading(true)
    const form = new FormData()
    form.append('photo', file)
    form.append('alt', altText)
    try {
      const res = await fetch('/api/admin/photos', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return }
      setAltText('')
      if (fileRef.current) fileRef.current.value = ''
      await loadPhotos()
    } catch {
      setError('Upload failed. Try again.')
    } finally { setUploading(false) }
  }

  async function handleDelete(id: string) {
    await fetch('/api/admin/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadPhotos()
  }

  async function handleReplace(id: string, file: File) {
    setReplacing(id)
    const form = new FormData()
    form.append('photo', file)
    form.append('replaceId', id)
    try {
      const res = await fetch('/api/admin/photos', { method: 'POST', body: form })
      if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Replace failed') }
      await loadPhotos()
    } catch { alert('Replace failed. Try again.') }
    finally { setReplacing(null) }
  }

  async function handleSaveCaption(id: string, alt: string) {
    await fetch('/api/admin/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, alt }),
    })
    setPhotos(ps => ps.map(p => p.id === id ? { ...p, alt } : p))
  }

  return (
    <div>
      {/* Upload form */}
      <form onSubmit={handleUpload} className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/3 space-y-3">
        <h3 className="font-bold text-white">Upload Photo</h3>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/8 file:text-white file:text-sm file:font-medium hover:file:bg-white/12 cursor-pointer"
        />
        <input
          type="text"
          value={altText}
          onChange={e => setAltText(e.target.value)}
          placeholder="Caption (optional)"
          maxLength={200}
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/25 transition-colors"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-sm font-semibold transition-all disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-gray-600 py-12">Loading...</div>
      ) : photos.length === 0 ? (
        <div className="text-center text-gray-600 py-12 text-sm">No photos yet.</div>
      ) : (
        <>
          {replacing && <p className="text-gray-500 text-xs mb-3">Replacing image...</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
                onReplace={handleReplace}
                onSaveCaption={handleSaveCaption}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Instagram Tab ────────────────────────────────────────────────────────────

function InstagramTab() {
  const [posts, setPosts] = useState<StoredPost[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function loadPosts() {
    const res = await fetch('/api/admin/instagram-posts')
    const data = await res.json()
    setPosts(data.posts ?? [])
    setLoading(false)
  }
  useEffect(() => { loadPosts() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setAdding(true)
    const res = await fetch('/api/admin/instagram-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to add'); setAdding(false); return }
    setUrl('')
    setAdding(false)
    await loadPosts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this post?')) return
    await fetch('/api/admin/instagram-posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadPosts()
  }

  async function move(id: string, dir: 'up' | 'down') {
    const idx = posts.findIndex(p => p.id === id)
    if (idx < 0) return
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= posts.length) return
    const reordered = [...posts]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    setPosts(reordered)
    await fetch('/api/admin/instagram-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map(p => p.id) }),
    })
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/3 space-y-3">
        <h3 className="font-bold text-white">Add Instagram Post</h3>
        <p className="text-gray-500 text-xs">Paste a URL like: https://www.instagram.com/p/ABC123/</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            required
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/25 transition-colors"
          />
          <button
            type="submit"
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      {loading
        ? <div className="text-center text-gray-600 py-12">Loading...</div>
        : posts.length === 0
          ? <div className="text-center text-gray-600 py-12 text-sm">No posts added yet. Paste an Instagram post URL above.</div>
          : (
            <div className="space-y-3">
              {posts.map((post, i) => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/3">
                  <GripVertical className="w-4 h-4 text-gray-700 shrink-0" />
                  <span className="flex-1 text-sm text-gray-400 truncate">{post.url}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => move(post.id, 'up')}
                      disabled={i === 0}
                      className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                    <button
                      onClick={() => move(post.id, 'down')}
                      disabled={i === posts.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  )
}

// ─── About/Media Tab ──────────────────────────────────────────────────────────

function AboutTab() {
  const [content, setContent] = useState<AboutContent | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/about').then(r => r.json()),
      fetch('/api/admin/photos').then(r => r.json()),
    ]).then(([a, p]) => {
      setContent(a.content)
      setVideoUrl(a.content?.videoUrl ?? '')
      setPhotos(p.photos ?? [])
    })
  }, [])

  async function setMode(mode: MediaMode) {
    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    const data = await res.json()
    if (res.ok) setContent(data.content)
  }

  async function selectPhoto(photoId: string) {
    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    })
    const data = await res.json()
    if (res.ok) setContent(data.content)
  }

  async function saveVideoUrl(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSaving(true)
    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Save failed'); setSaving(false); return }
    setContent(data.content); setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!content) return <div className="text-gray-600 py-12 text-center">Loading...</div>

  return (
    <div className="max-w-lg space-y-6">
      {/* Mode selector */}
      <div>
        <p className="text-sm font-semibold text-white mb-3">About Section Media</p>
        <div className="flex gap-2">
          {([
            { id: 'none' as MediaMode, label: 'Placeholder', icon: VideoOff },
            { id: 'video' as MediaMode, label: 'Video', icon: Video },
            { id: 'photo' as MediaMode, label: 'Photo', icon: ImageIcon },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                content.mode === id
                  ? 'bg-white text-black border-white'
                  : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Video URL input */}
      {content.mode === 'video' && (
        <div className="p-5 rounded-2xl border border-white/10 bg-white/3 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Video className="w-4 h-4" /> Video Embed URL
          </h3>
          <form onSubmit={saveVideoUrl} className="space-y-3">
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/25 transition-colors"
            />
            <p className="text-gray-600 text-xs">Use the embed URL: youtube.com/embed/ID or player.vimeo.com/video/ID</p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-sm font-semibold transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save URL'}
            </button>
          </form>
          {content.videoUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10 aspect-video">
              <iframe src={content.videoUrl} className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title="Video preview" />
            </div>
          )}
        </div>
      )}

      {/* Photo picker */}
      {content.mode === 'photo' && (
        <div className="p-5 rounded-2xl border border-white/10 bg-white/3 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Pick a Photo
          </h3>
          {photos.length === 0 ? (
            <p className="text-gray-600 text-sm">No photos uploaded yet. Go to the Photos tab to add some.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => selectPhoto(photo.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    content.photoId === photo.id
                      ? 'border-white scale-105 shadow-lg shadow-white/10'
                      : 'border-transparent hover:border-white/30'
                  }`}
                >
                  <img src={photo.url} alt={photo.alt || photo.filename} className="w-full h-full object-cover" />
                  {content.photoId === photo.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'slots' | 'availability' | 'photos' | 'instagram' | 'about'

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'slots', label: 'Time Slots', icon: ({ className }) => <CalendarOff className={className} /> },
  { id: 'availability', label: 'Availability', icon: ({ className }) => <Settings className={className} /> },
  { id: 'photos', label: 'Photos', icon: ({ className }) => <Upload className={className} /> },
  { id: 'instagram', label: 'Instagram', icon: ({ className }) => <Instagram className={className} /> },
  { id: 'about', label: 'About/Media', icon: ({ className }) => <Video className={className} /> },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('slots')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">Manage your schedule, gallery, and site content.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'slots' && <SlotsTab />}
      {tab === 'availability' && <AvailabilityTab />}
      {tab === 'photos' && <PhotosTab />}
      {tab === 'instagram' && <InstagramTab />}
      {tab === 'about' && <AboutTab />}
    </div>
  )
}
