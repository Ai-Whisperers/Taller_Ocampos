'use client'

import { useState } from 'react'
import { X, HardHat } from 'lucide-react'

/**
 * Construction Banner Component
 *
 * Displays a prominent "Under Construction" banner at the top of the application.
 * Can be toggled via NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER environment variable.
 *
 * Features:
 * - Bilingual (Spanish/English)
 * - Dismissible
 * - Responsive design
 * - Persistent dismissal (localStorage)
 */
export function ConstructionBanner() {
  const showBanner = process.env.NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER === 'true'
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('construction-banner-dismissed') === 'true'
  })

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('construction-banner-dismissed', 'true')
    }
  }

  if (!showBanner || dismissed) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white shadow-lg z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Icon and Message */}
          <div className="flex items-center gap-3 flex-1">
            <HardHat className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 flex-1">
              <span className="font-bold text-sm sm:text-base">
                🚧 En Construcción / Under Construction
              </span>
              <span className="text-xs sm:text-sm opacity-90">
                Estamos trabajando para mejorar su experiencia · We're working to improve your experience
              </span>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Cerrar banner / Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Animated stripe effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
    </div>
  )
}

/**
 * Minimal Construction Banner
 *
 * A simpler, less intrusive version for pages where space is limited
 */
export function MinimalConstructionBanner() {
  const showBanner = process.env.NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER === 'true'

  if (!showBanner) {
    return null
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 px-4 py-2 text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <HardHat className="w-4 h-4" />
        <span className="font-medium">En Construcción / Under Construction</span>
      </div>
    </div>
  )
}
