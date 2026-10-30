/**
 * frontend/src/pages/Premium/PremiumPage.jsx
 *
 * Public Premium subscription page for AlgoArena:
 * 1. Header with clean sentence
 * 2. Ruled pricing block with launch offer / spots left
 * 3. Feature comparison matrix (data driven)
 * 4. FAQ accordion
 * 5. Lazy Razorpay Checkout loader and activation status polling
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PREMIUM_CONFIG } from '../../content/premium'
import { useAuth } from '../../hooks/useAuth'
import { usePremium } from '../../hooks/usePremium'
import api from '../../utils/api'
import { IconChevronDown, IconChevronRight, IconHexagonBadge, IconLock } from '../../components/icons'
import './Premium.css'

function loadRazorpayCheckoutScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true)
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PremiumPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isPremium, status: subStatus, refreshStatus } = usePremium()

  const [offer, setOffer] = useState(null)
  const [offerLoading, setOfferLoading] = useState(true)
  const [openFaqIndices, setOpenFaqIndices] = useState(new Set([0]))

  // Checkout states: 'idle' | 'initiating' | 'activating' | 'success' | 'failed' | 'delayed'
  const [checkoutStep, setCheckoutStep] = useState('idle')
  const [checkoutError, setCheckoutError] = useState(null)

  useEffect(() => {
    document.title = 'Premium | AlgoArena'
    window.scrollTo(0, 0)

    let isMounted = true
    api.get('/api/premium/offer')
      .then(({ data }) => {
        if (isMounted) {
          setOffer(data)
          setOfferLoading(false)
        }
      })
      .catch((err) => {
        console.warn('[PremiumPage] Failed to load offer:', err.message)
        if (isMounted) setOfferLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function toggleFaq(index) {
    setOpenFaqIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  async function handleGetPremium() {
    if (!isAuthenticated) {
      navigate('/login?redirect=/premium')
      return
    }

    setCheckoutStep('initiating')
    setCheckoutError(null)

    try {
      // 1. Request subscription session from server
      const { data } = await api.post('/api/premium/subscribe')

      // 2. Lazily load Razorpay checkout script
      const scriptLoaded = await loadRazorpayCheckoutScript()
      if (!scriptLoaded || !window.Razorpay) {
        setCheckoutStep('failed')
        setCheckoutError('Unable to load payment checkout. Please check your network or ad blocker and try again.')
        return
      }

      // 3. Launch Razorpay modal
      const options = {
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: 'AlgoArena',
        description: 'AlgoArena Premium Subscription',
        prefill: {
          name: user?.username || '',
          email: user?.email || ''
        },
        theme: {
          color: '#080d1a'
        },
        notes: {
          user_id: user?.id || ''
        },
        handler: async function (response) {
          // Authorization received from checkout
          setCheckoutStep('activating')

          // Forward signature to backend for UX verification
          try {
            await api.post('/api/premium/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature
            })
          } catch (verifyErr) {
            console.warn('[Checkout Verify UX Note]', verifyErr.message)
          }

          refreshStatus()
          navigate('/lobby', {
            state: { premiumToast: 'Premium subscription active. Curriculum and duel matchmaking are ready.' }
          })
        },
        modal: {
          ondismiss: function () {
            setCheckoutStep('idle')
          }
        }
      }

      const rzpInstance = new window.Razorpay(options)
      rzpInstance.on('payment.failed', function (resp) {
        setCheckoutStep('failed')
        setCheckoutError(resp?.error?.description || 'Payment authorization failed. Please try again.')
      })
      rzpInstance.open()

    } catch (err) {
      setCheckoutStep('failed')
      setCheckoutError(err?.message || 'Unable to start checkout. Please try again.')
    }
  }

  const isSoldOut = offer?.isSoldOut || (offer?.remaining === 0)
  const spotsLeft = offer?.remaining ?? null
  const displayLaunchPrice = offer?.launchPrice ?? PREMIUM_CONFIG.launchPriceDisplay
  const displayStandardPrice = offer?.standardPrice ?? PREMIUM_CONFIG.standardPriceDisplay

  return (
    <div className="premium-page-wrapper">
      <main className="premium-page-container">

        {/* 1. Header */}
        <header className="premium-header">
          <h1 className="premium-title">Premium</h1>
          <p className="premium-subtitle">
            A2Z Sheet curriculum access and question-by-question duel matchmaking.
          </p>
        </header>

        {/* 2. Ruled Pricing Block */}
        <section className="premium-pricing-card" aria-label="Pricing and Subscription">
          {checkoutStep === 'activating' && (
            <div className="premium-alert-box alert-activating" role="status" aria-live="polite">
              Payment received. Activating Premium...
            </div>
          )}

          {checkoutStep === 'success' && (
            <div className="premium-alert-box alert-success" role="status" aria-live="polite">
              <div className="font-semibold mb-1">Your Premium subscription is active.</div>
              <div>Your account has full access to the A2Z Sheet curriculum and sheet duels.</div>
              <div className="mt-3">
                <Link to="/lobby" className="underline font-medium">Return to Lobby</Link>
              </div>
            </div>
          )}

          {checkoutStep === 'delayed' && (
            <div className="premium-alert-box alert-activating" role="status" aria-live="polite">
              <div className="font-semibold mb-1">Payment authorization received.</div>
              <div>Activation is taking slightly longer than expected. Your subscription will update automatically within a few minutes.</div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => refreshStatus()}
                  className="px-3 py-1 text-xs border border-slate-600 rounded"
                >
                  Refresh status
                </button>
              </div>
            </div>
          )}

          {checkoutStep === 'failed' && (
            <div className="premium-alert-box alert-error" role="alert">
              <div className="font-semibold mb-1">Payment incomplete</div>
              <div className="mb-2">{checkoutError}</div>
              <button
                type="button"
                onClick={handleGetPremium}
                className="px-3 py-1 text-xs bg-red-900 border border-red-700 rounded text-white"
              >
                Retry checkout
              </button>
            </div>
          )}

          {/* Pricing Info */}
          {!isSoldOut ? (
            <>
              <div className="premium-pricing-overline">Launch price</div>
              <div className="premium-price-row">
                <span className="premium-price-standard">₹{displayStandardPrice}</span>
                <span className="premium-price-current">₹{displayLaunchPrice}</span>
                <span className="premium-price-unit">per month</span>
              </div>
              <p className="premium-pricing-copy">
                Launch price for the first 100 subscribers. Your price stays ₹{displayLaunchPrice} while your subscription is active.
              </p>

              {offerLoading ? (
                <div className="premium-spots-skeleton" />
              ) : (
                <div className="premium-spots-badge">
                  {spotsLeft !== null && spotsLeft > 0
                    ? `${spotsLeft} of 100 launch spots remaining`
                    : 'All 100 launch spots claimed. Standard price applies.'}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="premium-pricing-overline">Standard price</div>
              <div className="premium-price-row">
                <span className="premium-price-current">₹{displayStandardPrice}</span>
                <span className="premium-price-unit">per month</span>
              </div>
              <p className="premium-pricing-copy">
                All 100 launch spots claimed. Standard price applies.
              </p>
            </>
          )}

          {/* Primary CTA */}
          {isPremium ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: 'var(--gold, #ffd696)' }}>
                Active subscription
              </span>
              <Link
                to="/account/billing"
                className="px-4 py-2 text-xs rounded border border-slate-700 hover:border-slate-500 transition-colors"
                style={{ textDecoration: 'none', color: 'var(--ink, #ffffff)' }}
              >
                Manage subscription
              </Link>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={handleGetPremium}
                disabled={checkoutStep === 'initiating' || checkoutStep === 'activating'}
                className="premium-cta-btn"
              >
                {checkoutStep === 'initiating'
                  ? 'Preparing checkout...'
                  : checkoutStep === 'activating'
                  ? 'Activating...'
                  : 'Upgrade to Premium'}
              </button>
            </div>
          )}

          <div className="premium-sub-notice">
            Billed monthly via Razorpay. Cancel anytime from your billing page. {PREMIUM_CONFIG.taxesIncluded ? 'Price includes all applicable taxes.' : 'Price excludes applicable taxes.'}
          </div>
        </section>

        {/* 3. Feature Comparison Table */}
        <section aria-labelledby="feature-comparison-title" style={{ marginBottom: '56px' }}>
          <h2 id="feature-comparison-title" className="premium-section-title">
            Plan Comparison
          </h2>

          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Feature</th>
                  <th style={{ width: '25%' }}>Free</th>
                  <th style={{ width: '25%' }}>
                    <span className="premium-th-header-mark">
                      <IconHexagonBadge size={14} />
                      <span>Premium</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PREMIUM_CONFIG.features.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="premium-feature-name">{item.name}</div>
                      <div className="premium-feature-desc">{item.description}</div>
                    </td>
                    <td>
                      <span className={`premium-cell-mark ${item.free === 'Included' ? 'cell-mark-included' : 'cell-mark-not'}`}>
                        {item.free === 'Included' ? '✓' : '-'}
                      </span>
                    </td>
                    <td>
                      {item.premium === 'Coming soon' ? (
                        <span className="cell-mark-soon">Coming soon</span>
                      ) : (
                        <span className={`premium-cell-mark ${item.premium === 'Included' ? 'cell-mark-included cell-mark-premium' : 'cell-mark-not'}`}>
                          {item.premium === 'Included' ? '✓' : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. FAQ Accordion */}
        <section aria-labelledby="faq-title">
          <h2 id="faq-title" className="premium-section-title">
            Frequently Asked Questions
          </h2>

          <div className="premium-faq-list" role="region">
            {PREMIUM_CONFIG.faq.map((item, idx) => {
              const isOpen = openFaqIndices.has(idx)
              const buttonId = `faq-btn-${idx}`
              const panelId = `faq-panel-${idx}`

              return (
                <div key={idx} className="premium-faq-item">
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleFaq(idx)}
                    className="premium-faq-button"
                  >
                    <span>{item.q}</span>
                    <span style={{ color: 'var(--sub, #a2a9b8)' }}>
                      {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="premium-faq-answer"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 5. Footer Strip */}
        <footer className="premium-footer-strip">
          <div className="premium-footer-links">
            <Link to="/terms">Terms of Service</Link>
            <span className="premium-footer-sep">·</span>
            <Link to="/privacy">Privacy Policy</Link>
            <span className="premium-footer-sep">·</span>
            <Link to="/refund-policy">Refund Policy</Link>
            <span className="premium-footer-sep">·</span>
            <a href="mailto:support@algoarena.io">support@algoarena.io</a>
          </div>
        </footer>

      </main>
    </div>
  )
}
