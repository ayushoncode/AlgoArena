import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArenaEmblem } from '../components/ArenaLogo'

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy | AlgoArena'
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Effective Date: Season 1 (2026)
          </p>
        </header>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Data We Collect</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            To provide live competitive matchmaking and rating calibration, AlgoArena collects:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li><strong>Account Data:</strong> Username, email address, chosen avatar seed, and optional institute name.</li>
            <li><strong>Competition Data:</strong> Duel timestamps, Elo ratings, win/loss records, code submissions, test execution telemetry, and solve runtimes.</li>
            <li><strong>Technical Data:</strong> IP address, browser user-agent, and connection latency used for WebSocket connection routing and anti-cheat verification.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. How We Use Your Data</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Your information is used exclusively to operate the competitive coding service:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li>Matching you with rivals of comparable Elo rating.</li>
            <li>Maintaining verified leaderboard standings and tier assignments.</li>
            <li>Executing and evaluating submitted code within isolated sandboxes.</li>
            <li>Preventing abuse, collusion, and automated bot accounts.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Public Competitor Profiles</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Your username, Elo rating, rank division badge, match record, and public leaderboard standings are visible to other arena coders. We do not expose your email address or private authentication tokens.
          </p>
        </section>

        {/* Section 4: Payment Data */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Payment Processing and Financial Data</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Payment transactions for AlgoArena Premium are processed through Razorpay. AlgoArena never collects, processes, or stores your credit card numbers, debit card numbers, UPI PINs, CVVs, or online banking passwords on our servers.
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            We store only tokenized identifiers (such as Razorpay subscription IDs and payment IDs), payment timestamps, currency, amount paid, and status codes necessary to verify entitlements and maintain tax and accounting records.
          </p>
        </section>

        {/* Section 5: Voice Communication Privacy */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Real-Time Voice Communication Privacy</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            For users who opt in to 1v1 Live Voice, media streams are transmitted in real time using encrypted WebRTC.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li>Zero Audio Recording: AlgoArena does not record, intercept, store, transcribe, or analyze voice audio under any circumstances.</li>
            <li>Pseudonymous Session Tokens: Voice rooms are assigned a cryptographic HMAC hash of the match identifier. No player names, emails, or personal identifiers are published to media routing servers.</li>
            <li>Abuse Reports: When a user reports inappropriate conduct, only the report category, optional user notes, participant identifiers, and match timestamp are recorded. No audio data is captured or reviewed.</li>
          </ul>
        </section>

        {/* Section 6: Data Retention */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Data Retention and Security</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Match results and rating history are retained to preserve historical leaderboard integrity. All communications occur over encrypted TLS connections, and user execution runs within disposable, unprivileged Linux sandboxes.
          </p>
        </section>

        {/* Footer nav */}
        <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <Link to="/" className="text-[#ffd696] hover:underline">&larr; Return to Home</Link>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>&middot;</span>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
