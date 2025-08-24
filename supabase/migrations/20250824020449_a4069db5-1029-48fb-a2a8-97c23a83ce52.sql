
-- Phase 1: Add new wallet address fields to users table
ALTER TABLE users 
ADD COLUMN payout_address_cardano TEXT,
ADD COLUMN payout_address_bsc TEXT,
ADD COLUMN payout_address_sui TEXT;

-- Add payment method field to services table
ALTER TABLE services 
ADD COLUMN payment_method TEXT DEFAULT 'ethereum_usdc';

-- Create new payments table for tracking manual payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  creator_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  booking_id UUID REFERENCES bookings(id),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('service_booking', 'creator_tier')),
  network TEXT NOT NULL CHECK (network IN ('ethereum', 'solana', 'cardano', 'bsc', 'sui')),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USDC', 'USDM')),
  tx_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT payments_service_or_tier_check CHECK (
    (payment_type = 'service_booking' AND service_id IS NOT NULL AND booking_id IS NOT NULL) OR
    (payment_type = 'creator_tier' AND service_id IS NULL AND booking_id IS NULL)
  )
);

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments table
CREATE POLICY "Users can view their own payments" 
  ON payments 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = creator_id);

CREATE POLICY "Users can create their own payments" 
  ON payments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to payments" 
  ON payments 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Add indexes for better performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_creator_id ON payments(creator_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);
CREATE INDEX idx_payments_network ON payments(network);
