import { useEffect, useState } from 'react'

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 960)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 960)

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { isMobile }
}
