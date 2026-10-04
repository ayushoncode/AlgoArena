import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Check, AlertTriangle,
  Lock, CheckCircle2, ChevronDown, ChevronUp, X
} from "lucide-react"

import api from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { PageWrapper, HudPanel, HudButton, GhostButton, ToastContainer } from "../components/ui/index.jsx"

/* ─── Constants ─────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "BASICS" },
  { id: 2, label: "ROUNDS" },
  { id: 3, label: "YOUR TAKE" },
  { id: 4, label: "SUBMIT" },
]

const ROUND_TYPES = [
  { value: "online_assessment", label: "Online Assessment", desc: "Coding platform test (HackerRank, etc.)" },
  { value: "dsa",               label: "DSA Round",          desc: "Data Structures & Algorithms interview" },
  { value: "technical",         label: "Technical Round",    desc: "Core CS, projects, system concepts" },
  { value: "system_design",     label: "System Design",      desc: "Architecture, scalability, HLD/LLD" },
  { value: "hr",                label: "HR Round",           desc: "Culture fit, salary, background" },
  { value: "managerial",        label: "Managerial Round",   desc: "Manager interview, behavioural" },
  { value: "other",             label: "Other",              desc: "Group discussion, case study, etc." },
]

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

function newRound() {
  return { type: "", title: "", description: "", durationMinutes: "", cleared: null, questions: [] }
}

/* ─── Small reusable field ──────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--c-text-mute)]">{label}</label>
      {children}
      {error && <p className="font-mono text-[10px] text-rose-400">{error}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-sans text-sm p-3 outline-none focus:border-rose-500 transition-colors rounded ${className}`}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-sans text-sm p-3 outline-none focus:border-rose-500 transition-colors rounded resize-none"
    />
  )
}

/* ─── Round Type Selector Card ──────────────────────────── */
function RoundTypeCard({ rt, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded border transition-all ${
        selected
          ? "bg-cyan-500/10 border-cyan-500 text-[color:var(--c-text)]"
          : "bg-[color:var(--c-panel)] border-slate-800 text-[color:var(--c-text-dim)] hover:border-slate-600 hover:text-[color:var(--c-text)]"
      }`}
    >
      <p className="font-mono text-xs font-bold uppercase">{rt.label}</p>
      <p className="font-sans text-[11px] text-[color:var(--c-text-mute)] mt-0.5">{rt.desc}</p>
    </button>
  )
}

/* ─── Main Component ────────────────────────────────────── */
export default function ShareExperienceWizard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = Boolean(id)

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [nda, setNda] = useState(false)
  const [errors, setErrors] = useState({})

  const [toasts, setToasts] = useState([])
  const addToast = (message, type = "info") =>
    setToasts(prev => [...prev, { id: Date.now(), message, type }])
  const dismissToast = id => setToasts(prev => prev.filter(t => t.id !== id))

  /* ── Form state ── */
  const [form, setForm] = useState({
    track: "intern",
    company: "",
    roleTitle: "",
    location: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    source: "on_campus",
    stipendRange: "",
    ctcRange: "",
    difficulty: "medium",
    outcome: "selected",
    isAnonymous: false,
    overallExperience: "",
    tips: "",
    prepResources: "",
    rounds: [],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  /* ── Draft autosave ── */
  useEffect(() => {
    if (isEditMode) return
    try { localStorage.setItem("aa_intel_draft_v2", JSON.stringify(form)) }
    catch {}
  }, [form, isEditMode])

  useEffect(() => {
    if (isEditMode) return
    try {
      const raw = localStorage.getItem("aa_intel_draft_v2")
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.company || parsed.overallExperience) {
        if (window.confirm("Unsaved draft found. Restore it?")) {
          setForm(parsed)
          addToast("Draft restored", "success")
        }
      }
    } catch {}
  }, [])

  /* ── Load for edit ── */
  useEffect(() => {
    if (!isEditMode) return
    api.get(`/api/experiences/${id}`).then(({ data }) => {
      setForm({
        track: data.track || "intern",
        company: data.company || "",
        roleTitle: data.role_title || "",
        location: data.location || "",
        year: data.year || new Date().getFullYear(),
        month: data.month || new Date().getMonth() + 1,
        source: data.source || "on_campus",
        stipendRange: data.stipend_range || "",
        ctcRange: data.ctc_range || "",
        difficulty: data.difficulty || "medium",
        outcome: data.outcome || "selected",
        isAnonymous: data.is_anonymous || false,
        overallExperience: data.overall_experience || "",
        tips: data.tips || "",
        prepResources: data.prep_resources || "",
        rounds: Array.isArray(data.rounds) ? data.rounds : [],
      })
    }).catch(() => addToast("Failed to load report", "error"))
  }, [id, isEditMode])

  /* ── Validation ── */
  const validate = (s) => {
    const e = {}
    if (s === 1) {
      if (!form.company.trim() || form.company.trim().length < 2) e.company = "Enter company name"
      if (!form.roleTitle.trim()) e.roleTitle = "Enter role title"
    }
    if (s === 2) {
      if (form.rounds.length === 0) e.rounds = "Add at least one round"
      form.rounds.forEach((r, i) => {
        if (!r.type) e[`round_${i}_type`] = "Select round type"
      })
    }
    if (s === 3) {
      if (!form.overallExperience.trim() || form.overallExperience.trim().length < 20)
        e.overallExperience = "Write at least 20 characters"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => validate(step) && setStep(s => Math.min(4, s + 1))
  const prev = () => setStep(s => Math.max(1, s - 1))

  /* ── Rounds management ── */
  const addRound = () => setForm(f => ({ ...f, rounds: [...f.rounds, newRound()] }))
  const removeRound = idx => setForm(f => ({ ...f, rounds: f.rounds.filter((_, i) => i !== idx) }))
  const updateRound = (idx, key, val) =>
    setForm(f => {
      const rounds = [...f.rounds]
      rounds[idx] = { ...rounds[idx], [key]: val }
      return { ...f, rounds }
    })

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!nda) { addToast("Acknowledge the NDA notice to submit", "error"); return }
    try {
      setSubmitting(true)
      if (isEditMode) {
        await api.put(`/api/experiences/${id}`, form)
        addToast("Report updated!", "success")
        navigate(`/experiences/${id}`)
      } else {
        const { data } = await api.post("/api/experiences", form)
        try { localStorage.removeItem("aa_intel_draft_v2") } catch {}
        addToast("Intel Report submitted!", "success")
        navigate(`/experiences/${data.experience?.id || ""}`)
      }
    } catch (err) {
      addToast(err?.response?.data?.message || "Submission failed", "error")
    } finally {
      setSubmitting(false)
    }
  }

  /* ─────────── Render ─────────── */
  return (
    <PageWrapper heroGlow className="pt-20 sm:pt-24 pb-24">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-2xl mx-auto px-5 sm:px-0 space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/experiences")}
            className="inline-flex items-center gap-2 font-mono text-xs text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)] transition-colors"
          >
            <ArrowLeft size={13} className="text-rose-500" /> EXIT
          </button>
          <span className="font-mono text-xs text-rose-400 font-bold uppercase tracking-widest">
            {isEditMode ? "// EDIT REPORT" : "// SHARE EXPERIENCE"}
          </span>
        </div>

        {/* Step rail */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = s.id < step
            const active = s.id === step
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => done && setStep(s.id)}
                  disabled={!done}
                  className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors rounded ${
                    active ? "text-[color:var(--c-text)] bg-rose-600" :
                    done  ? "text-emerald-400 hover:text-[color:var(--c-text)] cursor-pointer" :
                    "text-slate-600 cursor-default"
                  }`}
                >
                  {done ? <CheckCircle2 size={11} /> : <span className="opacity-60">0{s.id}</span>}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 transition-colors ${done ? "bg-emerald-500/40" : "bg-[color:var(--c-panel2)]"}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Panel */}
        <HudPanel className="p-6 sm:p-8 bg-slate-950/90 border-slate-800" glow glowColor="rgba(225,29,72,0.08)">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >

              {/* ─── STEP 1: BASICS ─── */}
              {step === 1 && (
                <>
                  <div>
                    <h2 className="font-display font-black text-2xl text-[color:var(--c-text)] uppercase">Company & Role</h2>
                    <p className="font-sans text-xs text-[color:var(--c-text-mute)] mt-1">Start with the basics — who hired you and for what.</p>
                  </div>

                  {/* Track */}
                  <div className="grid grid-cols-2 gap-3">
                    {["intern", "sde"].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set("track", t)}
                        className={`py-3.5 rounded font-mono text-xs font-bold uppercase tracking-wider border transition-all ${
                          form.track === t
                            ? t === "intern"
                              ? "bg-rose-500/20 border-rose-500 text-[color:var(--c-text)]"
                              : "bg-cyan-500/20 border-cyan-500 text-[color:var(--c-text)]"
                            : "bg-[color:var(--c-panel)] border-slate-800 text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]"
                        }`}
                      >
                        {t === "intern" ? "Internship" : "Full-Time SDE"}
                      </button>
                    ))}
                  </div>

                  {/* Company + Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Company *" error={errors.company}>
                      <TextInput
                        value={form.company}
                        onChange={e => set("company", e.target.value)}
                        placeholder="Google, Amazon, Flipkart..."
                      />
                    </Field>
                    <Field label="Role Title *" error={errors.roleTitle}>
                      <TextInput
                        value={form.roleTitle}
                        onChange={e => set("roleTitle", e.target.value)}
                        placeholder="SWE Intern, SDE-1..."
                      />
                    </Field>
                  </div>

                  {/* Year + Month + Location */}
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Year">
                      <TextInput
                        type="number"
                        value={form.year}
                        onChange={e => set("year", parseInt(e.target.value, 10))}
                      />
                    </Field>
                    <Field label="Month">
                      <select
                        value={form.month}
                        onChange={e => set("month", parseInt(e.target.value, 10))}
                        className="w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-sans text-sm p-3 outline-none rounded"
                      >
                        {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Location">
                      <TextInput
                        value={form.location}
                        onChange={e => set("location", e.target.value)}
                        placeholder="Bengaluru / Remote"
                      />
                    </Field>
                  </div>

                  {/* Source + Compensation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="How did you apply?">
                      <select
                        value={form.source}
                        onChange={e => set("source", e.target.value)}
                        className="w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-sans text-sm p-3 outline-none rounded"
                      >
                        <option value="on_campus">On Campus</option>
                        <option value="off_campus">Off Campus</option>
                        <option value="referral">Referral</option>
                      </select>
                    </Field>
                    <Field label={form.track === "intern" ? "Stipend (optional)" : "CTC / Package (optional)"}>
                      <TextInput
                        value={form.track === "intern" ? form.stipendRange : form.ctcRange}
                        onChange={e => set(form.track === "intern" ? "stipendRange" : "ctcRange", e.target.value)}
                        placeholder={form.track === "intern" ? "e.g. 50k/month" : "e.g. 18 LPA"}
                      />
                    </Field>
                  </div>

                  {/* Outcome + Difficulty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Final Outcome">
                      <select
                        value={form.outcome}
                        onChange={e => set("outcome", e.target.value)}
                        className="w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-sans text-sm p-3 outline-none rounded"
                      >
                        <option value="selected">Got the offer</option>
                        <option value="rejected">Rejected</option>
                        <option value="waiting">Still waiting</option>
                        <option value="withdrew">Withdrew</option>
                      </select>
                    </Field>
                    <Field label="Overall Difficulty">
                      <div className="grid grid-cols-3 gap-2">
                        {["easy","medium","hard"].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => set("difficulty", d)}
                            className={`py-3 rounded font-mono text-[11px] font-bold uppercase border transition-all ${
                              form.difficulty === d
                                ? d === "easy"   ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : d === "medium" ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                :                  "bg-rose-500/20 border-rose-500 text-rose-400"
                                : "bg-[color:var(--c-panel)] border-slate-800 text-slate-500 hover:text-[color:var(--c-text)]"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                </>
              )}

              {/* ─── STEP 2: ROUNDS ─── */}
              {step === 2 && (
                <>
                  <div>
                    <h2 className="font-display font-black text-2xl text-[color:var(--c-text)] uppercase">Interview Rounds</h2>
                    <p className="font-sans text-xs text-[color:var(--c-text-mute)] mt-1">
                      Add each round in order. Select the type, then describe what happened.
                    </p>
                  </div>

                  {errors.rounds && (
                    <p className="font-mono text-[11px] text-rose-400">{errors.rounds}</p>
                  )}

                  <div className="space-y-5">
                    {form.rounds.map((round, rIdx) => (
                      <RoundCard
                        key={rIdx}
                        round={round}
                        index={rIdx}
                        onUpdate={(key, val) => updateRound(rIdx, key, val)}
                        onRemove={() => removeRound(rIdx)}
                        error={errors[`round_${rIdx}_type`]}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addRound}
                    className="w-full py-3.5 border-2 border-dashed border-slate-700 text-[color:var(--c-text-mute)] hover:border-rose-500 hover:text-rose-400 transition-all rounded font-mono text-xs font-bold uppercase flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> ADD ROUND
                  </button>
                </>
              )}

              {/* ─── STEP 3: YOUR TAKE ─── */}
              {step === 3 && (
                <>
                  <div>
                    <h2 className="font-display font-black text-2xl text-[color:var(--c-text)] uppercase">Your Take</h2>
                    <p className="font-sans text-xs text-[color:var(--c-text-mute)] mt-1">Help the next person. Be honest.</p>
                  </div>

                  <Field label="Overall Experience * (min 20 chars)" error={errors.overallExperience}>
                    <Textarea
                      value={form.overallExperience}
                      onChange={e => set("overallExperience", e.target.value)}
                      placeholder="How did it go overall? What was the vibe, the difficulty, the process? Was the interviewer helpful or cold? Anything surprising?"
                      rows={6}
                    />
                    <div className="flex justify-end font-mono text-[10px] text-slate-500">
                      {form.overallExperience.length} / 3000
                    </div>
                  </Field>

                  <Field label="Tips for future candidates (optional)">
                    <Textarea
                      value={form.tips}
                      onChange={e => set("tips", e.target.value)}
                      placeholder="What should someone prep? Any specific topics, resources, or advice?"
                      rows={3}
                    />
                  </Field>

                  {/* Anonymous toggle */}
                  <div
                    className="flex items-center justify-between p-4 bg-[color:var(--c-panel)] border border-slate-800 rounded cursor-pointer"
                    onClick={() => set("isAnonymous", !form.isAnonymous)}
                  >
                    <div>
                      <p className="font-mono text-xs font-bold text-[color:var(--c-text)] flex items-center gap-1.5">
                        <Lock size={13} className="text-amber-400" /> Post anonymously
                      </p>
                      <p className="font-sans text-xs text-[color:var(--c-text-mute)] mt-0.5">
                        Your name will show as "Anonymous Challenger"
                      </p>
                    </div>
                    <div className={`w-11 h-6 rounded-full border-2 transition-all relative ${
                      form.isAnonymous ? "bg-amber-500 border-amber-500" : "bg-[color:var(--c-panel2)] border-slate-700"
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        form.isAnonymous ? "left-5" : "left-0.5"
                      }`} />
                    </div>
                  </div>
                </>
              )}

              {/* ─── STEP 4: SUBMIT ─── */}
              {step === 4 && (
                <>
                  <div>
                    <h2 className="font-display font-black text-2xl text-[color:var(--c-text)] uppercase">Review & Submit</h2>
                    <p className="font-sans text-xs text-[color:var(--c-text-mute)] mt-1">Quick preview before publishing.</p>
                  </div>

                  {/* Preview card */}
                  <div className="p-5 bg-[color:var(--c-panel)]/80 border border-slate-800 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-black text-xl text-[color:var(--c-text)]">{form.company || "Company"}</span>
                      <span className={`font-mono text-[10px] font-bold px-2 py-1 rounded ${
                        form.track === "intern" ? "bg-rose-500/20 text-rose-400" : "bg-cyan-500/20 text-cyan-400"
                      }`}>
                        {form.track === "intern" ? "INTERN" : "SDE"}
                      </span>
                    </div>
                    <p className="font-sans text-sm text-[color:var(--c-text-dim)]">{form.roleTitle} · {
                      { selected: "Offer received", rejected: "Rejected", waiting: "Waiting", withdrew: "Withdrew" }[form.outcome]
                    }</p>
                    <p className="font-sans text-xs text-[color:var(--c-text-mute)] line-clamp-2 italic">"{form.overallExperience}"</p>
                    <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
                      <span>{form.rounds.length} round{form.rounds.length !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{form.year}</span>
                      {form.location && <><span>·</span><span>{form.location}</span></>}
                    </div>
                  </div>

                  {/* NDA */}
                  <div className="p-4 bg-rose-500/8 border border-rose-500/25 rounded space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-mono text-[11px] font-bold text-rose-300 uppercase">NDA & Privacy</p>
                        <p className="font-sans text-xs text-[color:var(--c-text-dim)] mt-1 leading-relaxed">
                          Do not share NDA-protected content, real interviewer names, or proprietary code.
                          Describe question types and topics — not exact verbatim problems.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setNda(v => !v)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          nda ? "bg-rose-600 border-rose-600" : "bg-[color:var(--c-panel)] border-slate-600"
                        }`}
                      >
                        {nda && <Check size={11} className="text-[color:var(--c-text)]" strokeWidth={3} />}
                      </div>
                      <span className="font-sans text-xs text-slate-200">
                        I confirm this report follows NDA & privacy guidelines.
                      </span>
                    </label>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Nav Footer */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
            {step > 1 ? (
              <GhostButton onClick={prev} className="font-mono text-xs">
                <ArrowLeft size={13} className="mr-1" /> BACK
              </GhostButton>
            ) : <div />}

            {step < 4 ? (
              <HudButton onClick={next} className="px-7 py-2.5 font-mono text-xs font-bold">
                NEXT <ArrowRight size={13} className="ml-1" />
              </HudButton>
            ) : (
              <HudButton
                onClick={handleSubmit}
                disabled={submitting || !nda}
                className="px-7 py-2.5 bg-rose-600 hover:bg-rose-500 font-mono text-xs font-bold disabled:opacity-50"
              >
                {submitting ? "PUBLISHING..." : isEditMode ? "UPDATE REPORT" : "PUBLISH"}
              </HudButton>
            )}
          </div>
        </HudPanel>
      </div>
    </PageWrapper>
  )
}

/* ─── Round Card sub-component ──────────────────────────── */
function RoundCard({ round, index, onUpdate, onRemove, error }) {
  const [open, setOpen] = useState(true)

  const roundLabel = round.type
    ? ROUND_TYPES.find(r => r.value === round.type)?.label || round.type
    : `Round ${index + 1}`

  return (
    <div className={`border rounded overflow-hidden transition-colors ${
      round.type ? "border-slate-700" : "border-slate-800"
    }`}>
      {/* Round header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[color:var(--c-panel)]/70">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center ${
            round.type ? "bg-cyan-500/20 text-cyan-400" : "bg-[color:var(--c-panel2)] text-slate-500"
          }`}>
            {index + 1}
          </span>
          <span className="font-mono text-xs font-bold text-slate-200 uppercase">{roundLabel}</span>
          {round.cleared === true && <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">CLEARED</span>}
          {round.cleared === false && <span className="font-mono text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded">DROPPED</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(o => !o)} className="p-1.5 text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)] transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onRemove} className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Round body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-slate-950/60">

              {/* Round type grid */}
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--c-text-mute)] mb-2">Select Round Type *</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROUND_TYPES.map(rt => (
                    <RoundTypeCard
                      key={rt.value}
                      rt={rt}
                      selected={round.type === rt.value}
                      onClick={() => onUpdate("type", rt.value)}
                    />
                  ))}
                </div>
                {error && <p className="font-mono text-[10px] text-rose-400 mt-1">{error}</p>}
              </div>

              {/* Duration (optional inline) */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--c-text-mute)] mb-1.5">Duration (minutes, optional)</p>
                  <input
                    type="number"
                    value={round.durationMinutes || ""}
                    onChange={e => onUpdate("durationMinutes", parseInt(e.target.value, 10) || "")}
                    placeholder="e.g. 45"
                    className="w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-sans text-sm p-2.5 outline-none rounded"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--c-text-mute)] mb-1.5">What happened in this round?</p>
                <textarea
                  value={round.description}
                  onChange={e => onUpdate("description", e.target.value)}
                  placeholder="Describe the round — questions asked, format, difficulty, how it went..."
                  rows={3}
                  className="w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-sans text-sm p-3 outline-none rounded resize-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Questions */}
              <QuestionsSection
                questions={round.questions || []}
                onChange={qs => onUpdate("questions", qs)}
              />

              {/* Cleared? */}
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--c-text-mute)] mb-2">Did you clear this round?</p>
                <div className="flex items-center gap-2">
                  {[
                    { val: true,  label: "Yes, cleared" },
                    { val: false, label: "No, dropped" },
                    { val: null,  label: "Not sure" },
                  ].map(opt => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => onUpdate("cleared", opt.val)}
                      className={`px-3 py-2 font-mono text-[11px] font-bold rounded border transition-all ${
                        round.cleared === opt.val
                          ? opt.val === true  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : opt.val === false ? "bg-rose-500/20 border-rose-500 text-rose-400"
                          :                     "bg-slate-700 border-slate-600 text-slate-200"
                          : "bg-[color:var(--c-panel)] border-slate-800 text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Questions sub-section ─────────────────────────────── */
const TOPICS = [
  "Arrays","Strings","Linked Lists","Trees","Graphs",
  "Dynamic Programming","Binary Search","Sorting","System Design","Behavioural","Other"
]

function QuestionsSection({ questions, onChange }) {
  const [expanded, setExpanded] = useState(false)

  const addQ = () => onChange([...questions, { text: "", topic: "Arrays", difficulty: "medium" }])
  const removeQ = i => onChange(questions.filter((_, idx) => idx !== i))
  const updateQ = (i, key, val) => {
    const qs = [...questions]
    qs[i] = { ...qs[i], [key]: val }
    onChange(qs)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)] transition-colors"
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        Questions asked in this round
        {questions.length > 0 && (
          <span className="ml-1 text-cyan-400">({questions.length})</span>
        )}
        <span className="text-slate-600 normal-case font-normal ml-1">– optional</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-[color:var(--c-panel)] border border-slate-800 rounded">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={q.text}
                      onChange={e => updateQ(i, "text", e.target.value)}
                      placeholder="e.g. Find LCA in a Binary Tree"
                      className="w-full bg-[color:var(--c-panel2)] border border-slate-700 text-[color:var(--c-text)] font-sans text-xs p-2 outline-none rounded"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={q.topic}
                        onChange={e => updateQ(i, "topic", e.target.value)}
                        className="bg-[color:var(--c-panel2)] border border-slate-700 text-[color:var(--c-text-dim)] font-mono text-[11px] px-2 py-1.5 rounded outline-none"
                      >
                        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select
                        value={q.difficulty || "medium"}
                        onChange={e => updateQ(i, "difficulty", e.target.value)}
                        className="bg-[color:var(--c-panel2)] border border-slate-700 text-[color:var(--c-text-dim)] font-mono text-[11px] px-2 py-1.5 rounded outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeQ(i)} className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors mt-0.5">
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addQ}
                className="text-[11px] font-mono text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <Plus size={11} /> Add a question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
