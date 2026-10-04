import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import ArenaEmblem from './ArenaLogo'
import { CheckCircle2, XCircle, Loader2, Sparkles, Lock } from 'lucide-react'

export default function UsernameOnboardingModal() {
  const { user, refreshUser } = useAuth()
  const [handle, setHandle] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState(null) // null | true | false
  const [availMsg, setAvailMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')

  // Show only when user exists AND is_username_set is explicitly false
  const shouldShow = Boolean(user && user.is_username_set === false)

  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (user?.username && shouldShow && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      const cleanFallback = String(user.username).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
      setHandle(cleanFallback)
    }
  }, [user, shouldShow])

  // Debounced live availability check
  useEffect(() => {
    if (!shouldShow) return
    const clean = handle.trim().toLowerCase()
    
    if (clean.length < 3) {
      setAvailable(false)
      setAvailMsg('Must be at least 3 characters')
      setChecking(false)
      return
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(clean)) {
      setAvailable(false)
      setAvailMsg('3–30 chars (letters, numbers, underscore only)')
      setChecking(false)
      return
    }

    setChecking(true)
    setAvailable(null)
    setSubmitErr('')

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/users/check-username?username=${encodeURIComponent(clean)}`)
        setAvailable(data.available)
        setAvailMsg(data.available ? `Handle @${clean} is available!` : `Handle @${clean} is already taken!`)
      } catch {
        setAvailable(null)
        setAvailMsg('')
      } finally {
        setChecking(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [handle, shouldShow])

  if (!shouldShow) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const clean = handle.trim().toLowerCase()

    if (!clean || clean.length < 3 || !/^[a-zA-Z0-9_]{3,30}$/.test(clean)) {
      setSubmitErr('Handle must be 3–30 characters (letters, numbers, underscore)')
      return
    }

    setSubmitting(true)
    setSubmitErr('')

    try {
      const { data } = await api.patch('/api/users/me/username', { username: clean })
      if (data.token && data.user) {
        localStorage.setItem('aa_token', data.token)
        localStorage.setItem('aa_user', JSON.stringify(data.user))
        await refreshUser(data.user)
      } else {
        await refreshUser()
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to lock handle'
      setSubmitErr(msg)
      if (err.response?.status === 409) {
        setAvailable(false)
        setAvailMsg(`Handle @${clean} already exists! Pick a different one.`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = /^[a-zA-Z0-9_]{3,30}$/.test(handle.trim()) && available === true

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 select-none">
      <div 
        className="max-w-md w-full p-6 sm:p-8 rounded-2xl space-y-6 relative overflow-hidden shadow-2xl border fade-in"
        style={{ 
          background: 'linear-gradient(135deg, rgba(13,19,36,0.98) 0%, rgba(8,12,28,0.99) 100%)', 
          borderColor: 'rgba(56,189,248,0.25)',
          boxShadow: '0 0 50px rgba(56,189,248,0.15)'
        }}
      >
        {/* Glow Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <ArenaEmblem size={52} glow />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 uppercase">
            <Sparkles size={12} /> New Warrior Onboarding
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-[color:var(--c-text)] tracking-wide uppercase">
            Choose Your Cool Handle
          </h2>
          <p className="text-xs text-[color:var(--c-text-mute)] max-w-sm mx-auto leading-relaxed">
            Welcome to <span className="text-[color:var(--c-text)] font-semibold">AlgoArena</span>! Pick a unique username for leaderboards and live 1v1 battles.
          </p>
        </div>

        {/* Backend Error Banner */}
        {submitErr && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2.5">
            <XCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{submitErr}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[color:var(--c-text-mute)] font-bold">
              Arena Username / Coolname
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-extrabold text-[#38BDF8]">
                @
              </span>
              <input
                type="text"
                autoFocus
                maxLength={30}
                placeholder="ninja_coder"
                value={handle}
                onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="w-full bg-[color:var(--c-void)] border rounded-lg py-3 pl-8 pr-10 font-mono text-sm text-[color:var(--c-text)] placeholder-slate-600 outline-none transition-all"
                style={{
                  borderColor: available === true
                    ? '#22C55E'
                    : available === false
                    ? '#EF4444'
                    : 'rgba(56,189,248,0.3)',
                  boxShadow: available === true
                    ? '0 0 15px rgba(34,197,94,0.15)'
                    : available === false
                    ? '0 0 15px rgba(239,68,68,0.15)'
                    : 'none'
                }}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {checking ? (
                  <Loader2 size={16} className="animate-spin text-sky-400" />
                ) : available === true ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : available === false ? (
                  <XCircle size={16} className="text-rose-400" />
                ) : null}
              </div>
            </div>

            {/* Live Availability Message */}
            <div className="h-5 flex items-center pt-0.5">
              {checking ? (
                <span className="font-mono text-[11px] text-sky-400 flex items-center gap-1">
                  Checking database...
                </span>
              ) : availMsg ? (
                <span 
                  className={`font-mono text-[11px] flex items-center gap-1 font-semibold ${
                    available ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {availMsg}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-slate-500">
                  3–30 characters (letters, numbers, underscores)
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[color:var(--c-panel)]/60 border border-slate-800 text-[11px] text-[color:var(--c-text-mute)] font-mono flex items-center gap-2">
            <Lock size={13} className="text-amber-400 shrink-0" />
            <span>Note: Once saved, this handle is permanently locked to your account.</span>
          </div>

          <button
            type="submit"
            disabled={!isValid || submitting || checking}
            className="btn-primary w-full py-3.5 text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Handle...
              </>
            ) : (
              <>
                Lock Handle & Enter Arena →
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
