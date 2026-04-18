import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Share2, Trash2, Pencil, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { supabase } from '../lib/supabase'
import styles from './Profile.module.css'

function BuildCard({ build, onDelete, onRename, onLoad }) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(build.name)
  const inputRef = useRef()

  function startEdit() {
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function commitRename() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === build.name) { setEditing(false); setNameInput(build.name); return }
    setEditing(false)
    await onRename(build.id, trimmed)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') { setEditing(false); setNameInput(build.name) }
  }

  return (
    <div className={styles.buildCard}>
      <div
        className={styles.buildThumb}
        style={{ background: build.config?.paintColor?.hex ?? '#1a1a1a' }}
      />
      <div className={styles.buildInfo}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.nameInput}
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <p className={styles.buildName}>{build.name}</p>
        )}
        <p className={styles.buildDate}>
          {new Date(build.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>
      <div className={styles.buildActions}>
        <button title="Load build" onClick={() => onLoad(build)}>
          <Play size={13} />
        </button>
        <button title={editing ? 'Confirm rename' : 'Rename build'} onClick={editing ? commitRename : startEdit}>
          {editing ? <Check size={13} /> : <Pencil size={13} />}
        </button>
        <button title="Share build"><Share2 size={13} /></button>
        <button className={styles.delete} title="Delete build" onClick={() => onDelete(build.id)}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export function Profile() {
  usePageTitle('Profile')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [builds, setBuilds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('saved_configurations')
      .select('id, name, created_at, config, ride_height_mm, car_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setBuilds(data ?? [])
        setLoading(false)
      })
  }, [user])

  async function handleDelete(id) {
    await supabase.from('saved_configurations').delete().eq('id', id)
    setBuilds(prev => prev.filter(b => b.id !== id))
  }

  async function handleRename(id, name) {
    const { error } = await supabase.from('saved_configurations').update({ name }).eq('id', id)
    if (!error) setBuilds(prev => prev.map(b => b.id === id ? { ...b, name } : b))
  }

  function handleLoad(build) {
    navigate(`/configure/${build.car_id}`, { state: { build } })
  }

  return (
    <div className={styles.page}>
      <div className={styles.accountSection}>
        <div className={styles.avatar}>{user?.email?.[0].toUpperCase()}</div>
        <div>
          <p className={styles.email}>{user?.email}</p>
          <p className={styles.joined}>
            Joined {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>My Builds</h2>
          <span className={styles.count}>{builds.length}</span>
        </div>

        {loading ? (
          <div className={styles.empty}><p>Loading…</p></div>
        ) : builds.length === 0 ? (
          <div className={styles.empty}>
            <p>No saved builds yet.</p>
            <p>Configure a car and save your build to see it here.</p>
          </div>
        ) : (
          <div className={styles.buildGrid}>
            {builds.map(build => (
              <BuildCard
                key={build.id}
                build={build}
                onDelete={handleDelete}
                onRename={handleRename}
                onLoad={handleLoad}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
