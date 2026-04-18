import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Stance.io` : 'Stance.io'
    return () => { document.title = 'Stance.io' }
  }, [title])
}
