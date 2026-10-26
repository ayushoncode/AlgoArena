import React from 'react'

const DIFFICULTY_CONFIG = [
  {
    id: 'easy',
    label: 'Easy',
    descriptor: 'Warm-up',
    markerColor: '#22c55e',
    estimate: '+12 / −12'
  },
  {
    id: 'medium',
    label: 'Medium',
    descriptor: 'Balanced',
    markerColor: '#f59e0b',
    estimate: '+18 / −18'
  },
  {
    id: 'hard',
    label: 'Hard',
    descriptor: 'Elite',
    markerColor: '#ef4444',
    estimate: '+25 / −25'
  }
]

export default function DifficultySegment({
  selectedDiff,
  onSelectDiff,
}) {
  return (
    <section className="lobby-v2-section" aria-label="Difficulty Selection">
      <div className="lobby-v2-section-head">
        <h2 className="lobby-v2-section-title">
          <span>Difficulty</span>
        </h2>
      </div>

      <div
        className="lobby-v2-diff-segment"
        role="radiogroup"
        aria-label="Difficulty options"
      >
        {DIFFICULTY_CONFIG.map((d) => {
          const isSelected = selectedDiff === d.id

          return (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`lobby-v2-diff-btn ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectDiff(d.id)}
            >
              <div className="lobby-v2-diff-top">
                <span className="lobby-v2-diff-label">{d.label}</span>
                <span
                  className="lobby-v2-diff-marker"
                  style={{ background: d.markerColor }}
                  aria-hidden="true"
                />
              </div>
              <div className="lobby-v2-diff-estimate">
                {d.estimate} (estimate)
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
