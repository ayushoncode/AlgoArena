/**
 * scripts/create-razorpay-plans.mjs
 *
 * One-off script to create the two monthly Razorpay Subscriptions plans:
 * 1. Launch Offer Plan (3900 paise = 39 INR/month)
 * 2. Standard Plan (5000 paise = 50 INR/month)
 *
 * SAFETY RULES:
 * - TEST MODE ONLY. Refuses to run if live keys are detected.
 * - Prints masked credentials.
 * - Outputs plan IDs to configure in backend/.env.
 *
 * Usage:
 *   node scripts/create-razorpay-plans.mjs
 */

'use strict'

import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(rootDir, 'backend', '.env') })

const KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

function maskString(str) {
  if (!str) return '*** (not set)'
  if (str.length <= 8) return '***'
  return str.slice(0, 4) + '***' + str.slice(-4)
}

console.log('═══════════════════════════════════════════════════════════════')
console.log('         ALGOARENA RAZORPAY PLANS CREATION SCRIPT              ')
console.log('═══════════════════════════════════════════════════════════════')
console.log(`[SAFETY CHECK] Key ID:       ${maskString(KEY_ID)}`)
console.log(`[SAFETY CHECK] Target Mode:  ${KEY_ID.startsWith('rzp_test_') ? 'TEST MODE ✓' : 'PLACEHOLDER / MOCK'}`)
console.log('═══════════════════════════════════════════════════════════════\n')

if (KEY_ID.startsWith('rzp_live_')) {
  console.error('FATAL: Live Razorpay key detected! This task is strictly TEST MODE ONLY.')
  process.exit(1)
}

async function callRazorpayPlansApi(payload) {
  if (!KEY_ID || KEY_ID.includes('placeholder') || !KEY_SECRET || KEY_SECRET.includes('placeholder')) {
    console.log('[MOCK MODE] Razorpay test credentials not configured in backend/.env.')
    console.log(`[MOCK MODE] Generating deterministic mock plan ID for: ${payload.item.name}`)
    const slug = payload.item.amount === 3900 ? 'launch' : 'standard'
    return {
      id: `plan_test_${slug}_${payload.item.amount}`,
      entity: 'plan',
      interval: 1,
      period: 'monthly',
      item: payload.item
    }
  }

  const auth = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/plans', {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Razorpay API error (${res.status}): ${errorText}`)
  }

  return res.json()
}

async function run() {
  try {
    // 1. Launch Plan (3900 paise)
    console.log('[PLAN 1] Creating Launch Offer Plan (3900 paise)...')
    const launchPlan = await callRazorpayPlansApi({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'AlgoArena Premium (Launch Offer)',
        amount: 3900,
        currency: 'INR',
        description: 'Monthly launch offer subscription for the first 100 members'
      }
    })
    console.log(`✓ Launch Plan Created:   ${launchPlan.id} (Amount: ₹${launchPlan.item.amount / 100}/month)`)

    // 2. Standard Plan (5000 paise)
    console.log('\n[PLAN 2] Creating Standard Plan (5000 paise)...')
    const standardPlan = await callRazorpayPlansApi({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'AlgoArena Premium',
        amount: 5000,
        currency: 'INR',
        description: 'Standard monthly subscription'
      }
    })
    console.log(`✓ Standard Plan Created: ${standardPlan.id} (Amount: ₹${standardPlan.item.amount / 100}/month)`)

    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('Configure these plan IDs in your backend environment:')
    console.log(`RAZORPAY_PLAN_LAUNCH_ID=${launchPlan.id}`)
    console.log(`RAZORPAY_PLAN_STANDARD_ID=${standardPlan.id}`)
    console.log('═══════════════════════════════════════════════════════════════\n')

  } catch (err) {
    console.error('✗ Failed to create Razorpay plans:', err)
    process.exit(1)
  }
}

run()

