-- Fix maintester's data: they should have creator access if they have verified Creator Plus payment
-- First, let's find the actual username
DO $$
DECLARE
    test_user_id uuid;
    verified_payment_count int;
BEGIN
    -- Find the test user (could be maintester, testmaintester, etc.)
    SELECT id INTO test_user_id 
    FROM users 
    WHERE handle ILIKE '%maintester%' OR handle ILIKE '%test%'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Check if they have verified creator_tier payments
        SELECT COUNT(*) INTO verified_payment_count
        FROM payments 
        WHERE user_id = test_user_id 
        AND payment_type = 'creator_tier' 
        AND status = 'verified';
        
        -- If they have verified payments, restore their creator access
        IF verified_payment_count > 0 THEN
            UPDATE users 
            SET role = 'creator', updated_at = now()
            WHERE id = test_user_id;
            
            -- Update or insert creator record
            INSERT INTO creators (user_id, tier, approved, updated_at)
            VALUES (test_user_id, 'plus', true, now())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                approved = true,
                tier = CASE 
                    WHEN EXCLUDED.tier = 'pro' THEN 'pro'
                    ELSE 'plus'
                END,
                updated_at = now();
        END IF;
    END IF;
END $$;