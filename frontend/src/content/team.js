/**
 * AlgoArena — Team & Origin Content Config
 * ─────────────────────────────────────────────────────────────
 * Updated with real team member details, profiles, and portfolios.
 */

export const team = [
  {
    id: 1,
    name: "Ayush Raj",
    classTitle: "Architect",
    role: "Lead Architect, AI & Full-Stack Engineer, UI/UX Designer",
    quote: "We built this arena so true algorithmic skill determines the champion, second by second.",
    signatureMove: "Engineered cyberpunk HUD design system, duel stage UI & AI full-stack core",
    focusAreas: [
      { label: "AI & Full-Stack", value: 98 },
      { label: "UI/UX Design", value: 96 },
      { label: "Arena Architecture", value: 94 }
    ],
    photo: "/devs/dev4.jpg",
    focalPoint: "50% 30%",
    links: {
      github: "https://github.com/ayushoncode",
      linkedin: "https://www.linkedin.com/in/ayush-raj-62a638344/",
      site: "https://ayush-portfolio-w.vercel.app/"
    }
  },
  {
    id: 2,
    name: "Varnit Pal",
    classTitle: "Vanguard",
    role: "Full-Stack & Arena Systems",
    quote: "Code dueling should feel as intense and immediate as an esports tournament.",
    signatureMove: "Architected WebSocket synchronization & live battle telemetry",
    focusAreas: [
      { label: "WebSocket Core", value: 94 },
      { label: "Frontend State", value: 92 },
      { label: "API Infrastructure", value: 86 }
    ],
    photo: "/devs/dev1.jpg",
    focalPoint: "50% 25%",
    links: {
      github: "https://github.com/varnitt",
      linkedin: "https://www.linkedin.com/in/varnit-pal-69b6b830a/",
      site: ""
    }
  },
  {
    id: 3,
    name: "Shreshth Agrawal",
    classTitle: "Sentinel",
    role: "Sandbox & Security Specialist",
    quote: "Running untrusted code safely in milliseconds is zero-compromise engineering.",
    signatureMove: "Built Docker judge container isolation & automated test verification",
    focusAreas: [
      { label: "Docker Sandboxing", value: 96 },
      { label: "Security Isolation", value: 91 },
      { label: "Judge Execution", value: 89 }
    ],
    photo: "/devs/dev2.jpg",
    focalPoint: "50% 35%",
    links: {
      github: "https://github.com/Shreshth114",
      linkedin: "https://www.linkedin.com/in/shreshth-agrawal-115678248/",
      site: ""
    }
  },
  {
    id: 4,
    name: "Nayvedya Shrivastava",
    classTitle: "Interface",
    role: "Full-Stack Developer",
    quote: "Crafting reactive components and low-latency interaction streams.",
    signatureMove: "Engineered responsive UI components & interactive web application systems",
    focusAreas: [
      { label: "Frontend Engineering", value: 95 },
      { label: "Reactive Components", value: 92 },
      { label: "Web Applications", value: 90 }
    ],
    photo: "/devs/dev3.jpg",
    focalPoint: "50% 30%",
    links: {
      github: "https://github.com/letsjoyn",
      linkedin: "https://www.linkedin.com/in/letsjoyn/",
      site: "https://nayvedya-shrivastava.vercel.app/"
    }
  }
];

export const origin = [
  {
    phase: "PHASE 01",
    date: "Q1 2026",
    title: "The Spark",
    text: "We were tired of slow, asynchronous coding platforms. We wanted instant 1v1 battles with live code telemetry and real stakes.",
    tag: "Idea"
  },
  {
    phase: "PHASE 02",
    date: "Q2 2026",
    title: "The Sandbox",
    text: "Engineered low-latency Docker execution runners capable of evaluating C++, Java, Python, and JS submissions in milliseconds.",
    tag: "Prototype"
  },
  {
    phase: "PHASE 03",
    date: "Q3 2026",
    title: "First Live Duel",
    text: "Ran the first real-time WebSocket match between developers. The adrenaline of watching code run side-by-side proved the concept.",
    tag: "First Duel"
  },
  {
    phase: "PHASE 04",
    date: "Q4 2026",
    title: "What We Got Wrong",
    text: "Our initial WebSocket protocol flooded clients during rapid typing. We re-engineered state delta sync from scratch to reduce packet overhead.",
    tag: "Lesson Learned"
  }
];

export const stats = [
  { label: "Curated Problems", value: 175 },
  { label: "Execution Languages", value: 4 },
  { label: "Target Latency", value: "<25ms" },
  { label: "Elo K-Factor", value: 32 }
];

export const stack = [
  "React 18",
  "Node.js",
  "WebSockets",
  "Docker",
  "PostgreSQL",
  "Tailwind CSS",
  "Framer Motion",
  "Lucide React",
  "Vite Core",
  "Express API"
];

export const story = {
  headline: "Four Devs. One Arena.",
  subline: "We built AlgoArena because competitive programming needed real-time 1v1 intensity, instant feedback, and modern HUD design.",
  repoUrl: "https://github.com/ayushoncode/AlgoArena"
};
