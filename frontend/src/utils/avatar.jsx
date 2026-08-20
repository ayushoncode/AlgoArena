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
 * Get distinct illustrated avatar image URL based on username & gender
 */
export function getUserAvatarUrl(username = '') {
  const clean = String(username || 'coder').toLowerCase().trim()
  const gender = detectGender(clean)
  const encoded = encodeURIComponent(clean)

  if (gender === 'female') {
    // Lorelei / Adventurer female avatars
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encoded}&backgroundColor=ffd5dc,ffdfbf,c0aede,b6e3f4`
  }

  // Adventurer / Avataaars male avatars
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encoded}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`
}

/**
 * Emoji persona fallback if image fails or for inline text badges
 */
export function getUserEmoji(username = '') {
  const gender = detectGender(username)
  return gender === 'female' ? '👧' : '👦'
}

/**
 * Illustrated Avatar Component with rounded border, glow, and fallback initial
 */
export function UserAvatar({ username = '', size = 32, className = '', isMe = false }) {
  const [imgErr, setImgErr] = useState(false)
  const avatarUrl = getUserAvatarUrl(username)
  const gender = detectGender(username)
  const initial = (username?.[0] ?? (gender === 'female' ? 'G' : 'B')).toUpperCase()

  const isPink = gender === 'female'
  const borderColor = isMe
    ? '#f97316'
    : isPink
    ? '#f43f5e'
    : '#22d3ee'

  const bg = isMe
    ? 'rgba(249,115,22,0.1)'
    : isPink
    ? 'rgba(244,63,94,0.1)'
    : 'rgba(34,211,238,0.1)'

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden relative select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size > 48 ? 12 : 6,
        border: `1.5px solid ${borderColor}`,
        background: bg,
        boxShadow: isMe
          ? '0 0 10px rgba(249,115,22,0.25)'
          : isPink
          ? '0 0 10px rgba(244,63,94,0.2)'
          : '0 0 10px rgba(34,211,238,0.2)',
      }}
      title={`@${username} (${gender === 'female' ? 'Girl Persona' : 'Boy Persona'})`}
    >
      {!imgErr ? (
        <img
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
