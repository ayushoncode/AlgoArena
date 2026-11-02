/**
 * frontend/src/pages/Premium/PremiumPage.jsx
 *
 * Public Premium subscription page for AlgoArena:
 * - Two side-by-side plan cards (Free and Premium)
 * - Three price states (offer open, sold out, subscribed) + loading and failed
 * - Plain ruled FAQ list with square-cap plus/minus signs
 * - Custom inline SVG icon set on 20px grid
 * - Sticky mobile bar when Premium button is off screen
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { PREMIUM_CONFIG } from '../../content/premium'
import { useAuth } from '../../hooks/useAuth'
import { usePremium } from '../../hooks/usePremium'
import api from '../../utils/api'
import AuthDialog from '../../components/AuthDialog'
import './Premium.css'

/**
 * Custom inline SVG icon set (20px grid, 1.5px stroke, square caps)
 * Duel (crossed lines), room (box with handle), bars, document, list,
 * two arrows, hexagon, chat bubble, voice waves.
 */
function PlanIcon({ name, className = '', style = {} }) {
  const commonProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    strokeLinecap: 'square',
    strokeLinejoin: 'miter',
    'aria-hidden': 'true',
    className,
    style: { flexShrink: 0, ...style }
  }

  switch (name) {
    case 'duel':
      // Crossed lines
      return (
        <svg {...commonProps}>
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
          <line x1="3" y1="6" x2="6" y2="3" />
          <line x1="14" y1="3" x2="17" y2="6" />
        </svg>
      )
    case 'room':
      // Box with a handle
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="14" height="11" />
          <path d="M7 6V4h6v2" />
        </svg>
      )
    case 'bars':
      // Leaderboard vertical bars
      return (
        <svg {...commonProps}>
          <line x1="5" y1="16" x2="5" y2="11" />
          <line x1="10" y1="16" x2="10" y2="5" />
          <line x1="15" y1="16" x2="15" y2="8" />
        </svg>
      )
    case 'document':
      // Document outline
      return (
        <svg {...commonProps}>
          <path d="M4 3h8l4 4v10H4z" />
          <path d="M12 3v4h4" />
          <line x1="7" y1="11" x2="13" y2="11" />
          <line x1="7" y1="14" x2="11" y2="14" />
        </svg>
      )
    case 'list':
      // Sheet with topic index
      return (
        <svg {...commonProps}>
          <line x1="3" y1="6" x2="5.5" y2="6" />
          <line x1="8.5" y1="6" x2="17" y2="6" />
          <line x1="3" y1="10" x2="5.5" y2="10" />
          <line x1="8.5" y1="10" x2="17" y2="10" />
          <line x1="3" y1="14" x2="5.5" y2="14" />
          <line x1="8.5" y1="14" x2="17" y2="14" />
        </svg>
      )
    case 'arrows':
      // Two opposing horizontal arrows
      return (
        <svg {...commonProps}>
          <line x1="4" y1="7" x2="16" y2="7" />
          <polyline points="12 4 16 7 12 10" />
          <line x1="16" y1="13" x2="4" y2="13" />
          <polyline points="8 10 4 13 8 16" />
        </svg>
      )
    case 'hexagon':
      // Regular hexagon profile badge
      return (
        <svg {...commonProps}>
          <polygon points="10 2 17 6 17 14 10 18 3 14 3 6" />
        </svg>
      )
    case 'chat':
      // Speech bubble
      return (
        <svg {...commonProps}>
          <path d="M3 4h14v10H7l-4 3V4z" />
        </svg>
      )
    case 'voice':
      // Audio waves
      return (
        <svg {...commonProps}>
          <line x1="4" y1="8" x2="4" y2="12" />
          <line x1="7" y1="6" x2="7" y2="14" />
          <line x1="10" y1="3" x2="10" y2="17" />
          <line x1="13" y1="6" x2="13" y2="14" />
          <line x1="16" y1="8" x2="16" y2="12" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Plain ruled plus / minus toggle for FAQ rows
 */
function PlusIcon({ isOpen, className = '', style = {} }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      <line x1="3" y1="8" x2="13" y2="8" />
      {!isOpen && <line x1="8" y1="3" x2="8" y2="13" />}
    </svg>
  )
}

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
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { isPremium, status: subStatus, refreshStatus } = usePremium()

  const [offer, setOffer] = useState(null)
  const [offerLoading, setOfferLoading] = useState(true)
  const [offerError, setOfferError] = useState(false)
  const [openFaqIndices, setOpenFaqIndices] = useState(new Set([0]))

  // Checkout states: 'idle' | 'initiating' | 'activating' | 'success' | 'failed' | 'delayed'
  const [checkoutStep, setCheckoutStep] = useState('idle')
  const [checkoutError, setCheckoutError] = useState(null)

  // Auth Dialog state
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState('otp')
  const [pendingCheckout, setPendingCheckout] = useState(false)

  // Sticky bottom bar visibility on phones
  const [showStickyBar, setShowStickyBar] = useState(false)
  const primaryBtnRef = useRef(null)

  // Read URL mockState for QA screenshots (e.g. ?mockState=logged_out | free_user | sold_out | subscribed | loading | offer_failed)
  const mockState = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('mockState')
  }, [location.search])

  useEffect(() => {
    document.title = 'Premium | AlgoArena'
    window.scrollTo(0, 0)

    if (mockState === 'loading') {
      setOfferLoading(true)
      return
    }

    if (mockState === 'offer_failed') {
      setOfferLoading(false)
      setOfferError(true)
      return
    }

    if (mockState === 'sold_out') {
      setOfferLoading(false)
      setOffer({
        isSoldOut: true,
        remaining: 0,
        launchPrice: PREMIUM_CONFIG.launchPriceDisplay,
        standardPrice: PREMIUM_CONFIG.standardPriceDisplay
      })
      return
    }

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
        if (isMounted) {
          setOfferError(true)
          setOfferLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [mockState])

  // Sticky price bar intersection observer
  useEffect(() => {
    if (!primaryBtnRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar only when primary button is scrolled off screen
        setShowStickyBar(!entry.isIntersecting)
      },
      { threshold: 0.1 }
    )
    observer.observe(primaryBtnRef.current)
    return () => observer.disconnect()
  }, [offerLoading, mockState])

  // Resume checkout flow once user authenticates
  useEffect(() => {
    if (isAuthenticated && pendingCheckout) {
      setPendingCheckout(false)
      setAuthDialogOpen(false)
      handleGetPremium()
    }
  }, [isAuthenticated, pendingCheckout])

  const toggleFaq = useCallback((index) => {
    setOpenFaqIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  function openAuth(mode = 'otp') {
    setAuthDialogMode(mode)
    setAuthDialogOpen(true)
  }

  async function handleGetPremium() {
    if (!isAuthenticated && mockState !== 'free_user') {
      setPendingCheckout(true)
      openAuth('otp')
      return
    }

    setCheckoutStep('initiating')
    setCheckoutError(null)

    try {
      const { data } = await api.post('/api/premium/subscribe')

      const scriptLoaded = await loadRazorpayCheckoutScript()
      if (!scriptLoaded || !window.Razorpay) {
        setCheckoutStep('failed')
        setCheckoutError('Unable to load payment checkout. Please check your network or ad blocker and try again.')
        return
      }

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
          setCheckoutStep('activating')

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

  // Determine effective user subscription status (supports QA query param mockState)
  const effIsAuthenticated = useMemo(() => {
    if (mockState === 'logged_out') return false
    if (mockState === 'free_user' || mockState === 'subscribed') return true
    return Boolean(isAuthenticated)
  }, [isAuthenticated, mockState])

  const effIsPremium = useMemo(() => {
    if (mockState === 'subscribed') return true
    if (mockState === 'free_user' || mockState === 'logged_out') return false
    return Boolean(isPremium)
  }, [isPremium, mockState])

  const isSoldOut = Boolean(offer?.isSoldOut || (offer?.remaining === 0) || mockState === 'sold_out')
  const spotsLeft = offer?.remaining ?? (mockState === 'sold_out' ? 0 : 95)
  const displayLaunchPrice = offer?.launchPrice ?? PREMIUM_CONFIG.launchPriceDisplay
  const displayStandardPrice = offer?.standardPrice ?? PREMIUM_CONFIG.standardPriceDisplay

  // Subscription renew/cancel date formatted
  const formattedPeriodDate = useMemo(() => {
    const rawDate = subStatus?.until || (mockState === 'subscribed' ? '2027-10-31T00:00:00.000Z' : null)
    if (!rawDate) return null
    try {
      const d = new Date(rawDate)
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return null
    }
  }, [subStatus?.until, mockState])

  const cancelAtPeriodEnd = Boolean(subStatus?.cancelAtPeriodEnd)

  // Feature filters from config
  const freeFeatures = useMemo(() => {
    return PREMIUM_CONFIG.features.filter((f) => f.tier === 'free' && f.status === 'live')
  }, [])

  const premiumIncludedFeatures = useMemo(() => {
    return PREMIUM_CONFIG.features.filter((f) => f.tier === 'premium' && f.status === 'live')
  }, [])

  const premiumComingSoonFeatures = useMemo(() => {
    return PREMIUM_CONFIG.features.filter((f) => f.tier === 'premium' && f.status === 'comingSoon')
  }, [])

  return (
    <div className="premium-page-wrapper">
      <main className="premium-page-container">

        {/* 1. Header Section */}
        <header className="premium-header-group">
          <div className="premium-overline">Premium</div>
          <h2 className="premium-heading-title">Choose your plan</h2>
        </header>

        {/* Checkout Alert notifications */}
        {checkoutStep === 'activating' && (
          <div className="premium-alert-banner alert-activating" role="status" aria-live="polite">
            Payment received. Activating Premium...
          </div>
        )}

        {checkoutStep === 'failed' && (
          <div className="premium-alert-banner alert-error" role="alert">
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

        {/* 2. Side-by-side Plan Cards */}
        <div className="premium-plans-grid">

          {/* ── FREE CARD ──────────────────────────────────────────────── */}
          <div className="premium-plan-card premium-card-free" aria-label="Free Plan">
            <div className="premium-card-name">Free</div>
            <h3 className="premium-card-title">{PREMIUM_CONFIG.freePlan.title}</h3>
            <p className="premium-card-tagline">{PREMIUM_CONFIG.freePlan.tagline}</p>

            {/* Free Card CTA Button */}
            {!effIsAuthenticated ? (
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="premium-btn-secondary"
              >
                Create account
              </button>
            ) : effIsPremium ? (
              <button
                type="button"
                disabled
                className="premium-btn-disabled"
              >
                Included in Premium
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="premium-btn-disabled"
              >
                Your current plan
              </button>
            )}

            {/* Free Card Price */}
            <div className="premium-card-price-block">
              <div className="premium-price-row">
                <span className="premium-price-large">₹{PREMIUM_CONFIG.freePlan.priceDisplay}</span>
                <span className="premium-price-unit">/ month</span>
              </div>
            </div>

            {/* Free Card Feature List */}
            <div className="premium-features-list">
              {freeFeatures.map((feat) => (
                <div key={feat.id} className="premium-feature-item">
                  <PlanIcon name={feat.icon} className="premium-icon-free" />
                  <span className="premium-feature-label">{feat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── PREMIUM CARD ───────────────────────────────────────────── */}
          <div className="premium-plan-card premium-card-premium" aria-label="Premium Plan">
            <div className="premium-card-header-line">
              <div className="premium-card-name">Premium</div>
              {!isSoldOut && !offerLoading && !offerError && !effIsPremium && (
                <span className="premium-launch-tag">Launch price</span>
              )}
            </div>

            <h3 className="premium-card-title">{PREMIUM_CONFIG.premiumPlan.title}</h3>
            <p className="premium-card-tagline">{PREMIUM_CONFIG.premiumPlan.tagline}</p>

            {/* Premium Card Primary CTA Button */}
            {effIsPremium ? (
              <button
                type="button"
                disabled
                className="premium-btn-disabled"
              >
                Your current plan
              </button>
            ) : (
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={handleGetPremium}
                disabled={checkoutStep === 'initiating' || checkoutStep === 'activating'}
                className="premium-btn-primary"
              >
                {checkoutStep === 'initiating'
                  ? 'Preparing checkout...'
                  : checkoutStep === 'activating'
                  ? 'Activating...'
                  : 'Get Premium'}
              </button>
            )}

            {/* Premium Card Price Block (Three States + Loading + Failed) */}
            <div className="premium-card-price-block">
              {offerLoading ? (
                <div className="premium-skeleton-wrap" aria-hidden="true">
                  <div className="premium-skeleton-price" />
                  <div className="premium-skeleton-copy" />
                  <div className="premium-skeleton-spots" />
                </div>
              ) : effIsPremium ? (
                /* State 3: Subscribed */
                <div className="premium-subscribed-block">
                  <div className="premium-price-row">
                    <span className="premium-price-large">₹{displayLaunchPrice}</span>
                    <span className="premium-price-unit">/ month</span>
                  </div>
                  {formattedPeriodDate && (
                    <div className="premium-renew-line">
                      {cancelAtPeriodEnd ? `Cancels on ${formattedPeriodDate}` : `Renews on ${formattedPeriodDate}`}
                    </div>
                  )}
                  <Link to="/account/billing" className="premium-manage-sub-link">
                    Manage subscription
                  </Link>
                </div>
              ) : offerError ? (
                /* State: Offer Request Failed */
                <div className="premium-failed-block">
                  <div className="premium-price-row">
                    <span className="premium-price-large">₹{displayStandardPrice}</span>
                    <span className="premium-price-unit">/ month</span>
                  </div>
                  <div className="premium-pricing-muted-note">
                    Launch offer status unavailable
                  </div>
                </div>
              ) : isSoldOut ? (
                /* State 2: Sold Out */
                <div className="premium-soldout-block">
                  <div className="premium-price-row">
                    <span className="premium-price-large">₹{displayStandardPrice}</span>
                    <span className="premium-price-unit">/ month</span>
                  </div>
                  <div className="premium-pricing-muted-note">
                    Standard monthly pricing
                  </div>
                </div>
              ) : (
                /* State 1: Offer Open */
                <div className="premium-offer-block">
                  <div className="premium-price-row">
                    <span className="premium-price-struck">₹{displayStandardPrice}</span>
                    <span className="premium-price-large">₹{displayLaunchPrice}</span>
                    <span className="premium-price-unit">/ month</span>
                  </div>
                  <p className="premium-pricing-tagline">
                    First 100 subscribers. Your price stays ₹{displayLaunchPrice} while your subscription is active.
                  </p>
                  {typeof spotsLeft === 'number' && spotsLeft > 0 && (
                    <div className="premium-spots-left-line">
                      {spotsLeft} of 100 launch spots left
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Premium Card Feature List */}
            <div className="premium-features-list">
              {premiumIncludedFeatures.map((feat) => (
                <div key={feat.id} className="premium-feature-item">
                  <PlanIcon name={feat.icon} className="premium-icon-premium" />
                  <span className="premium-feature-label">{feat.name}</span>
                </div>
              ))}

              {/* Coming later features */}
              {premiumComingSoonFeatures.length > 0 && (
                <div className="premium-coming-soon-group">
                  <div className="premium-coming-soon-hairline" />
                  <div className="premium-coming-soon-heading">Coming later, not included yet</div>
                  {premiumComingSoonFeatures.map((feat) => (
                    <div key={feat.id} className="premium-feature-item premium-feature-soon">
                      <PlanIcon name={feat.icon} className="premium-icon-soon" />
                      <span className="premium-feature-label text-muted">{feat.name}</span>
                      <span className="premium-soon-tag">Soon</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 3. Centred Disclaimer */}
        <div className="premium-bottom-disclaimer">
          Billed monthly through Razorpay. Cancel anytime from your billing page.{PREMIUM_CONFIG.pricesIncludeTax ? ' Price includes all applicable taxes.' : ''}
        </div>

        {/* 4. FAQ Plain Ruled List */}
        <section className="premium-faq-section" aria-labelledby="faq-title">
          <h2 id="faq-title" className="premium-faq-heading">
            Frequently Asked Questions
          </h2>

          <div className="premium-faq-ruled-list" role="region">
            {PREMIUM_CONFIG.faq.map((item, idx) => {
              const isOpen = openFaqIndices.has(idx)
              const buttonId = `faq-btn-${idx}`
              const panelId = `faq-panel-${idx}`

              return (
                <div key={idx} className="premium-faq-ruled-row">
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleFaq(idx)}
                    className="premium-faq-trigger"
                  >
                    <span className="premium-faq-question-text">{item.q}</span>
                    <PlusIcon isOpen={isOpen} className="premium-faq-toggle-icon" />
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="premium-faq-answer-body"
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

      {/* Sticky Bottom Price Bar on Mobile (when Premium button is off screen) */}
      <div
        className={`premium-mobile-sticky-bar ${showStickyBar ? 'is-visible' : ''}`}
        aria-hidden={!showStickyBar}
      >
        <div className="premium-mobile-sticky-info">
          <span className="premium-mobile-sticky-price">
            ₹{isSoldOut || offerError ? displayStandardPrice : displayLaunchPrice}
          </span>
          <span className="premium-mobile-sticky-unit">/ month</span>
        </div>
        <button
          type="button"
          onClick={handleGetPremium}
          disabled={effIsPremium}
          className="premium-mobile-sticky-btn"
        >
          {effIsPremium ? 'Your current plan' : 'Get Premium'}
        </button>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => {
          setAuthDialogOpen(false)
          setPendingCheckout(false)
        }}
        initialMode={authDialogMode}
      />
    </div>
  )
}
