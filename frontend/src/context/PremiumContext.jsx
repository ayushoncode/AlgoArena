/**
 * frontend/src/context/PremiumContext.jsx
 *
 * Provides reactive subscription status, entitlements, and locked modal management.
 * 
 * Rules:
 * - Cached, refetched on login, after checkout, and every 5 minutes.
 * - Frontend reflects server response; never determines access on its own.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import LockedFeatureModal from '../components/LockedFeatureModal'

const PremiumContext = createContext(null)

export function PremiumProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [status, setStatus] = useState({
    active: false,
    until: null,
    cancelAtPeriodEnd: false,
    plan: null,
    launchSlot: false,
    enabled: true
  })
  const [loading, setLoading] = useState(true)

  // Locked feature modal state
  const [lockedModal, setLockedModal] = useState({
    isOpen: false,
    featureKey: 'sheet'
  })

  const openLockedModal = useCallback((featureKey = 'sheet') => {
    setLockedModal({ isOpen: true, featureKey })
  }, [])

  const closeLockedModal = useCallback(() => {
    setLockedModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/api/premium/status')
      if (data) {
        setStatus(data)
      }
    } catch (err) {
      // Offline / network failure: keep current or fallback
      console.warn('[PremiumContext] Failed to fetch subscription status:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch on auth state change
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus, isAuthenticated, user?.id])

  // Periodic polling every 5 minutes while authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    const intervalId = setInterval(() => {
      fetchStatus()
    }, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [fetchStatus, isAuthenticated])

  // Intercept 403 PREMIUM_REQUIRED events dispatched by api.js
  useEffect(() => {
    function handleGatedEvent(e) {
      const featureKey = e.detail?.feature || 'sheet'
      openLockedModal(featureKey)
    }
    window.addEventListener('premium-gated-error', handleGatedEvent)
    return () => window.removeEventListener('premium-gated-error', handleGatedEvent)
  }, [openLockedModal])

  const isPremium = useMemo(() => Boolean(status?.active), [status?.active])
  const isPremiumEnabled = useMemo(() => status?.enabled !== false, [status?.enabled])

  const contextValue = useMemo(() => ({
    status,
    isPremium,
    isPremiumEnabled,
    loading,
    refreshStatus: fetchStatus,
    openLockedModal,
    closeLockedModal
  }), [status, isPremium, isPremiumEnabled, loading, fetchStatus, openLockedModal, closeLockedModal])

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
      <LockedFeatureModal
        isOpen={lockedModal.isOpen}
        onClose={closeLockedModal}
        featureKey={lockedModal.featureKey}
      />
    </PremiumContext.Provider>
  )
}

export function usePremium() {
  const context = useContext(PremiumContext)
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider')
  }
  return context
}

