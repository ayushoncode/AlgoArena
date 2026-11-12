import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArenaEmblem } from '../components/ArenaLogo'

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service | AlgoArena'
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Terms of Service</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Effective Date: Season 1 (2026)
          </p>
        </header>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Platform Overview</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena provides a real-time, head-to-head competitive programming platform. By accessing or using AlgoArena, you agree to comply with these Terms of Service. If you do not agree, do not enter the arena or use the service.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Competitive Integrity and Conduct</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena is designed for fair, head-to-head algorithmic competition. The following behaviors are strictly prohibited and will result in immediate disqualification, rating resets, or permanent account termination:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li>Submitting automated bot keystrokes or script-driven solutions during ranked duels.</li>
            <li>Collusion, win-trading, or intentional disconnection to manipulate Elo ratings.</li>
            <li>Attempting to bypass runner sandbox boundaries, exploit judge infrastructure, or exceed CPU and memory quotas.</li>
            <li>Harassing opponents or abusing chat, usernames, or telemetry channels.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Code Execution and Sandboxing</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            All code submitted during duels executes in segregated runtime environments with strict memory (512MB), CPU, process (50 PIDs), and network restrictions. You acknowledge that malicious payloads, fork bombs, or attempts to access host systems are logged and reported.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Ratings and Match Settlement</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            All match outcomes and Elo rating deltas are settled upon judge verification of the first accepted solution. Rating calculations are governed by the platform K-factor model and are non-negotiable.
          </p>
        </section>

        {/* Section 5: Paid Subscriptions */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Paid Subscriptions and Billing</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena offers optional Premium subscriptions billed monthly in Indian Rupees (INR) through Razorpay. Standard pricing is 100 per month. The first 100 subscribers are eligible for a launch rate of 39 per month, which remains active for as long as that subscription continues unbroken. Prices exclude applicable taxes unless explicitly indicated [TODO: owner to confirm GST registration status].
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            Fairness Guarantee: Premium subscriptions do not alter Elo rating calculations, matchmaking priority, test runner quotas, problem difficulty, or judge execution limits.
          </p>
        </section>

        {/* Section 6: Live Voice Communication */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Live Voice Communication</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena provides optional real-time voice communication during live matches for eligible Premium subscribers. Voice is disabled by default and starts only upon mutual consent from both participants.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li>Zero Audio Recording: Audio is transmitted peer-to-peer over encrypted WebRTC. Voice is never recorded, stored, or transcribed by AlgoArena.</li>
            <li>Safety Tools: Players may mute opponents locally, block future voice requests from specific users, or submit conduct reports at any time. Either player may end voice immediately.</li>
            <li>Code of Conduct: Verbal abuse, harassment, discrimination, hate speech, threats, and disruption are strictly forbidden. Conduct violations result in voice access suspension or account termination.</li>
          </ul>
        </section>

        {/* Section 7: Cancellation and Refunds */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Cancellation and Refund Policy</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            You may cancel your monthly subscription at any time via <Link to="/account/billing" className="text-[#ffd696] underline">/account/billing</Link>. Cancellation takes effect at the end of the current billing cycle, and access remains active through that date. Subscription fees are subject to our <Link to="/refund-policy" className="text-[#ffd696] underline">Refund Policy</Link>. Disputed charges or chargebacks will suspend account access pending resolution.
          </p>
        </section>

        {/* Section 8: Eligibility */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Eligibility and Capacity</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            You must be at least 18 years of age, or have the valid consent and supervision of a parent or legal guardian, to register an account and enter into payment obligations on AlgoArena.
          </p>
        </section>

        {/* Section 9: Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena is provided on an "as is" and "as available" basis without warranties of any kind. We are not liable for match disconnects resulting from local client network instability or third-party internet service disruptions.
          </p>
        </section>

        {/* Section 10: Discussion Rooms and Community Content */}
        <section id="discussion-rules" className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Discussion Rooms and Community Content</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena provides problem discussion rooms for educational analysis, peer hints, and algorithmic approaches. By participating, you agree to the following rules:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
            <li>Competitive Separation: Discussion rooms are strictly isolated from active matches. Users currently in a match on a problem cannot access its room until the match concludes.</li>
            <li>Content Standards: Posts must remain respectful and relevant. Hate speech, harassment, slurs, spam, malicious code, and sharing private personal data are strictly prohibited.</li>
            <li>Spoiler Etiquette: Posts containing solution code or detailed answers must be designated as Solutions or enclosed in code blocks. Code blocks exceeding 5 lines are categorized as Solutions automatically.</li>
            <li>Daily Challenge Secrecy: Solution posts on the current daily challenge are masked until the UTC midnight reset to preserve fair competition for all participants.</li>
            <li>Moderation and Safety: Users may report offending posts or block disruptive members. Posts that receive three or more reports are hidden pending moderator review. AlgoArena reserves the right to suspend discussion rights or remove content violating these rules [TODO: owner to confirm formal appeal process].</li>
          </ul>
        </section>

        {/* Footer nav */}
        <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <Link to="/" className="text-[#ffd696] hover:underline">&larr; Return to Home</Link>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>&middot;</span>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
