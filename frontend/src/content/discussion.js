/**
 * frontend/src/content/discussion.js
 *
 * Client-side configuration and strings for Discussion Rooms.
 * Adheres strictly to plain, concrete copy rules:
 * - No emoji
 * - No em dashes or en dashes
 * - No marketing buzzwords
 */

export const DISCUSSION_CONFIG = {
  maxTitleLength: 120,
  maxThreadBodyLength: 4000,
  maxReplyBodyLength: 2000,
  maxReportNoteLength: 500,

  types: [
    { id: 'Question', label: 'Question', desc: 'Ask about a bug or test case.' },
    { id: 'Approach', label: 'Approach', desc: 'Discuss high level algorithms and complexity.' },
    { id: 'Hint', label: 'Hint', desc: 'Give direction without giving away the answer.' },
    { id: 'Solution', label: 'Solution', desc: 'Working code and full walkthrough.' }
  ],

  sortOptions: [
    { id: 'latest', label: 'Latest' },
    { id: 'helpful', label: 'Most helpful' },
    { id: 'unanswered', label: 'Unanswered' }
  ],

  reportCategories: [
    'Spam',
    'Harassment or hate',
    'Cheating or leaked answers',
    'Sharing private information',
    'Other'
  ],

  rulesLink: '/terms#discussion-rules',

  copy: {
    indexTitle: 'Discussions',
    indexSubtitle: 'Talk through problems after you play them.',
    emptyRooms: 'No discussions yet. Open a problem you played and start one.',
    emptyThreads: 'No posts in this room yet. Be the first to start a conversation.',
    errorRetry: 'Could not load discussions. Please try again.',
    matchLockedTitle: 'Locked during active match',
    matchLockedDesc: 'You are in a match on this problem. Discussion opens after it ends.',
    dailyHiddenTitle: 'Hidden until the daily challenge resets',
    dailyHiddenDesc: 'Solution posts for today\'s challenge are hidden until midnight UTC to maintain fair play.',
    showSolutionButton: 'Show solution',
    hideSolutionButton: 'Hide solution',
    autoSolutionNotice: 'Posts with code blocks longer than 5 lines are categorized as Solutions.',
    linkRuleNotice: 'Links are enabled for accounts older than 7 days.',
    postPending: 'Posting...',
    savePending: 'Saving...',
    deleteConfirm: 'Are you sure you want to delete this post? This cannot be undone.',
    reportSuccess: 'Report submitted for review. Thank you for keeping the room safe.',
    blockConfirm: 'Block this user? Their posts will no longer appear for you, and they cannot reply to your threads.',
    suspendedNotice: 'Your discussion access has been temporarily suspended.',
    rateLimitNotice: 'Posting too fast. Please wait before submitting again.',
    offlineNotice: 'You are currently offline. New posts and votes will not be sent.'
  }
};

