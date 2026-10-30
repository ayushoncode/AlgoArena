import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArenaEmblem } from '../components/ArenaLogo'

export default function RefundPolicy() {
  useEffect(() => {
    document.title = 'Refund and Cancellation Policy | AlgoArena'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen w-full bg-[#02060f] text-slate-200 px-6 py-20 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="space-y-4 border-b border-slate-800 pb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity">
            <ArenaEmblem className="w-6 h-6" />
            <span className="font-bold text-sm tracking-wider">ALGOARENA</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Refund and Cancellation Policy</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Effective Date: Season 1 (2026)
          </p>
        </header>

        {/* Section 1: Entity & Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Merchant and Business Details</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            This Refund and Cancellation Policy governs paid subscription services provided through the AlgoArena platform operated by [TODO: owner to fill legal entity name and registered corporate address].
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            For all billing inquiries, cancellation requests, or disputed charges, contact our support team at <a href="mailto:support@algoarena.io" className="text-[#ffd696] underline">support@algoarena.io</a> [TODO: owner to verify customer support phone number and grievance officer contact].
          </p>
        </section>

        {/* Section 2: Subscription Plans & Pricing */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Subscription Plans and Payment Terms</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena offers a recurring monthly Premium subscription processed securely via Razorpay. All transactions are charged in Indian Rupees (INR):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
            <li>
              <strong>Standard Plan:</strong> 50 per month, billed recurringly every month on your subscription billing date.
            </li>
            <li>
              <strong>Launch Offer (First 100 Subscribers):</strong> 39 per month for the first 100 paying subscribers. The launch rate remains locked for as long as your subscription stays active and unbroken. If your subscription is cancelled or lapses due to payment failure beyond the grace period, standard pricing applies upon re-subscribing.
            </li>
            <li>
              <strong>Taxes:</strong> Subscription amounts exclude applicable taxes unless explicitly noted at checkout [TODO: owner to confirm GST registration status and tax breakdown on invoices].
            </li>
          </ul>
        </section>

        {/* Section 3: Digital Fulfillment */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Digital Service Fulfillment</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena Premium is an instant digital access service. Upon authorization and payment confirmation by Razorpay, Premium features (including A2Z Sheet curriculum access and question-by-question duel matchmaking) are provisioned immediately to your account.
          </p>
        </section>

        {/* Section 4: Cancellation Policy */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Cancellation Policy</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            You may cancel your monthly subscription at any time directly through your account dashboard at <Link to="/account/billing" className="text-[#ffd696] underline">/account/billing</Link>:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li>Cancellations take effect at the conclusion of your current paid billing period.</li>
            <li>You will retain full access to Premium curriculum and matchmaking features until your active billing period ends.</li>
            <li>Upon period end, your account will transition to the free tier. No further charges will be levied.</li>
            <li>All your Elo ratings, match history, Intel Reports, and account profile details remain permanently preserved.</li>
          </ul>
        </section>

        {/* Section 5: Refund Policy */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Refund Policy</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Because digital access is granted immediately upon payment activation, subscription fees are generally non-refundable once the billing period has commenced. Partial-period refunds or pro-rated refunds are not issued for unused days during an active monthly cycle.
          </p>
          <p className="text-sm leading-relaxed text-slate-300 font-semibold text-white">
            Exceptions for Refund Review:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
            <li>
              <strong>Duplicate Billing:</strong> If your payment method is erroneously charged multiple times for the same monthly billing period, the duplicate charge will be refunded upon verification.
            </li>
            <li>
              <strong>Service Non-Availability:</strong> If verifiable platform failure prevents access to Premium features for an extended duration exceeding [TODO: owner to confirm threshold, default 72 consecutive hours], a pro-rated credit or refund may be granted upon review.
            </li>
            <li>
              <strong>Unauthorized Transactions:</strong> Validated fraudulent or unauthorized card charges reported within [TODO: owner to fill notification window, default 7 days] of the transaction date will be refunded in accordance with banking guidelines.
            </li>
          </ul>
        </section>

        {/* Section 6: How to Request a Refund */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. How to Request a Refund</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            To submit a refund request, send an email to <a href="mailto:support@algoarena.io" className="text-[#ffd696] underline">support@algoarena.io</a> with the following details:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li>Your AlgoArena username and registered account email address.</li>
            <li>The Razorpay payment ID (e.g., pay_...) from your billing receipt.</li>
            <li>A concise description of the issue or basis for the refund request.</li>
          </ul>
          <p className="text-sm leading-relaxed text-slate-300">
            Approved refunds are credited back to the original payment method through Razorpay within 5 to 7 business days, depending on your card issuer or banking partner.
          </p>
        </section>

        {/* Section 7: Competitive Fairness Notice */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Fairness and Non-Discrimination Notice</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Premium subscription status, subscription cancellations, or refund inquiries do not impact competitive matchmaking priority, Elo calculations, or judge evaluation. All duels are judged under identical criteria for all coders.
          </p>
        </section>

        {/* Footer nav */}
        <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <Link to="/" className="text-[#ffd696] hover:underline">&larr; Return to Home</Link>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>&middot;</span>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </div>
  )
}

