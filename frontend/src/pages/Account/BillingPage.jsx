/**
 * frontend/src/pages/Account/BillingPage.jsx
 *
 * Dedicated subscription management and payment history page:
 * - Active subscription status, renewal / expiration schedule
 * - Launch slot vs Standard plan pricing transparency
 * - Payment history records from payments ledger
 * - Subscription cancellation modal with confirmation
 * - Links to refund policy and support contact
 */

import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePremium } from '../../hooks/usePremium'
import api from '../../utils/api'
import { IconChevronLeft, IconClose, IconHexagonBadge } from '../../components/icons'
import './Billing.css'

export default function BillingPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { refreshStatus } = usePremium()

  const [billingData, setBillingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cancel dialog state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const modalRef = useRef(null)
  const cancelBtnRef = useRef(null)

  const fetchBilling = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/premium/billing')
      setBillingData(data)
      setError(null)
    } catch (err) {
      console.warn('[BillingPage] Failed to load billing info:', err.message)
      setError('Unable to load billing details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Billing & Subscription | AlgoArena'
    window.scrollTo(0, 0)

    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/account/billing')
      return
    }

    if (isAuthenticated) {
      fetchBilling()
    }
  }, [authLoading, isAuthenticated, navigate])

  // Esc key and focus trap for cancel dialog
  useEffect(() => {
    if (!showCancelModal) return

    const prevActiveElement = document.activeElement
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus()
    }, 40)

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowCancelModal(false)
        return
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      prevActiveElement?.focus?.()
    }
  }, [showCancelModal])

  async function handleConfirmCancel() {
    setCancelling(true)
    setCancelError(null)

    try {
      await api.post('/api/premium/cancel')
      setShowCancelModal(false)
      await fetchBilling()
      refreshStatus()
    } catch (err) {
      setCancelError(err?.message || 'Cancellation request failed. Please contact support.')
    } finally {
      setCancelling(false)
    }
  }

  const sub = billingData?.subscription || null
  const payments = billingData?.payments || []

  // Compute status state
  const isSubActive = Boolean(sub?.active)
  const isCancelling = Boolean(sub?.cancelAtPeriodEnd && sub?.active)
  const isPendingGrace = sub?.status === 'pending' || sub?.status === 'halted'
  const isEnded = !isSubActive && (sub?.status === 'cancelled' || sub?.status === 'completed' || sub?.status === 'expired')

  let formattedDate = 'None'
  if (sub?.until) {
    try {
      const d = new Date(sub.until)
      formattedDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {}
  }

  const planName = sub?.launchSlot ? 'Premium Launch' : 'Premium Standard'
  const planPriceDisplay = sub?.launchSlot ? '39' : '100'

  return (
    <div className="billing-page-wrapper">
      <main className="billing-page-container">

        {/* Back Link */}
        <Link to="/profile" className="billing-back-link">
          <IconChevronLeft size={14} />
          <span>Back to profile</span>
        </Link>

        {/* Header */}
        <header className="billing-header">
          <h1 className="billing-title">Billing and Subscription</h1>
          <p className="billing-subtitle">
            Manage your AlgoArena Premium subscription, payment methods, and billing history.
          </p>
        </header>

        {loading ? (
          <div className="billing-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--sub, #a2a9b8)' }}>
            Loading subscription details...
          </div>
        ) : error ? (
          <div className="billing-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchBilling}
              className="mt-3 px-3 py-1.5 text-xs bg-red-950 border border-red-800 rounded text-white"
            >
              Retry
            </button>
          </div>
        ) : isSubActive || isEnded ? (
          <>
            {/* Subscription Overview Card */}
            <section className="billing-card" aria-labelledby="sub-overview-title">
              <div className="billing-card-header">
                <div className="flex items-center gap-2">
                  <IconHexagonBadge size={16} />
                  <h2 id="sub-overview-title" className="billing-card-title">
                    {planName}
                  </h2>
                </div>

                {isCancelling ? (
                  <span className="billing-status-pill status-pill-cancelling">
                    Cancels on {formattedDate}
                  </span>
                ) : isPendingGrace ? (
                  <span className="billing-status-pill status-pill-failed">
                    Renewal failed (Grace active)
                  </span>
                ) : isSubActive ? (
                  <span className="billing-status-pill status-pill-active">
                    Active
                  </span>
                ) : (
                  <span className="billing-status-pill status-pill-ended">
                    Ended
                  </span>
                )}
              </div>

              <div className="billing-grid">
                <div className="billing-detail-item">
                  <span className="billing-detail-label">Plan</span>
                  <span className="billing-detail-val">{planName}</span>
                </div>

                <div className="billing-detail-item">
                  <span className="billing-detail-label">Amount</span>
                  <span className="billing-detail-val billing-detail-mono">₹{planPriceDisplay} / month</span>
                </div>

                <div className="billing-detail-item">
                  <span className="billing-detail-label">
                    {isCancelling ? 'Access ends on' : isSubActive ? 'Next billing date' : 'Ended on'}
                  </span>
                  <span className="billing-detail-val billing-detail-mono">{formattedDate}</span>
                </div>

                <div className="billing-detail-item">
                  <span className="billing-detail-label">Billing platform</span>
                  <span className="billing-detail-val">Razorpay Subscriptions</span>
                </div>
              </div>

              {/* Action Strip */}
              <div className="billing-action-strip">
                {isCancelling ? (
                  <div className="billing-notice-copy">
                    Your subscription is scheduled to cancel. You have full access to the A2Z Sheet curriculum and sheet duels through {formattedDate}. No further charges will be made.
                  </div>
                ) : isPendingGrace ? (
                  <div className="billing-notice-copy" style={{ color: '#fca5a5' }}>
                    Payment renewal attempt failed. Access remains active through the grace period ending on {formattedDate}. Please verify your payment method through Razorpay notifications.
                  </div>
                ) : isSubActive ? (
                  <>
                    <div className="billing-notice-copy">
                      Your subscription renews automatically every month. You can cancel at any time before the next billing date.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="btn-cancel-sub"
                    >
                      Cancel subscription
                    </button>
                  </>
                ) : (
                  <>
                    <div className="billing-notice-copy">
                      Your subscription has concluded. Your ratings, match history, and profile records remain intact. You can re-subscribe anytime.
                    </div>
                    <Link to="/premium" className="btn-upgrade-sub">
                      Re-subscribe to Premium
                    </Link>
                  </>
                )}
              </div>
            </section>

            {/* Payment History Table */}
            <section aria-labelledby="billing-history-title">
              <h2 id="billing-history-title" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Payment History
              </h2>

              <div className="billing-table-wrap">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Date</th>
                      <th style={{ width: '35%' }}>Payment ID</th>
                      <th style={{ width: '20%' }}>Amount</th>
                      <th style={{ width: '20%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="billing-table-empty">
                          No payment transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => {
                        let payDate = 'Unknown'
                        if (p.captured_at || p.created_at) {
                          try {
                            const dt = new Date(p.captured_at || p.created_at)
                            payDate = dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                          } catch {}
                        }
                        const amountRupees = Math.round((p.amount || 0) / 100)

                        return (
                          <tr key={p.id}>
                            <td className="billing-detail-mono">{payDate}</td>
                            <td className="billing-detail-mono" style={{ color: 'var(--sub, #a2a9b8)' }}>
                              {p.razorpay_payment_id}
                            </td>
                            <td className="billing-detail-mono font-medium">
                              ₹{amountRupees}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontFamily: 'var(--font-mono, monospace)',
                                  textTransform: 'uppercase',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  background: p.status === 'captured' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: p.status === 'captured' ? '#86efac' : '#fca5a5',
                                  border: `1px solid ${p.status === 'captured' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                                }}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          /* Not Subscribed View */
          <div className="billing-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 214, 150, 0.08)', color: 'var(--gold, #ffd696)' }}>
              <IconHexagonBadge size={24} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Active Subscription</h2>
            <p style={{ fontSize: '14px', color: 'var(--sub, #a2a9b8)', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              You are currently on the free plan. Subscribe to AlgoArena Premium for access to the A2Z Sheet curriculum and sheet duels.
            </p>
            <Link to="/premium" className="btn-upgrade-sub">
              View Premium Plan
            </Link>
          </div>
        )}

        {/* Compliance & Contact Footer */}
        <footer className="billing-footer-meta">
          <p style={{ margin: '0 0 6px' }}>
            For questions regarding your subscription, refunds, or payment invoices, review our{' '}
            <Link to="/refund-policy">Refund Policy</Link> and{' '}
            <Link to="/terms">Terms of Service</Link>, or contact{' '}
            <a href="mailto:support@algoarena.io">support@algoarena.io</a>.
          </p>
          <p style={{ margin: 0 }}>
            AlgoArena operates under strict competitive fairness. Subscriptions do not alter Elo rating calculations, matchmaking algorithms, problem difficulty, or judge execution quotas.
          </p>
        </footer>

      </main>

      {/* Cancellation Confirmation Dialog */}
      {showCancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          aria-describedby="cancel-modal-desc"
          className="billing-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelling) setShowCancelModal(false)
          }}
        >
          <div ref={modalRef} className="billing-modal-box">
            {/* Close */}
            <button
              type="button"
              disabled={cancelling}
              onClick={() => setShowCancelModal(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-1.5 transition-colors"
              style={{ color: 'var(--sub, #a2a9b8)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <IconClose size={16} />
            </button>

            <h2 id="cancel-modal-title" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '10px' }}>
              Cancel subscription?
            </h2>

            <p id="cancel-modal-desc" style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--sub, #a2a9b8)', marginBottom: '16px' }}>
              Your subscription will remain active until the end of your current billing period on <strong>{formattedDate}</strong>. After this date, you will not be charged again.
            </p>

            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-2, #0d1527)',
                border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.12))',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'var(--sub, #a2a9b8)',
                marginBottom: '20px'
              }}
            >
              All duel history, earned ratings, Intel Reports, and profile data remain preserved on your account. Only curriculum indexing and sheet-based duels will be paused after your period ends.
            </div>

            {cancelError && (
              <div style={{ color: '#fca5a5', fontSize: '12px', marginBottom: '14px' }}>
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded text-xs transition-colors"
                style={{
                  color: 'var(--sub, #a2a9b8)',
                  background: 'transparent',
                  border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.16))',
                  cursor: 'pointer'
                }}
              >
                Keep subscription
              </button>

              <button
                ref={cancelBtnRef}
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded text-xs font-semibold"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  cursor: cancelling ? 'not-allowed' : 'pointer'
                }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

