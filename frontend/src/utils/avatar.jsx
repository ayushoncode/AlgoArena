import { useState } from 'react'

/**
 * avatar.jsx — Illustrated Boy & Girl Character Avatars for AlgoArena
 * Powered by high-definition vector personas with gender detection & offline fallback
 */

const FEMALE_HINTS = [
  'priya', 'pooja', 'puja', 'sneha', 'ananya', 'riya', 'neha', 'divya', 'shreya',
  'kavya', 'swati', 'aditi', 'tanya', 'sonam', 'muskan', 'megha', 'isha', 'rashmi',
  'simran', 'kriti', 'pallavi', 'shikha', 'bhavna', 'mona', 'deepa', 'sakshi',
  'anushka', 'khushi', 'chhavi', 'geeta', 'seema', 'radha', 'rita', 'sara', 'emma',
  'olivia', 'sophia', 'chloe', 'mia', 'lily', 'grace', 'anna', 'lucy', 'maya', 'zara',
  'girl', 'queen', 'she', 'her', 'miss', 'lady', 'princess', 'female', 'woman', 'babe',
  'cutie', 'angel', 'barbie', 'damsel', 'devika', 'tanvi', 'ishita', 'navya', 'diya'
]

const MALE_HINTS = [
  'ayush', 'rahul', 'aman', 'alex', 'raj', 'rohit', 'amit', 'abhishek', 'vikas',
  'ankit', 'shivam', 'saurabh', 'varun', 'arjun', 'karan', 'aditya', 'mayank',
  'prateek', 'deepak', 'ashish', 'pankaj', 'manish', 'sachin', 'vishal', 'nitish',
  'harsh', 'yash', 'tushar', 'rohan', 'kunal', 'gaurav', 'vivek', 'nikhil', 'alok',
  'boy', 'king', 'mr', 'he', 'him', 'prince', 'lord', 'man', 'bro', 'dude', 'guy',
  'hero', 'sir', 'chad', 'bhai', 'bhaiya', 'kumar', 'singh', 'sharma', 'leo', 'max'
]

/**
 * Detect gender heuristic from username
 */
export function detectGender(username = '') {
  const clean = String(username || '').toLowerCase().trim()
  if (!clean) return 'neutral'

  for (const hint of FEMALE_HINTS) {
    if (clean.includes(hint)) return 'female'
  }
  for (const hint of MALE_HINTS) {
    if (clean.includes(hint)) return 'male'
  }

  // Name ending heuristic for Indian/Latin female names (ending in 'a', 'i', 'ya', 'ka', 'ti', 'ni', 'shi')
  if (/(ya|ika|ita|ani|ali|oti|shree|priya|ina|ana|ara|ika|ushi)$/.test(clean)) {
    return 'female'
  }

  return 'male' // default coder persona
}

/**
 * Get distinct illustrated avatar image URL based on username, gender, seed & style
 */
export function getUserAvatarUrl(username = '', customSeed = null, customStyle = null) {
  const clean = String(username || 'coder').toLowerCase().trim()
  const gender = detectGender(clean)
  const effectiveSeed = (customSeed && customSeed !== 'bot' && customSeed !== 'default') ? customSeed : clean
  const seed = encodeURIComponent(effectiveSeed)
  let style = customStyle || (gender === 'female' ? 'lorelei' : 'adventurer')

  // Map legacy default 'bottts' to illustrated character face for consistency
  if (style === 'bottts' || style === 'bot') {
    style = gender === 'female' ? 'lorelei' : 'adventurer'
  }

  if (style === 'lorelei') {
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=ffd5dc,ffdfbf,c0aede,b6e3f4`
  }
  if (style === 'notionists') {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=ffd5dc,ffdfbf,c0aede,b6e3f4`
  }
  if (style === 'pixel-art') {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`
  }

  // Default: adventurer
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`
}

/**
 * Emoji persona fallback if image fails or for inline text badges
 */
export function getUserEmoji(username = '') {
  const gender = detectGender(username)
  return gender === 'female' ? '👧' : '👦'
}

export const RANK_TIERS = [
  { name: 'Recruit', min: 0, max: 1199, col: '#94a3b8', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', glow: 'rgba(100,116,139,0.2)' },
  { name: 'Operative', min: 1200, max: 1399, col: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.25)' },
  { name: 'Vanguard', min: 1400, max: 1599, col: '#38BDF8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)', glow: 'rgba(56,189,248,0.25)' },
  { name: 'Champion', min: 1600, max: 1799, col: '#818cf8', bg: 'rgba(129,140,248,0.14)', border: 'rgba(129,140,248,0.35)', glow: 'rgba(129,140,248,0.3)' },
  { name: 'Legend', min: 1800, max: 9999, col: '#F5B942', bg: 'rgba(245,185,66,0.14)', border: 'rgba(245,185,66,0.35)', glow: 'rgba(245,185,66,0.35)' },
]

export function getTier(elo) {
  const rating = Number(elo) || 1200
  return RANK_TIERS.find(t => rating >= t.min && rating <= t.max) || RANK_TIERS[0]
}

/**
 * Illustrated Avatar Component with rounded border, glow, and fallback initial
 */
export function UserAvatar({ username = '', seed = null, style = null, elo = null, size = 32, className = '', isMe = false }) {
  const [imgErr, setImgErr] = useState(false)
  const avatarUrl = getUserAvatarUrl(username, seed, style)
  const gender = detectGender(username)
  const initial = (username?.[0] ?? (gender === 'female' ? 'G' : 'B')).toUpperCase()

  const tier = elo != null ? getTier(elo) : null
  const isPink = gender === 'female' || style === 'lorelei'
  const borderColor = tier
    ? tier.col
    : isMe
      ? '#38BDF8'
      : isPink
        ? '#f43f5e'
        : '#38BDF8'

  const bg = tier
    ? tier.bg
    : isMe
      ? 'rgba(56,189,248,0.1)'
      : isPink
        ? 'rgba(244,63,94,0.1)'
        : 'rgba(56,189,248,0.1)'

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden relative select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size > 48 ? 12 : 6,
        border: `1.5px solid ${borderColor}`,
        background: bg,
        boxShadow: `0 0 10px ${borderColor}33`,
      }}
      title={`@${username} (${tier ? tier.name : 'Player'})`}
    >
      {!imgErr ? (
        <img
          key={avatarUrl}
          src={avatarUrl}
          alt={username}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <span
          className="font-mono font-bold"
          style={{
            fontSize: Math.round(size * 0.45),
            color: borderColor,
          }}
        >
          {initial}
        </span>
      )}
    </div>
  )
}

export default UserAvatar

/** Alias for getTier — used by shared UI components */
export const getArenaTier = getTier
