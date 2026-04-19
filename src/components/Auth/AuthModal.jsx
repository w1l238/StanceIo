import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './AuthModal.module.css'

export function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [closing, setClosing] = useState(false)
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 180)
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
        setSuccessMsg('Account created — check your email to confirm.')
      } else {
        await signIn(email, password)
        handleClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`} onClick={handleClose}>
      <div className={`${styles.modal} ${closing ? styles.modalClosing : ''}`} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={handleClose} aria-label="Close">
          <X size={16} />
        </button>

        <p className={styles.brand}>Stance.io</p>
        <h2>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>

        {successMsg ? (
          <p className={styles.success}>{successMsg}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        )}

        <p className={styles.toggle}>
          {mode === 'signin' ? (
            <>No account? <button onClick={() => { setMode('signup'); setError(null) }}>Sign up</button></>
          ) : (
            <>Have an account? <button onClick={() => { setMode('signin'); setError(null) }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  )
}
