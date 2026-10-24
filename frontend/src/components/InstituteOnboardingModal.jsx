import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import ArenaEmblem from './ArenaLogo'
import { CheckCircle2, XCircle, Loader2, Sparkles, Lock, Building } from 'lucide-react'
import { institutes } from '../utils/institutes'

export default function InstituteOnboardingModal() {
  const { user, refreshUser } = useAuth()
  const [institute, setInstitute] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Show only when user exists, username is set, and institute is not locked
  const shouldShow = Boolean(user && user.is_username_set !== false && !user.institute_locked)

  useEffect(() => {
    if (institute.trim().length > 0) {
      const filtered = institutes.filter(inst => 
        inst.toLowerCase().includes(institute.toLowerCase())
      ).slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [institute])

  if (!shouldShow) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const clean = institute.trim()

    if (!clean) {
      setSubmitErr('Institute name is required')
      return
    }

    setSubmitting(true)
    setSubmitErr('')

    try {
      const { data } = await api.patch('/api/users/me/institute', { institute: clean })
      if (data.user) {
        localStorage.setItem('aa_user', JSON.stringify(data.user))
        await refreshUser(data.user)
      } else {
        await refreshUser()
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to lock institute'
      setSubmitErr(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = institute.trim().length > 2

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] flex items-center justify-center p-4 select-none">
      <div 
        className="max-w-md w-full p-6 sm:p-8 rounded-2xl space-y-6 relative overflow-visible shadow-2xl border fade-in"
        style={{ 
          background: 'var(--c-panel)', 
          borderColor: 'rgba(56,189,248,0.25)',
          boxShadow: '0 0 50px rgba(56,189,248,0.15)'
        }}
      >
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <ArenaEmblem size={52} glow />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 uppercase">
            <Sparkles size={12} /> Represent Your Institute
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-[color:var(--c-text)] tracking-wide uppercase">
            Select Your College
          </h2>
          <p className="text-xs text-[color:var(--c-text-mute)] max-w-sm mx-auto leading-relaxed">
            Enter your college or university to appear on the institution leaderboards. 
          </p>
        </div>

        {submitErr && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2.5">
            <XCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{submitErr}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 relative">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[color:var(--c-text-mute)] font-bold">
              Institute Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Building size={16} />
              </span>
              <input
                type="text"
                autoFocus
                maxLength={255}
                placeholder="e.g. Indian Institute of Technology..."
                value={institute}
                onChange={e => setInstitute(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-[color:var(--c-void)] border border-slate-700 rounded-lg py-3 pl-10 pr-4 font-mono text-sm text-[color:var(--c-text)] placeholder-slate-600 outline-none transition-all focus:border-[#38BDF8] focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0F1C] border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 text-sm font-mono text-[color:var(--c-text-dim)] hover:bg-[color:var(--c-panel2)] hover:text-[color:var(--c-text)] cursor-pointer border-b border-slate-800 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setInstitute(sug)
                        setShowSuggestions(false)
                      }}
                    >
                      {sug}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-4 pt-1">
              <span className="font-mono text-[10px] text-slate-500">
                Start typing to see suggestions or enter your own
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[color:var(--c-panel)]/60 border border-slate-800 text-[11px] text-[color:var(--c-text-mute)] font-mono flex items-center gap-2">
            <Lock size={13} className="text-amber-400 shrink-0" />
            <span>Note: Once saved, your institute is permanently locked.</span>
          </div>

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="btn-primary w-full py-3.5 text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                Lock Institute & Continue →
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
