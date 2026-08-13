import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Applies a light, accessible reveal treatment to public pages without requiring
// every page to duplicate animation code.
export default function PageReveal() {
  const router = useRouter()

  useEffect(() => {
    const root = document.querySelector('.site-page-shell')
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const targets = [...root.querySelectorAll('main > section, main > div > section, main > div > div > section')]
      .filter((element) => !element.closest('[data-no-reveal]'))

    targets.forEach((element, index) => {
      element.classList.add('content-reveal')
      element.style.setProperty('--reveal-delay', `${Math.min(index * 55, 220)}ms`)
    })

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -32px' })

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [router.pathname])

  return null
}
