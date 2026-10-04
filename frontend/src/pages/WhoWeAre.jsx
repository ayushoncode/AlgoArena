import React, { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, useScroll, useTransform, useInView, useReducedMotion } from "framer-motion"
import {
  Terminal, Zap, Cpu, Shield, Code2, ChevronRight, ChevronLeft,
  Play, Pause, Globe, ArrowDown, Sparkles, Layers, ExternalLink, Command
} from "lucide-react"

import { team, origin, stats, stack, story } from "../content/team"
import { useAuth } from "../hooks/useAuth"
import {
  PageWrapper, HudPanel, HudButton, GhostButton, Scanlines,
  AnimatedCounter, Tooltip
} from "../components/ui/index.jsx"

/* ══════════════════════════════════════════════════════════
   BRAND SVG ICONS (GitHub & LinkedIn)
   Ensures zero missing export issues from icon libraries
══════════════════════════════════════════════════════════ */
function GithubIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LinkedinIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT: WhoWeAre
══════════════════════════════════════════════════════════ */
export default function WhoWeAre() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const prefersReducedMotion = useReducedMotion()

  // SEO Page Title & Meta
  useEffect(() => {
    document.title = "Who We Are | AlgoArena"
  }, [])

  // Active Member Selection State
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion)
  const [userInteracted, setUserInteracted] = useState(false)
  const selectedMember = team[selectedIndex] || team[0]

  // Auto-advance Roster (8s interval)
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) return
    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % team.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [isPlaying, prefersReducedMotion])

  const handleSelectMember = (idx) => {
    setSelectedIndex(idx)
    setUserInteracted(true)
    setIsPlaying(false) // Pause auto-advance upon explicit interaction
  }

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? team.length - 1 : prev - 1))
    setUserInteracted(true)
    setIsPlaying(false)
  }, [])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % team.length)
    setUserInteracted(true)
    setIsPlaying(false)
  }, [])

  // Keyboard Arrow Navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "ArrowRight") handleNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePrev, handleNext])

  // Touch Swipe Gesture for Character Stage
  const touchStartX = useRef(0)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    const diffX = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) handleNext()
      else handlePrev()
    }
  }

  // 3D Perspective Mouse Tilt Effect for Character Stage
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })
  const handleMouseMove = (e) => {
    if (prefersReducedMotion || window.innerWidth < 768) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    const rotateX = -((y / (rect.height / 2)) * 10) // 10 deg tilt
    const rotateY = (x / (rect.width / 2)) * 10 // 10 deg tilt
    setTilt({ rotateX, rotateY })
  }
  const handleMouseLeave = () => setTilt({ rotateX: 0, rotateY: 0 })

  // Parallax Scroll for Hero
  const { scrollY } = useScroll()
  const heroParallaxY = useTransform(scrollY, [0, 500], [0, 100])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.2])

  // Scroll TimelineRef
  const timelineRef = useRef(null)
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end start"]
  })

  // Stats InView
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" })

  return (
    <PageWrapper heroGlow className="pt-20 sm:pt-24 pb-20">
      
      {/* ══════════════════════════════════════════════════════════
         SECTION 1: HERO (Cinematic Intro ~70vh)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[65vh] flex flex-col items-center justify-center text-center px-5 sm:px-8 overflow-hidden">
        
        {/* Soft Red/Blue Glows */}
        <div
          aria-hidden="true"
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-40"
          style={{ background: "var(--c-red-glow)" }}
        />
        <div
          aria-hidden="true"
          className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-30"
          style={{ background: "rgba(56,189,248,0.2)" }}
        />

        <motion.div
          style={{ y: prefersReducedMotion ? 0 : heroParallaxY, opacity: heroOpacity }}
          className="max-w-4xl mx-auto space-y-6 relative z-10"
        >
          {/* Overline Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest bg-rose-500/10 border border-rose-500/30 text-rose-400"
          >
            <Terminal size={13} /> // THE FOUNDING SQUAD
          </motion.div>

          {/* Line-by-Line Headline Reveal */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-tight text-[color:var(--c-text)] uppercase leading-none"
            >
              {story.headline.split(".")[0]}. <span style={{ color: "var(--c-red)" }}>{story.headline.split(".")[1] || "ONE ARENA."}</span>
            </motion.h1>
          </div>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="font-sans text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-[color:var(--c-text-dim)] leading-relaxed font-normal"
          >
            {story.subline}
          </motion.p>
        </motion.div>

        {/* Scroll Cue Arrow */}
        <motion.a
          href="#character-select"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          className="mt-14 inline-flex items-center gap-2 font-mono text-xs text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)] transition-colors"
          aria-label="Scroll to character selection"
        >
          <span>ROSTER STAGE</span>
          <ArrowDown size={14} className="text-rose-500" />
        </motion.a>
      </section>

      {/* ══════════════════════════════════════════════════════════
         SECTION 2: CHARACTER SELECT (Centerpiece Stage)
      ══════════════════════════════════════════════════════════ */}
      <section id="character-select" className="max-w-6xl mx-auto px-4 sm:px-8 my-12 scroll-mt-24">
        
        {/* Stage Controls & Accessibility Announcement */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[var(--c-border)]">
          <div className="flex items-center gap-3">
            <span className="section-label mb-0 flex items-center gap-2">
              <Command size={13} className="text-cyan-400" />
              // CHARACTER SELECT STAGE
            </span>
            <span className="font-mono text-xs px-2 py-0.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-mute)]">
              0{selectedIndex + 1} / 0{team.length}
            </span>
          </div>

          {/* Auto-Advance Toggle & Arrow Nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)] bg-[color:var(--c-panel)] border border-[color:var(--c-border)] transition-colors"
              title={isPlaying ? "Pause automatic character rotation" : "Play automatic character rotation"}
            >
              {isPlaying ? <Pause size={11} className="text-rose-400" /> : <Play size={11} className="text-cyan-400" />}
              <span className="hidden sm:inline">{isPlaying ? "AUTO ROTATION" : "MANUAL STAGE"}</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] hover:text-rose-400 transition-colors"
                aria-label="Previous character"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] hover:text-rose-400 transition-colors"
                aria-label="Next character"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Aria-live Screen Reader Announcement */}
        <div className="sr-only" aria-live="polite">
          Selected Member: {selectedMember.name}, {selectedMember.classTitle}, {selectedMember.role}.
        </div>

        {/* Character Stage Card Container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative z-10"
        >
          <motion.div
            animate={{
              x: tilt.rotateY * 0.5,
              y: -tilt.rotateX * 0.5,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <HudPanel
              className="p-6 sm:p-8 relative overflow-hidden"
              glow
              glowColor="rgba(225,29,72,0.12)"
              style={{ background: "var(--c-panel)", clipPath: 'none', borderRadius: '8px' }}
            >
              <Scanlines />

              {/* Faint Giant Background Initial Letter */}
              <div
                aria-hidden="true"
                className="absolute right-4 top-1/2 -translate-y-1/2 font-display font-black text-[180px] sm:text-[240px] text-[color:var(--c-text-mute)] opacity-10 select-none pointer-events-none z-0"
              >
                {selectedMember.classTitle?.[0] || selectedMember.name?.[0] || "A"}
              </div>

              {/* Stage Content Grid */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* LEFT: Portrait Stage Frame (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedMember.id}
                      initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -30, filter: "blur(6px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 30, filter: "blur(6px)" }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="relative w-full max-w-[280px] aspect-[4/5] rounded-xl overflow-hidden border-2 border-[var(--c-border)] group"
                      style={{
                        boxShadow: "0 0 30px rgba(0,0,0,0.6)",
                      }}
                    >
                      {/* Holographic Scanline Overlay on Swap */}
                      <motion.div
                        initial={{ top: "-100%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 0.8, ease: "linear" }}
                        className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent z-20 pointer-events-none"
                      />

                      {/* Corner Accents */}
                      <span aria-hidden="true" className="absolute top-2 left-2 z-20 w-3 h-3 border-t-2 border-l-2 border-rose-500" />
                      <span aria-hidden="true" className="absolute top-2 right-2 z-20 w-3 h-3 border-t-2 border-r-2 border-rose-500" />
                      <span aria-hidden="true" className="absolute bottom-2 left-2 z-20 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                      <span aria-hidden="true" className="absolute bottom-2 right-2 z-20 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

                      {/* Photo in Full Original Color */}
                      <img
                        src={selectedMember.photo}
                        alt={selectedMember.name}
                        loading="eager"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ objectPosition: selectedMember.focalPoint || "50% 30%" }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* RIGHT: Character Dossier (7 cols) */}
                <div className="md:col-span-7 space-y-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedMember.id}
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-4"
                    >
                      {/* Class Badge & Role */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-black uppercase tracking-widest px-2.5 py-1 bg-rose-500/15 border border-rose-500/40 text-rose-400">
                          CLASS // {selectedMember.classTitle || "DEVELOPER"}
                        </span>
                        <span className="font-mono text-xs text-[color:var(--c-text-mute)]">
                          {selectedMember.role}
                        </span>
                      </div>

                      {/* Member Name */}
                      <div>
                        <h2 className="font-display font-black text-3xl sm:text-5xl text-[color:var(--c-text)] tracking-wide uppercase">
                          {selectedMember.name}
                        </h2>
                        {selectedMember.name === "Add Your Name" && (
                          <span className="inline-block mt-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30">
                            TODO: Config field 'name' needs real value
                          </span>
                        )}
                      </div>

                      {/* Quote */}
                      <blockquote className="font-sans italic text-sm sm:text-base text-[color:var(--c-text-dim)] border-l-2 border-rose-500 pl-4 py-0.5 my-2">
                        "{selectedMember.quote}"
                      </blockquote>

                      {/* Signature Move */}
                      {selectedMember.signatureMove && (
                        <div className="p-3 bg-[color:var(--c-panel)]/90 border border-[color:var(--c-border)] rounded space-y-1">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Zap size={13} /> SIGNATURE MOVE
                          </p>
                          <p className="font-sans text-xs text-[color:var(--c-text-dim)]">
                            {selectedMember.signatureMove}
                          </p>
                        </div>
                      )}

                      {/* Focus Areas (Skill Bars) */}
                      {selectedMember.focusAreas?.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--c-text-mute)]">
                            FOCUS AREAS
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedMember.focusAreas.map((skill, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between font-mono text-[10px]">
                                  <span className="text-[color:var(--c-text-dim)]">{skill.label}</span>
                                  <span className="text-cyan-400 font-bold">{skill.value}%</span>
                                </div>
                                <div className="h-1.5 bg-[color:var(--c-panel)] rounded overflow-hidden border border-[color:var(--c-border)]">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.value}%` }}
                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    className="h-full bg-gradient-to-r from-rose-500 to-cyan-400"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social Action Links (Hidden if URL missing) */}
                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[color:var(--c-border)]/80 relative z-50 pointer-events-auto">
                        {selectedMember.links?.github && (
                          <a
                            href={selectedMember.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (selectedMember.links.github) window.open(selectedMember.links.github, "_blank")
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-2 font-mono text-xs font-bold text-[color:var(--c-text)] bg-[color:var(--c-panel)] border border-[color:var(--c-border)] hover:border-rose-500 hover:bg-rose-500/20 hover:text-[color:var(--c-text)] transition-all cursor-pointer relative z-50 pointer-events-auto"
                            aria-label={`${selectedMember.name}'s GitHub Profile`}
                            title="GitHub Profile"
                          >
                            <GithubIcon size={15} />
                            <span>GITHUB</span>
                            <ExternalLink size={12} className="text-[color:var(--c-text-mute)]" />
                          </a>
                        )}
                        {selectedMember.links?.linkedin && (
                          <a
                            href={selectedMember.links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (selectedMember.links.linkedin) window.open(selectedMember.links.linkedin, "_blank")
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-2 font-mono text-xs font-bold text-[color:var(--c-text)] bg-[color:var(--c-panel)] border border-[color:var(--c-border)] hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-[color:var(--c-text)] transition-all cursor-pointer relative z-50 pointer-events-auto"
                            aria-label={`${selectedMember.name}'s LinkedIn Profile`}
                            title="LinkedIn Profile"
                          >
                            <LinkedinIcon size={15} />
                            <span>LINKEDIN</span>
                            <ExternalLink size={12} className="text-[color:var(--c-text-mute)]" />
                          </a>
                        )}
                        {selectedMember.links?.site && (
                          <a
                            href={selectedMember.links.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (selectedMember.links.site) window.open(selectedMember.links.site, "_blank")
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-2 font-mono text-xs font-bold text-[color:var(--c-text)] bg-[color:var(--c-panel)] border border-[color:var(--c-border)] hover:border-amber-400 hover:bg-amber-500/20 hover:text-[color:var(--c-text)] transition-all cursor-pointer relative z-50 pointer-events-auto"
                            aria-label={`${selectedMember.name}'s Portfolio Website`}
                            title="Portfolio Website"
                          >
                            <Globe size={15} />
                            <span>PORTFOLIO</span>
                            <ExternalLink size={12} className="text-[color:var(--c-text-mute)]" />
                          </a>
                        )}
                      </div>

                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

            </HudPanel>
          </motion.div>
        </div>

        {/* ROSTER SELECTION STRIP (Bottom Thumbnails) */}
        <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          {team.map((member, idx) => {
            const isActive = idx === selectedIndex
            return (
              <button
                key={member.id}
                onClick={() => handleSelectMember(idx)}
                className={`relative shrink-0 flex items-center gap-3 px-3 py-2 border transition-all text-left group ${
                  isActive
                    ? "bg-[color:var(--c-panel)] border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                    : "bg-[color:var(--c-panel2)] border-[color:var(--c-border)] hover:border-[color:var(--c-border)] opacity-70 hover:opacity-100"
                }`}
                aria-label={`Select character ${member.name}`}
              >
                {/* Active Indicator Arrow */}
                {isActive && (
                  <span aria-hidden="true" className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-rose-500">
                    ▲
                  </span>
                )}

                {/* Thumbnail */}
                <div className={`w-10 h-12 rounded overflow-hidden border ${isActive ? "border-rose-400" : "border-[color:var(--c-border)]"}`}>
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: member.focalPoint || "50% 30%" }}
                  />
                </div>

                {/* Mini Info */}
                <div className="hidden sm:block text-left">
                  <p className={`font-display font-bold text-xs uppercase ${isActive ? "text-[color:var(--c-text)]" : "text-[color:var(--c-text-mute)]"}`}>
                    {member.name}
                  </p>
                  <p className="font-mono text-[9px] text-[color:var(--c-text-mute)] uppercase">
                    {member.classTitle || "DEVELOPER"}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         SECTION 3: ORIGIN LOG (Story Timeline)
      ══════════════════════════════════════════════════════════ */}
      {origin?.length >= 3 && (
        <section ref={timelineRef} className="max-w-4xl mx-auto px-5 sm:px-8 my-20">
          <div className="text-center mb-12 space-y-2">
            <span className="section-label">// ORIGIN LOG</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[color:var(--c-text)] uppercase tracking-tight">
              HOW ALGOARENA WAS <span style={{ color: "var(--c-red)" }}>FORGED</span>
            </h2>
          </div>

          {/* Timeline Container */}
          <div className="relative border-l-2 border-[color:var(--c-border)] ml-4 md:ml-0 md:left-1/2 md:-translate-x-1/2 space-y-10">
            {origin.map((item, idx) => {
              const isEven = idx % 2 === 0
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-start ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Timeline Center Node */}
                  <div className="absolute -left-[17px] md:left-1/2 md:-translate-x-1/2 top-1.5 w-8 h-8 rounded-full bg-[color:var(--c-panel2)] border-2 border-rose-500 flex items-center justify-center z-10 shadow-[0_0_12px_rgba(225,29,72,0.4)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  </div>

                  {/* Card Content (Occupies half width on desktop) */}
                  <div className="w-full md:w-[45%] pl-6 md:pl-0">
                    <HudPanel className="p-5 space-y-2 bg-[color:var(--c-panel2)] border-[color:var(--c-border)]">
                      <div className="flex items-center justify-between font-mono text-[10px] text-[color:var(--c-text-mute)]">
                        <span className="font-bold text-rose-400">{item.phase}</span>
                        <span>{item.date}</span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-[color:var(--c-text)] tracking-wide">
                        {item.title}
                      </h3>
                      <p className="font-sans text-xs text-[color:var(--c-text-dim)] leading-relaxed">
                        {item.text}
                      </p>
                      {item.tag && (
                        <div className="pt-1">
                          <span className="inline-block font-mono text-[9px] uppercase px-2 py-0.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-cyan-400">
                            TAG // {item.tag}
                          </span>
                        </div>
                      )}
                    </HudPanel>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
         SECTION 4: BUILD STATS (Animated Counters)
      ══════════════════════════════════════════════════════════ */}
      <section ref={statsRef} className="max-w-5xl mx-auto px-5 sm:px-8 my-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <HudPanel key={idx} className="p-5 text-center space-y-1 bg-[color:var(--c-panel2)] border-[color:var(--c-border)]">
              <p className="font-display font-black text-3xl sm:text-4xl text-rose-400 tabular-nums">
                {typeof stat.value === "number" ? (
                  statsInView ? <AnimatedCounter value={stat.value} duration={1000} /> : 0
                ) : (
                  stat.value
                )}
              </p>
              <p className="font-mono text-[10px] uppercase font-bold tracking-wider text-[color:var(--c-text-mute)]">
                {stat.label}
              </p>
            </HudPanel>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         SECTION 5: TECH ARSENAL (Infinite Marquee)
      ══════════════════════════════════════════════════════════ */}
      <section className="my-20 overflow-hidden border-y border-[color:var(--c-border)] py-8 bg-[color:var(--c-panel2)]">
        <div className="text-center mb-6">
          <span className="section-label mb-0">// CORE TECH ARSENAL</span>
        </div>

        {/* Marquee Row 1 */}
        <div className="flex overflow-hidden group select-none">
          <div className="flex animate-marquee space-x-4 shrink-0 group-hover:[animation-play-state:paused]">
            {stack.concat(stack).map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] font-mono text-xs font-bold uppercase tracking-wider"
              >
                <Code2 size={13} className="text-cyan-400" />
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         SECTION 6: FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 mt-16 text-center">
        <HudPanel className="p-8 sm:p-12 relative overflow-hidden border-rose-500/40 bg-[color:var(--c-panel2)]" glow glowColor="rgba(225,29,72,0.15)">
          <div className="space-y-4 max-w-xl mx-auto relative z-10">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[color:var(--c-text)] uppercase tracking-tight">
              WANT TO <span style={{ color: "var(--c-red)" }}>DUEL US?</span>
            </h2>
            <p className="font-sans text-sm sm:text-base text-[color:var(--c-text-dim)] leading-relaxed">
              Step into the arena, compete in real-time 1v1 algorithmic battles, and rise through the ELO ranks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <HudButton
                onClick={() => navigate(isAuthenticated ? "/lobby" : "/?auth=register")}
                className="px-6 py-3 font-display font-bold text-sm uppercase tracking-wider text-[color:var(--c-text)] bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              >
                <span className="flex items-center gap-2">
                  ENTER THE ARENA <ChevronRight size={16} />
                </span>
              </HudButton>

              {story.repoUrl && (
                <GhostButton
                  onClick={() => window.open(story.repoUrl, "_blank")}
                  className="px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    <GithubIcon size={14} /> VIEW SOURCE
                  </span>
                </GhostButton>
              )}
            </div>
          </div>
        </HudPanel>
      </section>

    </PageWrapper>
  )
}
