import { useEffect, useMemo, useState } from 'react'

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 960)
  const [mobileScreen, setMobileScreen] = useState<'menu' | 'page'>('menu')

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 960
      setIsMobile((previous) => {
        if (previous !== mobile) {
          setMobileScreen(mobile ? 'menu' : 'page')
        }
        return mobile
      })
      if (!mobile) {
        setMobileScreen('page')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showMobilePage = useMemo(() => !isMobile || mobileScreen === 'page', [isMobile, mobileScreen])

  return {
    isMobile,
    mobileScreen,
    setMobileScreen,
    showMobilePage,
  }
}
