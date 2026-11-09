/**
 * frontend/src/content/social.js
 *
 * Client-side configuration and strings for AlgoArena Friends & Notifications.
 * Adheres strictly to plain, concrete copy rules:
 * - No emoji
 * - No em dashes or en dashes
 * - No marketing buzzwords
 */

export const SOCIAL_CONFIG = {
  maxFriends: 200,
  maxPendingOutgoing: 20,
  maxRequestsPer24Hours: 30,
  declineCooldownDays: 14,
  requestExpiryDays: 60,

  privacy: {
    allowRequests: [
      { id: 'everyone', label: 'Everyone', desc: 'Any signed in competitor can send you a request.' },
      { id: 'nobody', label: 'Nobody', desc: 'No one can send you a request. Existing friends stay connected.' }
    ],
    friendsVisibility: [
      { id: 'signed_in', label: 'Signed in players', desc: 'Any signed in member can view your friends list.' },
      { id: 'friends_only', label: 'Friends only', desc: 'Only players on your friends list can see your friends.' },
      { id: 'only_me', label: 'Only me', desc: 'Your friends list is hidden from everyone.' }
    ],
    mutedTypes: [
      { id: 'friend_request', label: 'Friend requests' },
      { id: 'friend_accepted', label: 'Accepted requests' },
      { id: 'discussion_reply', label: 'Discussion replies' }
    ]
  },

  copy: {
    addFriend: 'Add friend',
    sending: 'Sending...',
    requestSent: 'Request sent',
    cancelRequest: 'Cancel',
    accept: 'Accept',
    decline: 'Decline',
    friends: 'Friends',
    unfriend: 'Unfriend',
    block: 'Block',
    unblock: 'Unblock',
    unfriendConfirm: 'Remove from your friends list?',
    blockConfirm: 'Block this player? They will not be able to send requests or view your friends.',
    noFriendsSelf: 'No friends yet. Find competitors on the leaderboard or search roster.',
    noFriendsOther: 'No friends to show.',
    privateFriends: 'keeps their friends private.',
    allCaughtUp: 'You are all caught up.',
    markAllRead: 'Mark all as read',
    notificationCenterTitle: 'Notifications',
    errorRetry: 'Could not load. Please try again.',
    offlineNotice: 'You are currently offline. Reconnecting...'
  }
};
