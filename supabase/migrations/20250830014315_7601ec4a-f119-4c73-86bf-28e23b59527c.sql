
-- First, let's see what constraints exist on the payments table
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM 
    pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_namespace nsp ON nsp.oid = con.connamespace
WHERE 
    nsp.nspname = 'public' 
    AND rel.relname = 'payments'
    AND con.contype = 'c';

-- Drop ALL check constraints on payout_status
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE nsp.nspname = 'public' 
        AND rel.relname = 'payments'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%payout_status%'
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS ' || constraint_rec.conname;
    END LOOP;
END $$;

-- Add the correct check constraint
ALTER TABLE public.payments ADD CONSTRAINT check_payout_status 
CHECK (payout_status IN ('pending', 'paid_out'));
