-- Fix server migration state by removing failed migration record
-- This will allow migrations to proceed normally

-- Only execute if the _prisma_migrations table exists (server environment)
DO $$
BEGIN
    -- Check if the migration table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations') THEN
        -- Remove the failed migration record if it exists
        DELETE FROM "_prisma_migrations" 
        WHERE migration_name = '20251023123930_fix_tracker_schema' 
          AND finished_at IS NULL;

        -- Ensure the migration is marked as applied if it exists but failed
        UPDATE "_prisma_migrations" 
        SET finished_at = NOW(), 
            logs = 'Migration resolved via cleanup script' 
        WHERE migration_name = '20251023123930_fix_tracker_schema' 
          AND finished_at IS NULL;
    END IF;
END $$;