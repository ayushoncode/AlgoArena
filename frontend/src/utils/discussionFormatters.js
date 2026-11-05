/**
 * frontend/src/utils/discussionFormatters.js
 *
 * Lightweight, dependency-free formatters for Discussion Rooms.
 * Formats time, topics, and difficulty labels cleanly.
 */

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function formatMonoTimestamp(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
}

export function getDifficultyColor(difficulty) {
  const norm = String(difficulty || '').toLowerCase().trim();
  if (norm === 'easy') return 'text-emerald-400';
  if (norm === 'hard') return 'text-rose-400';
  return 'text-amber-400';
}

export function getTypeBadgeStyle(type) {
  switch (type) {
    case 'Question':
      return {
        bg: 'rgba(56, 189, 248, 0.1)',
        border: 'rgba(56, 189, 248, 0.25)',
        text: '#38bdf8'
      };
    case 'Approach':
      return {
        bg: 'rgba(168, 85, 247, 0.1)',
        border: 'rgba(168, 85, 247, 0.25)',
        text: '#c084fc'
      };
    case 'Hint':
      return {
        bg: 'rgba(234, 179, 8, 0.1)',
        border: 'rgba(234, 179, 8, 0.25)',
        text: '#facc15'
      };
    case 'Solution':
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.25)',
        text: '#34d399'
      };
    default:
      return {
        bg: 'rgba(148, 163, 184, 0.1)',
        border: 'rgba(148, 163, 184, 0.25)',
        text: '#94a3b8'
      };
  }
}
