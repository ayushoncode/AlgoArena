/**
 * frontend/src/content/premium.js
 *
 * Single source of truth for Premium product definitions, pricing,
 * and feature comparison rows on the client.
 */

export const PREMIUM_CONFIG = {
  planName: 'Premium',
  billingPeriod: 'monthly',
  currency: 'INR',
  currencySymbol: '₹',
  
  // Prices in paise
  standardPricePaise: 5000,
  launchPricePaise: 3900,

  // Formatted display values (in rupees)
  standardPriceDisplay: '50',
  launchPriceDisplay: '39',

  // Launch offer limits
  totalLaunchSlots: 100,

  // Tax disclosure: set to true only when inclusive of applicable taxes
  // [TODO: owner to confirm GST registration status and tax inclusion]
  taxesIncluded: false,

  // A2Z sheet branding (default generic label, no personal names or photos without permission)
  sheetFeatureLabel: 'A2Z Sheet',

  // Support / billing contact
  supportEmail: 'support@algoarena.io',

  // Feature comparison rows (data driven: status 'live' | 'comingSoon' | 'hidden')
  features: [
    {
      id: 'quick_arena',
      name: '1v1 Quick Arena matches',
      description: 'System-assigned problem on chosen topic and difficulty',
      free: 'Included',
      premium: 'Included',
      status: 'live'
    },
    {
      id: 'private_duel',
      name: 'Private Duels',
      description: 'Custom room creation and room code entry with peers',
      free: 'Included',
      premium: 'Included',
      status: 'live'
    },
    {
      id: 'leaderboard_ratings',
      name: 'Elo rating and leaderboard rankings',
      description: 'Transparent rating adjustments based on duel outcomes',
      free: 'Included',
      premium: 'Included',
      status: 'live'
    },
    {
      id: 'intel_reports',
      name: 'Intel Reports access',
      description: 'Read and write interview experience debriefs',
      free: 'Included',
      premium: 'Included',
      status: 'live'
    },
    {
      id: 'a2z_sheet',
      name: 'Curated A2Z Sheet curriculum',
      description: 'Structured topic breakdown and problem indexing',
      free: 'Not included',
      premium: 'Included',
      status: 'live'
    },
    {
      id: 'sheet_1v1',
      name: 'Sheet-based 1v1 battles',
      description: 'Challenge opponents on questions chosen question by question',
      free: 'Not included',
      premium: 'Included',
      status: 'live'
    },
    {
      id: 'premium_badge',
      name: 'Premium member badge',
      description: 'Minimal badge displayed beside username on profile and standings',
      free: 'Not included',
      premium: 'Included',
      status: 'live'
    },
    {
      id: 'discussion_rooms',
      name: 'Discussion rooms',
      description: 'Post-duel problem analysis rooms',
      free: 'Not included',
      premium: 'Coming soon',
      status: 'comingSoon'
    },
    {
      id: 'global_chat',
      name: 'Global chat',
      description: 'Real-time arena community communication',
      free: 'Not included',
      premium: 'Coming soon',
      status: 'comingSoon'
    },
    {
      id: 'voice_chat',
      name: 'Live voice communication',
      description: 'Audio channel with your duel opponent',
      free: 'Not included',
      premium: 'Coming soon',
      status: 'comingSoon'
    }
  ],

  // Frequently Asked Questions
  faq: [
    {
      q: 'What is included in the Premium subscription?',
      a: 'Premium provides access to the full A2Z Sheet curriculum and enables 1v1 battles on individual sheet questions chosen question by question, plus a Premium badge on your profile and leaderboard entries.'
    },
    {
      q: 'Does Premium grant any competitive advantage?',
      a: 'No. AlgoArena operates under a strict fairness rule. Premium never alters Elo rating calculations, matchmaking priority, test runner quotas, problem difficulty, or judge execution.'
    },
    {
      q: 'How does the launch price work?',
      a: 'The first 100 paying subscribers receive the launch price of 39 per month. Your rate remains 39 per month for as long as your subscription remains active and unbroken. If cancelled or allowed to lapse, standard pricing applies upon re-subscribing.'
    },
    {
      q: 'How does billing and cancellation work?',
      a: 'Subscriptions renew monthly through Razorpay. You can cancel at any time from your billing page. When you cancel, access remains active until the end of your paid billing period.'
    },
    {
      q: 'What happens to my account if my subscription ends?',
      a: 'All duel history, earned Elo ratings, Intel Reports, bookmarks, and profile data remain intact. Only Premium-specific access is paused.'
    },
    {
      q: 'What is the refund policy?',
      a: 'Subscription refund requests are subject to our refund policy. Please visit the Refund Policy page or contact support@algoarena.io for assistance.'
    },
    {
      q: 'Who can subscribe?',
      a: 'Users must be at least 18 years of age, or have the consent and supervision of a parent or legal guardian in accordance with our Terms of Service.'
    }
  ]
}

