/**
 * src/content/mascot.js
 *
 * All scripted guide copy lives here.
 * Voice: short, friendly, concrete, a little dry.
 * Rules: no hype, no exclamation marks more than one per session,
 *        no promises about ratings or results.
 * Copy-lint: no em dashes, no emoji, no banned words.
 */

// ── Character identity ────────────────────────────────────────────────────────
export const MASCOT_NAME = 'Guide' // TODO: owner chooses the character name

// ── Section tips (homepage) ───────────────────────────────────────────────────
// Each tip: { id, sectionId, text, condition?, actionLabel?, actionHref? }
// condition: 'loggedOut' | 'loggedIn' | 'hasPlayedBefore' | undefined (always)
export const SECTION_TIPS = [
  {
    id: 'hero',
    sectionId: 'section-hero',
    selector: '[data-mascot-section="hero"], #section-hero, .hero-screen, main.hero',
    text: 'Same problem, same time, two players. First to pass every test wins.',
    condition: undefined,
  },
  {
    id: 'duel',
    sectionId: 'section-duel',
    selector: '[data-mascot-section="duel"], #duel, #section-duel',
    text: 'This is a demo duel. Press Play to watch both sides solve it.',
    condition: undefined,
  },
  {
    id: 'howItRuns',
    sectionId: 'section-how-it-works',
    selector: '[data-mascot-section="howItRuns"], [data-mascot-section="how-it-works"], #how-it-runs, #section-how-it-works',
    text: 'Scroll slowly. Each stage shows one part of a match.',
    condition: undefined,
  },
  {
    id: 'ratings',
    sectionId: 'section-ratings',
    selector: '[data-mascot-section="ratings"], #ratings, #section-ratings',
    text: 'Six rank tiers from Novice to Grandmaster. Elo updates immediately.',
    condition: undefined,
  },
  {
    id: 'sandbox',
    sectionId: 'section-sandbox',
    selector: '[data-mascot-section="sandbox"], #sandbox, #section-sandbox',
    text: 'Pick a language tab. The same solution is shown in four languages.',
    condition: undefined,
  },
  {
    id: 'heroes',
    sectionId: 'section-leaderboard',
    selector: '[data-mascot-section="heroes"], [data-mascot-section="leaderboard"], #leaderboard-preview, #section-leaderboard',
    text: 'These are real players, ranked by Elo.',
    condition: undefined,
  },
  {
    id: 'questions',
    sectionId: 'section-faq',
    selector: '[data-mascot-section="questions"], [data-mascot-section="faq"], #faq, #section-faq',
    text: 'Open any question for the short answer.',
    condition: undefined,
  },
  {
    id: 'finalCall',
    sectionId: 'section-final-cta',
    selector: '[data-mascot-section="finalCall"], [data-mascot-section="final-cta"], #enter-arena, #section-final-cta',
    text: 'Ready to play? Create an account and start a match from the Lobby.',
    condition: 'loggedOut',
  },
]

// ── Per-route tips (other pages) ──────────────────────────────────────────────
export const ROUTE_TIPS = {
  '/lobby': [
    {
      id: 'lobby-start',
      text: 'Pick a topic and a difficulty, then press Find Match.',
      condition: undefined,
    },
  ],
  '/leaderboard': [
    {
      id: 'leaderboard-browse',
      text: 'Select a name to see their match history.',
      condition: undefined,
    },
  ],
  '/profile': [
    {
      id: 'profile-chart',
      text: 'Hover the chart to see each match.',
      condition: undefined,
    },
  ],
  '/experiences': [
    {
      id: 'intel-read',
      text: 'Read a few reports before your next interview.',
      condition: undefined,
    },
  ],
}

// ── Event-reaction tips ───────────────────────────────────────────────────────
// Fired by specific DOM events, not section visibility.
export const EVENT_TIPS = {
  demoDuelVerdict: (winnerSide) => ({
    id: 'event-duel-verdict',
    text: `The ${winnerSide} side finished first.`,
  }),
  calculatorChanged: {
    id: 'event-calculator',
    text: 'A win against a higher rated rival earns more points.',
  },
  languageTabClicked: {
    id: 'event-lang-tab',
    text: 'Same logic, different syntax.',
  },
}

// ── Tour stops ────────────────────────────────────────────────────────────────
// Order matters. sectionId must match the data-mascot-section on the element.
export const TOUR_STOPS = [
  {
    stopIndex: 1,
    total: 5,
    id: 'duel',
    sectionId: 'section-duel',
    selector: '#duel, [data-mascot-section="duel"]',
    text: 'This is the live duel area. Both players solve the same problem at the same time.',
  },
  {
    stopIndex: 2,
    total: 5,
    id: 'howItRuns',
    sectionId: 'section-how-it-works',
    selector: '#how-it-runs, [data-mascot-section="howItRuns"], [data-mascot-section="how-it-works"]',
    text: 'Each stage here shows one part of how a match runs, from start to verdict.',
  },
  {
    stopIndex: 3,
    total: 5,
    id: 'ratings',
    sectionId: 'section-ratings',
    selector: '#ratings, [data-mascot-section="ratings"]',
    text: 'Elo adjusts after every match. Six rank tiers calibrate from Novice to Grandmaster.',
  },
  {
    stopIndex: 4,
    total: 5,
    id: 'sandbox',
    sectionId: 'section-sandbox',
    selector: '#sandbox, [data-mascot-section="sandbox"]',
    text: 'The sandbox shows the same solution in multiple languages. Pick one to compare.',
  },
  {
    stopIndex: 5,
    total: 5,
    id: 'heroes',
    sectionId: 'section-leaderboard',
    selector: '#leaderboard-preview, [data-mascot-section="heroes"], [data-mascot-section="leaderboard"]',
    text: 'The leaderboard shows ranked players. Click a name to see their match record.',
  },
]

export const TOUR_INTRO_TEXT = `Hi, I am ${MASCOT_NAME}. Want a 30 second look around?`
export const TOUR_CLOSING_TEXT = 'That covers the main areas. Good luck in the arena.'

// ── Session limits ────────────────────────────────────────────────────────────
export const MAX_TIPS_PER_SESSION = 6
export const MIN_SECONDS_BETWEEN_TIPS = 12
export const SECTION_VISIBILITY_THRESHOLD = 0.55  // 55%
export const SCROLL_SETTLE_MS = 600
export const BUBBLE_AUTO_DISMISS_DESKTOP_MS = 7000
export const BUBBLE_AUTO_DISMISS_MOBILE_MS = 5000
export const IDLE_SLEEPY_THRESHOLD_MS = 25000

// ── Route allow-list ──────────────────────────────────────────────────────────
// The mascot is only shown on the home page when logged out.
// All other routes default to hidden.
// Match/battle/editor/queue/wizard/auth-dialog handled by shouldShowMascot().
export const ALLOWED_ROUTES = new Set([
  '/',
])

// Routes where the mascot is never shown, regardless of state.
export const BLOCKED_ROUTES = [
  /^\/match\//,       // battle room + editor
  /^\/result/,        // post-match
  /^\/experiences\/new/, // share wizard (new)
  /^\/experiences\/.*\/edit$/, // share wizard (edit)
]
