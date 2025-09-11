-- Fix Maintester's data properly
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
            
            -- Check if creator record exists
            IF EXISTS (SELECT 1 FROM creators WHERE user_id = maintester_user_id) THEN
                -- Update existing creator record
                UPDATE creators 
                SET approved = true, tier = 'plus', updated_at = now()
                WHERE user_id = maintester_user_id;
            ELSE
                -- Insert new creator record
                INSERT INTO creators (user_id, tier, approved, updated_at)
                VALUES (maintester_user_id, 'plus', true, now());
            END IF;
        END IF;
    END IF;
END $$;