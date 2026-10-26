/**
 * Single source of truth for AlgoArena "Who We Are" page content.
 * Plain, specific, human. No marketing jargon.
 * Rules:
 * - No em dashes (U+2014) or en dashes (U+2013).
 * - No banned buzzwords.
 * - No emojis.
 * - All numbers and claims reflect real code and config.
 * - Strict word budget:
 *   - Headings <= 8 words
 *   - Paragraphs <= 2 sentences or <= 40 words
 *   - Section total body <= 60 words (team bios & legal links excluded)
 */

export const WHO_CONFIG = {
  meta: {
    title: 'AlgoArena | Who We Are',
    description: 'The engineers and architectural principles behind AlgoArena: real-time 1v1 competitive coding duels settled by Elo.',
    canonical: 'https://algoarena.dev/who-we-are',
  },

  w1Intro: {
    kicker: '01 / ORIGIN',
    title: 'Four developers. One arena.',
    lead: 'Two coders receive the same problem at the exact same millisecond, and the first accepted solution claims the win.',
    rotateHint: 'Drag to rotate',
    // Live stats (if available from stats endpoint; null means block is hidden)
    stats: null, // [TODO: owner to fill: live platform statistics or problems solved count]
  },

  w2Team: {
    kicker: '02 / THE TEAM',
    title: 'Engineered by four developers.',
    subtitle: 'Architected and operated without external funding.',
    members: [
      {
        id: 'ayush',
        name: 'Ayush Raj',
        initials: 'AR',
        role: 'Lead Architect & Full-Stack Engineer',
        statement: 'Built the real-time duel engine, matchmaking state machine, and core design system.',
        photo: '/devs/dev4.jpg',
        email: 'ayush@algoarena.dev',
        links: [
          { label: 'GitHub', url: 'https://github.com/ayushoncode' },
          { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ayush-raj-62a638344/' },
          { label: 'Portfolio', url: 'https://ayush-portfolio-w.vercel.app/' },
        ],
      },
      {
        id: 'varnit',
        name: 'Varnit Pal',
        initials: 'VP',
        role: 'Full-Stack & Arena Systems',
        statement: 'Engineered WebSocket synchronization, client duel telemetry, and match state recovery.',
        photo: '/devs/dev1.jpg',
        email: 'varnit@algoarena.dev',
        links: [
          { label: 'GitHub', url: 'https://github.com/varnitt' },
          { label: 'LinkedIn', url: 'https://www.linkedin.com/in/varnit-pal-69b6b830a/' },
        ],
      },
      {
        id: 'shreshth',
        name: 'Shreshth Agrawal',
        initials: 'SA',
        role: 'Sandbox & Security Specialist',
        statement: 'Built isolated Docker judge runners, execution limits, and automated verification suites.',
        photo: '/devs/dev2.jpg',
        email: 'shreshth@algoarena.dev',
        links: [
          { label: 'GitHub', url: 'https://github.com/Shreshth114' },
          { label: 'LinkedIn', url: 'https://www.linkedin.com/in/shreshth-agrawal-115678248/' },
        ],
      },
      {
        id: 'nayvedya',
        name: 'Nayvedya Shrivastava',
        initials: 'NS',
        role: 'Full-Stack Developer',
        statement: 'Engineered responsive interface components, duel lobby interactions, and reactive states.',
        photo: '/devs/dev3.jpg',
        email: 'nayvedya@algoarena.dev',
        links: [
          { label: 'GitHub', url: 'https://github.com/letsjoyn' },
          { label: 'LinkedIn', url: 'https://www.linkedin.com/in/letsjoyn/' },
          { label: 'Portfolio', url: 'https://nayvedya-shrivastava.vercel.app/' },
        ],
      },
    ],
  },

  w3Story: {
    kicker: '03 / STORY',
    title: 'From delayed queues to live duels.',
    storySentence: 'We built AlgoArena to replace slow batch submission queues with synchronous head-to-head duels.',
    milestones: [
      {
        date: 'Q1 2026',
        title: 'Architecture',
        sentence: 'Initial design for synchronous head-to-head competitive coding duels.',
      },
      {
        date: 'Q2 2026',
        title: 'Sandbox',
        sentence: 'Isolated Docker runners built with strict memory, CPU, and network boundaries.',
      },
      {
        date: 'Q3 2026',
        title: 'First Duel',
        sentence: 'First live match completed over WebSockets with synchronized clocks.',
      },
      {
        date: 'Q4 2026',
        title: 'Delta Sync',
        sentence: 'State synchronization optimized to stream editor telemetry without latency spikes.',
      },
    ],
  },

  w4Principles: {
    kicker: '04 / PRINCIPLES',
    title: 'Deterministic rules of the arena.',
    subtitle: 'Four non-negotiable guarantees governing every match.',
    items: [
      {
        id: 'dispatch',
        number: '01',
        title: 'Synchronous Dispatch',
        sentence: 'Both competitors receive the exact same problem statement and test criteria simultaneously.',
        proof: 'Verified in backend/socket/match.js',
      },
      {
        id: 'sandbox',
        number: '02',
        title: 'Isolated Containers',
        sentence: 'Untrusted submissions execute inside Linux containers with 256MB memory and 0.5 CPU caps.',
        proof: 'Verified in workers/sandbox.js',
      },
      {
        id: 'elo',
        number: '03',
        title: 'Open Elo Standard',
        sentence: 'Ratings update deterministically using a public logistic curve after every completed duel.',
        proof: 'Verified in backend/utils/elo.js',
      },
      {
        id: 'fairplay',
        number: '04',
        title: 'Deterministic Test Suite',
        sentence: 'Matches settle only when all test cases pass within the execution limit.',
        proof: 'Verified in backend/socket/match.js',
      },
    ],
  },

  w5Stack: {
    kicker: '05 / STACK',
    title: 'The Production Stack',
    repoUrl: 'https://github.com/ayushoncode/AlgoArena',
    techSpecs: [
      { label: 'Frontend', value: 'React 18 with Vite' },
      { label: 'Realtime', value: 'Socket.io WebSockets' },
      { label: 'Sandbox', value: 'Docker with cgroups' },
      { label: 'Server', value: 'Node.js and Express' },
      { label: 'Database', value: 'PostgreSQL with Prisma' },
      { label: 'Typography', value: 'Sora and JetBrains Mono' },
    ],
  },

  w6Contact: {
    kicker: '06 / RESPONSIBLE USE',
    title: 'Fair play and contact.',
    body: 'Report sandbox discrepancies, security issues, or collusion directly to the maintainers.',
    email: 'team@algoarena.dev',
    ctaText: 'Enter the arena',
    ctaNote: 'Create an account to join Season 1 ranked matchmaking.',
  },
}
