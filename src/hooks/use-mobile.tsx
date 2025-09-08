import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with a safe default based on current window size to avoid undefined state
  const getInitialValue = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_BREAKPOINT
  }

  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialValue)

  React.useEffect(() => {
    // Immediately set the correct value on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Use both resize event and matchMedia for maximum compatibility
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    window.addEventListener("resize", handleResize)
    
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return isMobile
}
