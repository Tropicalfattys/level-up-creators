-- Fix Maintester's data with correct tier value
DO $$
DECLARE
    maintester_user_id uuid;
    verified_payment_count int;
BEGIN
    -- Find Maintester user
    SELECT id INTO maintester_user_id 
    FROM users 
    WHERE handle = 'Maintester';
    
    IF maintester_user_id IS NOT NULL THEN
        -- Check if they have verified creator_tier payments  
        SELECT COUNT(*) INTO verified_payment_count
        FROM payments 
        WHERE user_id = maintester_user_id 
        AND payment_type = 'creator_tier' 
        AND status = 'verified';
        
        -- If they have verified payments, restore their creator access
        IF verified_payment_count > 0 THEN
            -- Update user role to creator
            UPDATE users 
            SET role = 'creator', updated_at = now()
            WHERE id = maintester_user_id;
            
            -- Update existing creator record with correct tier (mid not plus)
            UPDATE creators 
            SET approved = true, tier = 'mid', updated_at = now()
            WHERE user_id = maintester_user_id;
        END IF;
    END IF;
END $$;