import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Applies a light, accessible reveal treatment to public pages without requiring
// every page to duplicate animation code.
export default function PageReveal() {
  const router = useRouter()

  useEffect(() => {
    const root = document.querySelector('.site-page-shell')
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const targets = [...root.querySelectorAll('main > section, main > div > section, main > div > div > section, [data-reveal], .card-stagger > *')]
      .filter((element) => !element.closest('[data-no-reveal]'))

    targets.forEach((element, index) => {
      element.classList.add('content-reveal')
      const siblings = element.parentElement?.classList.contains('card-stagger')
        ? [...element.parentElement.children]
        : null
      const revealIndex = siblings ? siblings.indexOf(element) : index
      element.style.setProperty('--reveal-delay', `${Math.min(revealIndex * (siblings ? 85 : 55), siblings ? 340 : 220)}ms`)
    })

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -48px' })

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [router.pathname])

  return null
}
