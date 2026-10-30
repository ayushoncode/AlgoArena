-- migrate_premium_up.sql
-- Additive migration for AlgoArena Premium Plan
-- Creates plans, subscriptions, payments, webhook_events, and launch_slots

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id VARCHAR(64) UNIQUE NOT NULL,
  razorpay_plan_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  launch_slot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_payment_id VARCHAR(64) UNIQUE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  razorpay_subscription_id VARCHAR(64),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(32) NOT NULL,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_sub_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_sub_id ON payments(razorpay_subscription_id);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_event_id VARCHAR(64) UNIQUE NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  payload_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(razorpay_event_id);

CREATE TABLE IF NOT EXISTS launch_slots (
  slot_number INTEGER PRIMARY KEY CHECK (slot_number >= 1 AND slot_number <= 100),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('reserved', 'active', 'released')),
  reserved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_slots_status_reserved ON launch_slots(status, reserved_at);

-- Pre-seed 100 launch slots in 'released' state
INSERT INTO launch_slots (slot_number, status)
SELECT s, 'released'
FROM generate_series(1, 100) AS s
ON CONFLICT (slot_number) DO NOTHING;

-- Seed default plans
INSERT INTO plans (plan_id, name, amount, currency, billing_interval)
VALUES 
  ('plan_launch', 'Premium Launch Plan', 3900, 'INR', 'monthly'),
  ('plan_standard', 'Premium Standard Plan', 5000, 'INR', 'monthly')
ON CONFLICT (plan_id) DO NOTHING;

