/**
 * frontend/src/content/premium.js
 *
 * Single source of truth for Premium product definitions, pricing,
 * and feature cards on the client.
 */

export const PREMIUM_CONFIG = {
  planName: 'Premium',
  billingPeriod: 'monthly',
  currency: 'INR',
  currencySymbol: '₹',
  
  // Prices in paise
  standardPricePaise: 10000,
  launchPricePaise: 3900,

  // Formatted display values (in rupees)
  standardPriceDisplay: '100',
  launchPriceDisplay: '39',

  // Launch offer limits
  totalLaunchSlots: 100,

  // Tax disclosure: set to true only when inclusive of applicable taxes
  // When false or undefined, nothing about tax is printed
  pricesIncludeTax: false,

  // A2Z sheet branding (generic label, no personal names or photos without permission)
  sheetFeatureLabel: 'A2Z sheet with topic index',

  // Support / billing contact
  supportEmail: 'support@algoarena.io',

  // Free card copy
  freePlan: {
    name: 'Free',
    title: 'Play and climb',
    tagline: 'Standard matchmaking on all topics, room duels, and live leaderboard ratings.',
    priceDisplay: '0'
  },

  // Premium card copy
  premiumPlan: {
    name: 'Premium',
    title: 'Study the sheet, duel on it',
    tagline: 'Structured curriculum progression, question by question duels, and profile distinction.'
  },

  // Feature rows (data driven: status 'live' | 'comingSoon' | 'hidden')
  features: [
    // Free card features
    {
      id: 'quick_arena',
      icon: 'duel',
      name: 'Quick Arena duels on any topic',
      tier: 'free',
      status: 'live'
    },
    {
      id: 'private_duel',
      icon: 'room',
      name: 'Private duels with room codes',
      tier: 'free',
      status: 'live'
    },
    {
      id: 'leaderboard_ratings',
      icon: 'bars',
      name: 'Ratings and leaderboard',
      tier: 'free',
      status: 'live'
    },
    {
      id: 'intel_reports',
      icon: 'document',
      name: 'Read and write Intel Reports',
      tier: 'free',
      status: 'live'
    },

    // Premium card features (included)
    {
      id: 'a2z_sheet',
      icon: 'list',
      name: 'A2Z sheet with topic index',
      tier: 'premium',
      status: 'live'
    },
    {
      id: 'sheet_1v1',
      icon: 'arrows',
      name: '1v1 duels on sheet questions',
      tier: 'premium',
      status: 'live'
    },
    {
      id: 'premium_badge',
      icon: 'hexagon',
      name: 'Premium badge on your profile',
      tier: 'premium',
      status: 'live'
    },

    // Premium card features (coming later)
    {
      id: 'discussion_rooms',
      icon: 'chat',
      name: 'Discussion rooms',
      tier: 'premium',
      status: 'comingSoon'
    },
    {
      id: 'global_chat',
      icon: 'chat',
      name: 'Global chat',
      tier: 'premium',
      status: 'comingSoon'
    },
    {
      id: 'voice_chat',
      icon: 'voice',
      name: 'Live voice communication',
      tier: 'premium',
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
