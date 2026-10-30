import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
  IconCheck,
  IconClose,
  IconClock,
  IconLock,
  IconShield,
} from '../../components/icons/index.jsx'
import { ToastContainer } from '../../components/ui/index.jsx'
import IntelMonogram from './IntelMonogram.jsx'
import IntelOutcomeMark from './IntelOutcomeMark.jsx'
import IntelDifficultyText from './IntelDifficultyText.jsx'
import { IntelTimelineNode } from './IntelTimelineNode.jsx'

const STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Rounds' },
  { id: 3, label: 'Your take' },
  { id: 4, label: 'Review & submit' },
]

const ROUND_TYPES = [
  { value: 'online_assessment', label: 'Online Assessment', desc: 'Coding platform test (HackerRank, etc.)' },
  { value: 'dsa',               label: 'DSA Round',          desc: 'Data Structures & Algorithms interview' },
  { value: 'technical',         label: 'Technical Round',    desc: 'Core CS, projects, system concepts' },
  { value: 'system_design',     label: 'System Design',      desc: 'Architecture, scalability, HLD/LLD' },
  { value: 'hr',                label: 'HR Round',           desc: 'Culture fit, salary, background' },
  { value: 'managerial',        label: 'Managerial Round',   desc: 'Manager interview, behavioural' },
  { value: 'other',             label: 'Other',              desc: 'Group discussion, case study, etc.' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const TOPICS = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Binary Search', 'Sorting', 'System Design', 'Behavioural', 'Other'
]

export function ShareExperienceWizardV2({
  id,
  isEditMode,
  step,
  setStep,
  submitting,
  nda,
  setNda,
  errors,
  toasts,
  dismissToast,
  form,
  set,
  next,
  prev,
  addRound,
  removeRound,
  updateRound,
  handleSubmit,
  navigate,
  user,
}) {
  return (
    <main className="intel-v2" role="main" aria-label="Share interview report wizard">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="intel-v2-container">
        <div className="intel-wizard-layout">

          {/* Top Bar: Exit button & Mode Indicator */}
          <div className="intel-wizard-topbar">
            <button
              type="button"
              onClick={() => navigate('/experiences')}
              className="intel-back-btn"
              aria-label="Exit wizard"
            >
              <IconChevronLeft size={16} />
              <span>EXIT</span>
            </button>
            <span className="intel-overline">
              {isEditMode ? '// EDIT REPORT' : '// SHARE EXPERIENCE'}
            </span>
          </div>

          {/* Progress Rail */}
          <nav className="intel-wizard-rail" aria-label="Wizard progress">
            {STEPS.map((s) => {
              const done = s.id < step
              const active = s.id === step

              let hasErrors = false
              if (s.id === 1 && (errors.company || errors.roleTitle)) hasErrors = true
              if (s.id === 2 && (errors.rounds || Object.keys(errors).some(k => k.startsWith('round_')))) hasErrors = true
              if (s.id === 3 && errors.overallExperience) hasErrors = true

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => done && setStep(s.id)}
                  disabled={!done}
                  className={`intel-wizard-step-btn ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="intel-wizard-step-num">
                    {done ? <IconCheck size={12} /> : `0${s.id}`}
                  </span>
                  <span>{s.label}</span>
                  {hasErrors && <span className="intel-step-error-dot" aria-label="Step has errors" />}
                </button>
              )
            })}
          </nav>

          {/* Step Form Panel */}
          <div className="intel-wizard-panel">

            {/* ─── STEP 1: BASICS ─── */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="intel-h1" style={{ fontSize: 24 }}>Company & Role</h1>
                  <p className="intel-lead mt-1">Start with the basics: who interviewed you and for what role.</p>
                </div>

                {/* Track segmented switch */}
                <div className="intel-form-field">
                  <label className="intel-form-label">Interview Track</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['intern', 'sde'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('track', t)}
                        className={`intel-segmented-btn ${form.track === t ? 'is-selected' : ''}`}
                      >
                        {t === 'intern' ? 'Internship' : 'Full-Time SDE'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company & Role Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-company-input">
                      Company *
                    </label>
                    <input
                      id="intel-company-input"
                      type="text"
                      value={form.company}
                      onChange={(e) => set('company', e.target.value)}
                      placeholder="Google, Amazon, Flipkart..."
                      className={`intel-form-input ${errors.company ? 'has-error' : ''}`}
                      aria-invalid={Boolean(errors.company)}
                      aria-describedby={errors.company ? 'err-company' : undefined}
                    />
                    {errors.company && (
                      <p id="err-company" className="intel-form-error" role="alert">
                        <IconClose size={12} />
                        <span>{errors.company}</span>
                      </p>
                    )}
                  </div>

                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-role-input">
                      Role Title *
                    </label>
                    <input
                      id="intel-role-input"
                      type="text"
                      value={form.roleTitle}
                      onChange={(e) => set('roleTitle', e.target.value)}
                      placeholder="SWE Intern, SDE-1..."
                      className={`intel-form-input ${errors.roleTitle ? 'has-error' : ''}`}
                      aria-invalid={Boolean(errors.roleTitle)}
                      aria-describedby={errors.roleTitle ? 'err-roleTitle' : undefined}
                    />
                    {errors.roleTitle && (
                      <p id="err-roleTitle" className="intel-form-error" role="alert">
                        <IconClose size={12} />
                        <span>{errors.roleTitle}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Year, Month, Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-year-input">
                      Year
                    </label>
                    <input
                      id="intel-year-input"
                      type="number"
                      value={form.year}
                      onChange={(e) => set('year', parseInt(e.target.value, 10))}
                      className="intel-form-input"
                    />
                  </div>

                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-month-select">
                      Month
                    </label>
                    <select
                      id="intel-month-select"
                      value={form.month}
                      onChange={(e) => set('month', parseInt(e.target.value, 10))}
                      className="intel-form-select"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-location-input">
                      Location
                    </label>
                    <input
                      id="intel-location-input"
                      type="text"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="Bengaluru / Remote"
                      className="intel-form-input"
                    />
                  </div>
                </div>

                {/* Source & Compensation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-source-select">
                      How did you apply?
                    </label>
                    <select
                      id="intel-source-select"
                      value={form.source}
                      onChange={(e) => set('source', e.target.value)}
                      className="intel-form-select"
                    >
                      <option value="on_campus">On Campus</option>
                      <option value="off_campus">Off Campus</option>
                      <option value="referral">Referral</option>
                    </select>
                  </div>

                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-comp-input">
                      {form.track === 'intern' ? 'Stipend (optional)' : 'CTC / Package (optional)'}
                    </label>
                    <input
                      id="intel-comp-input"
                      type="text"
                      value={form.track === 'intern' ? form.stipendRange : form.ctcRange}
                      onChange={(e) => set(form.track === 'intern' ? 'stipendRange' : 'ctcRange', e.target.value)}
                      placeholder={form.track === 'intern' ? 'e.g. 50k/month' : 'e.g. 18 LPA'}
                      className="intel-form-input"
                    />
                  </div>
                </div>

                {/* Outcome & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="intel-form-field">
                    <label className="intel-form-label" htmlFor="intel-outcome-select">
                      Final Outcome
                    </label>
                    <select
                      id="intel-outcome-select"
                      value={form.outcome}
                      onChange={(e) => set('outcome', e.target.value)}
                      className="intel-form-select"
                    >
                      <option value="selected">Got the offer</option>
                      <option value="rejected">Rejected</option>
                      <option value="waiting">Still waiting</option>
                      <option value="withdrew">Withdrew</option>
                    </select>
                  </div>

                  <div className="intel-form-field">
                    <label className="intel-form-label">Overall Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['easy', 'medium', 'hard'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => set('difficulty', d)}
                          className={`intel-segmented-btn uppercase font-mono text-xs ${form.difficulty === d ? `is-selected is-selected-${d}` : ''}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2: ROUNDS ─── */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="intel-h1" style={{ fontSize: 24 }}>Interview Rounds</h1>
                  <p className="intel-lead mt-1">
                    Add each round in order. Select the round type, then describe what was asked.
                  </p>
                </div>

                {errors.rounds && (
                  <p className="intel-form-error">
                    <IconClose size={12} />
                    <span>{errors.rounds}</span>
                  </p>
                )}

                <div className="flex flex-col gap-4">
                  {form.rounds.map((round, rIdx) => (
                    <RoundBuilderCard
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
                  className="intel-btn-primary"
                  style={{ justifyContent: 'center', width: '100%', borderStyle: 'dashed' }}
                >
                  <IconPlus size={14} />
                  <span>ADD ROUND</span>
                </button>
              </div>
            )}

            {/* ─── STEP 3: YOUR TAKE ─── */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="intel-h1" style={{ fontSize: 24 }}>Your Take</h1>
                  <p className="intel-lead mt-1">Help the next candidate prepare with honest, concrete reflections.</p>
                </div>

                <div className="intel-form-field">
                  <label className="intel-form-label" htmlFor="intel-overall-exp">
                    Overall Experience * (min 20 chars)
                  </label>
                  <textarea
                    id="intel-overall-exp"
                    rows={6}
                    value={form.overallExperience}
                    onChange={(e) => set('overallExperience', e.target.value)}
                    placeholder="How did it go overall? What was the vibe, the difficulty, the process? Was the interviewer helpful or cold? Anything surprising?"
                    className={`intel-form-textarea ${errors.overallExperience ? 'has-error' : ''}`}
                    aria-invalid={Boolean(errors.overallExperience)}
                    aria-describedby={errors.overallExperience ? 'err-overallExp' : undefined}
                  />
                  <div className="flex justify-between items-center">
                    {errors.overallExperience ? (
                      <p id="err-overallExp" className="intel-form-error" role="alert">
                        <IconClose size={12} aria-hidden="true" />
                        <span>{errors.overallExperience}</span>
                      </p>
                    ) : <div />}
                    <span className={`intel-char-count ${form.overallExperience.length > 3000 ? 'intel-char-over' : form.overallExperience.length >= 2700 ? 'intel-char-warn' : ''}`}>
                      {form.overallExperience.length} / 3000
                    </span>
                  </div>
                </div>

                <div className="intel-form-field">
                  <label className="intel-form-label" htmlFor="intel-tips-input">
                    Tips for future candidates (optional)
                  </label>
                  <textarea
                    id="intel-tips-input"
                    rows={3}
                    value={form.tips}
                    onChange={(e) => set('tips', e.target.value)}
                    placeholder="What should someone prep? Any specific topics, resources, or advice?"
                    className="intel-form-textarea"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div
                  className="intel-anon-box cursor-pointer"
                  onClick={() => set('isAnonymous', !form.isAnonymous)}
                  role="checkbox"
                  aria-checked={Boolean(form.isAnonymous)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      set('isAnonymous', !form.isAnonymous)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="intel-anon-title flex items-center gap-1.5">
                        <IconLock size={13} />
                        <span>Post anonymously</span>
                      </p>
                      <p className="intel-anon-copy mt-0.5">
                        Your name and avatar will be hidden for readers.
                      </p>
                    </div>
                    <div
                      className={`intel-nda-checkbox ${form.isAnonymous ? 'is-checked' : ''}`}
                    >
                      {form.isAnonymous && <IconCheck size={12} />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 4: SUBMIT / REVIEW ─── */}
            {step === 4 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="intel-h1" style={{ fontSize: 24 }}>Review & Submit</h1>
                  <p className="intel-lead mt-1">Review your report preview below before publishing to the archive.</p>
                </div>

                {/* Live Preview Box */}
                <div className="intel-detail-header-card" style={{ padding: 20 }}>
                  <div className="flex items-start gap-4">
                    <IntelMonogram name={form.company || 'C'} />
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="intel-detail-h1" style={{ fontSize: 20 }}>
                          {form.company || 'Company'}
                        </h2>
                        <span className="intel-pill">
                          {form.track === 'intern' ? 'INTERN' : 'SDE'}
                        </span>
                      </div>
                      <p className="intel-detail-role" style={{ fontSize: 13 }}>
                        {form.roleTitle || 'Role Title'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IntelOutcomeMark outcome={form.outcome} />
                      {form.difficulty && (
                        <IntelDifficultyText difficulty={form.difficulty} />
                      )}
                    </div>
                  </div>

                  {form.overallExperience && (
                    <p className="intel-round-desc italic mt-2">
                      "{form.overallExperience}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--hair-muted)] font-mono text-[11px] text-[var(--sub)]">
                    <span>{form.rounds.length} {form.rounds.length === 1 ? 'round' : 'rounds'}</span>
                    <span>•</span>
                    <span>{form.year}</span>
                    {form.location && (
                      <>
                        <span>•</span>
                        <span>{form.location}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Author: {form.isAnonymous ? 'Anonymous' : (user?.username || 'You')}</span>
                  </div>
                </div>

                {/* NDA Safety Copy Box */}
                <div className="intel-nda-box">
                  <h3 className="intel-nda-title">
                    <IconShield size={16} aria-hidden="true" />
                    <span>NDA & Community Safety Guidelines</span>
                  </h3>
                  <p className="intel-nda-copy">
                    Do not share confidential or NDA-protected material, interviewers' names or personal contact details. Describe the type of question, not proprietary content.
                  </p>
                  <label className="intel-nda-checkbox-label">
                    <div
                      data-testid="nda-checkbox"
                      onClick={() => setNda(!nda)}
                      className={`w-5 h-5 intel-nda-checkbox ${nda ? 'is-checked' : ''}`}
                    >
                      {nda && <IconCheck size={12} />}
                    </div>
                    <span>I confirm this report follows NDA & community safety guidelines.</span>
                  </label>
                  <div className="text-[11px] font-mono text-[var(--sub)] pt-1 flex items-center gap-2">
                    <Link to="/terms" target="_blank" className="hover:underline text-[var(--ink)]">Terms of Service</Link>
                    <span>•</span>
                    <Link to="/privacy" target="_blank" className="hover:underline text-[var(--ink)]">Privacy Policy</Link>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="intel-wizard-footer">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prev}
                  className="intel-btn-ghost"
                >
                  <IconChevronLeft size={14} />
                  <span>BACK</span>
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={next}
                  className="intel-btn-primary"
                >
                  <span>NEXT</span>
                  <IconChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !nda}
                  className="intel-btn-primary"
                  style={{
                    backgroundColor: 'var(--ink)',
                    color: 'var(--bg-0)',
                    fontWeight: 600,
                    opacity: (submitting || !nda) ? 0.4 : 1,
                  }}
                >
                  {submitting ? 'PUBLISHING...' : isEditMode ? 'UPDATE REPORT' : 'PUBLISH'}
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </main>
  )
}

/* ─── Round Builder Sub-component ──────────────────────── */
function RoundBuilderCard({ round, index, onUpdate, onRemove, error }) {
  const [open, setOpen] = useState(true)

  const roundLabel = round.type
    ? ROUND_TYPES.find((r) => r.value === round.type)?.label || round.type
    : `Round ${index + 1}`

  return (
    <div className="intel-round-builder-card">
      <div className="intel-round-builder-header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--hair-muted)] text-[var(--ink)]">
            {index + 1}
          </span>
          <span className="font-mono text-xs font-semibold uppercase text-[var(--ink)]">
            {roundLabel}
          </span>
          {round.cleared === true && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--hair-muted)] text-[var(--ink)]">
              CLEARED
            </span>
          )}
          {round.cleared === false && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--hair-muted)] text-[var(--sub)]">
              DROPPED
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="intel-action-icon-btn"
            style={{ width: 32, height: 32, minHeight: 32, minWidth: 32 }}
            aria-label={open ? 'Collapse round' : 'Expand round'}
          >
            <IconChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="intel-action-icon-btn"
            style={{ width: 32, height: 32, minHeight: 32, minWidth: 32 }}
            aria-label="Remove round"
          >
            <IconClose size={14} />
          </button>
        </div>
      </div>

      {open && (
        <div className="intel-round-builder-body">
          {/* Round Type Selector */}
          <div className="intel-form-field">
            <label className="intel-form-label">Select Round Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROUND_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => onUpdate('type', rt.value)}
                  className={`intel-segmented-btn text-left ${round.type === rt.value ? 'is-selected' : ''}`}
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    height: 'auto',
                  }}
                >
                  <span className="font-mono text-xs font-semibold uppercase">{rt.label}</span>
                  <span className="font-sans text-[11px] text-[var(--sub)] mt-0.5">{rt.desc}</span>
                </button>
              ))}
            </div>
            {error && (
              <p className="intel-form-error mt-1" role="alert">
                <IconClose size={12} />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="intel-form-field">
            <label className="intel-form-label">Duration (minutes, optional)</label>
            <input
              type="number"
              value={round.durationMinutes || ''}
              onChange={(e) => onUpdate('durationMinutes', parseInt(e.target.value, 10) || '')}
              placeholder="e.g. 45"
              className="intel-form-input"
            />
          </div>

          {/* Description */}
          <div className="intel-form-field">
            <label className="intel-form-label">What happened in this round?</label>
            <textarea
              rows={3}
              value={round.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Describe the round: format, difficulty, how it went..."
              className="intel-form-textarea"
            />
          </div>

          {/* Questions Section */}
          <QuestionsBuilderSection
            questions={round.questions || []}
            onChange={(qs) => onUpdate('questions', qs)}
          />

          {/* Cleared Toggle */}
          <div className="intel-form-field">
            <label className="intel-form-label">Did you clear this round?</label>
            <div className="flex items-center gap-2">
              {[
                { val: true,  label: 'Yes, cleared', stateClass: 'is-selected-ok' },
                { val: false, label: 'No, dropped',  stateClass: 'is-selected-bad' },
                { val: null,  label: 'Not sure',     stateClass: 'is-selected' },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => onUpdate('cleared', opt.val)}
                  className={`intel-segmented-btn ${round.cleared === opt.val ? `is-selected ${opt.stateClass}` : ''}`}
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    padding: '6px 12px',
                    minHeight: 36,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Questions Builder Sub-section ─────────────────────── */
function QuestionsBuilderSection({ questions, onChange }) {
  const [expanded, setExpanded] = useState(false)

  const addQ = () => onChange([...questions, { text: '', topic: 'Arrays', difficulty: 'medium' }])
  const removeQ = (i) => onChange(questions.filter((_, idx) => idx !== i))
  const updateQ = (i, key, val) => {
    const qs = [...questions]
    qs[i] = { ...qs[i], [key]: val }
    onChange(qs)
  }

  return (
    <div className="intel-form-field">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="intel-btn-ghost flex items-center gap-1.5 p-0 justify-start"
        style={{ minHeight: 'auto', color: 'var(--ink)' }}
      >
        <IconChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
        <span>Questions asked in this round</span>
        {questions.length > 0 && <span>({questions.length})</span>}
        <span className="text-[var(--sub)] font-normal">(optional)</span>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3">
          {questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-[var(--bg-0)] border border-[var(--hair-muted)] rounded">
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQ(i, 'text', e.target.value)}
                  placeholder="e.g. Find LCA in a Binary Tree"
                  className="intel-form-input"
                  style={{ padding: '8px 10px', fontSize: 13 }}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={q.topic}
                    onChange={(e) => updateQ(i, 'topic', e.target.value)}
                    className="intel-form-select"
                    style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  >
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={q.difficulty || 'medium'}
                    onChange={(e) => updateQ(i, 'difficulty', e.target.value)}
                    className="intel-form-select"
                    style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeQ(i)}
                className="intel-action-icon-btn"
                style={{ width: 32, height: 32, minHeight: 32, minWidth: 32 }}
                aria-label="Remove question"
              >
                <IconClose size={13} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addQ}
            className="intel-btn-ghost flex items-center gap-1.5 self-start p-0 text-xs font-mono"
            style={{ color: 'var(--ink)' }}
          >
            <IconPlus size={12} />
            <span>Add a question</span>
          </button>
        </div>
      )}
    </div>
  )
}
