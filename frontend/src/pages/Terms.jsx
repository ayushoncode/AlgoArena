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

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            AlgoArena is provided on an "as is" and "as available" basis without warranties of any kind. We are not liable for match disconnects resulting from local client network instability or third-party internet service disruptions.
          </p>
        </section>

        {/* Footer nav */}
        <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <Link to="/" className="text-[#ffd696] hover:underline">&larr; Return to Home</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy &rarr;</Link>
        </div>

      </div>
    </div>
  )
}
