import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Car, Wrench, User, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { AuthModal } from '../Auth/AuthModal'
import styles from './Nav.module.css'

export function Nav() {
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <NavLink to="/" className={styles.logo}>Stance.io</NavLink>
          <div className={styles.links}>
            <NavLink to="/cars" className={({ isActive }) => isActive ? styles.active : undefined}>
              <Car size={15} />
              Cars
            </NavLink>
            <NavLink to="/parts" className={({ isActive }) => isActive ? styles.active : undefined}>
              <Wrench size={15} />
              Parts
            </NavLink>
          </div>
        </div>

        <div className={styles.right}>
          {user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `${styles.profileLink} ${isActive ? styles.active : ''}`}>
                <User size={15} />
                Profile
              </NavLink>
              <button className={styles.signOut} onClick={signOut}>
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <button className={styles.signIn} onClick={() => setShowAuth(true)}>
              <LogIn size={14} />
              Sign in
            </button>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
