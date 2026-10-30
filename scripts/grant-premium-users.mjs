import pg from '../backend/node_modules/pg/lib/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const envFile = fs.readFileSync(path.join(__dirname, '..', 'backend', '.env'), 'utf8')
const match = envFile.match(/DATABASE_URL=([^\n]+)/)

const client = new Client({ connectionString: match[1] })

async function grant() {
  await client.connect()
  const url = new URL(match[1])
  const host = url.hostname
  const maskedHost = host.slice(0, 4) + '...' + host.slice(-8)
  console.log('[SAFETY] Target DB Host:', maskedHost)

  const targetUsers = [
    { username: 'ayushoncode', id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073' },
    { username: 'ayush_ayush', id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4' },
    { username: 'letsjoyn', id: '72dfb5eb-6b37-4ddd-8557-760283a78cb3' }
  ]

  for (const u of targetUsers) {
    console.log('Granting Premium to:', u.username, u.id)

    // Remove any previous test data
    await client.query('DELETE FROM payments WHERE subscription_id IN (SELECT id FROM subscriptions WHERE user_id = $1)', [u.id])
    await client.query('DELETE FROM subscriptions WHERE user_id = $1', [u.id])
    await client.query("UPDATE launch_slots SET user_id = NULL, subscription_id = NULL, status = 'released' WHERE user_id = $1", [u.id])

    // Insert active subscription
    const subRes = await client.query(`
      INSERT INTO subscriptions (
        user_id,
        razorpay_subscription_id,
        razorpay_plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        launch_slot
      ) VALUES ($1, $2, 'plan_launch_test', 'active', NOW(), NOW() + INTERVAL '1 year', false, true)
      RETURNING id, razorpay_subscription_id
    `, [u.id, 'sub_manual_' + u.username + '_' + Date.now().toString(36)])

    const subId = subRes.rows[0].id

    // Claim next free launch slot
    const slotRes = await client.query(`
      SELECT slot_number FROM launch_slots
      WHERE status = 'released' AND user_id IS NULL
      ORDER BY slot_number ASC
      LIMIT 1
      FOR UPDATE
    `)

    if (slotRes.rows.length > 0) {
      const slotNum = slotRes.rows[0].slot_number
      await client.query(`
        UPDATE launch_slots
        SET user_id = $1,
            subscription_id = $2,
            status = 'active',
            reserved_at = NOW(),
            updated_at = NOW()
        WHERE slot_number = $3
      `, [u.id, subId, slotNum])
      console.log('Assigned launch slot #' + slotNum + ' to ' + u.username)
    }

    // Insert captured payment for billing history
    await client.query(`
      INSERT INTO payments (
        razorpay_payment_id,
        subscription_id,
        amount,
        currency,
        status,
        captured_at
      ) VALUES ($1, $2, 3900, 'INR', 'captured', NOW())
      ON CONFLICT (razorpay_payment_id) DO NOTHING
    `, ['pay_manual_' + u.username + '_' + Date.now().toString(36), subId])
  }

  const occupied = await client.query("SELECT count(*) FROM launch_slots WHERE status IN ('reserved', 'active')")
  console.log('Occupied launch slots count now:', occupied.rows[0].count)
  console.log('Remaining spots:', 100 - parseInt(occupied.rows[0].count, 10))

  await client.end()
}

grant().catch(console.error)

