-- Migration: Update iteration outcome enum from REVISION_REQUIRED to REJECTED
-- This makes the iteration outcome semantically correct: iterations are approved or rejected
-- The ticket status remains REVISION_REQUIRED (which is the correct status when revision is needed)

-- Step 1: Drop the existing check constraint
ALTER TABLE ticket_iterations DROP CONSTRAINT IF EXISTS ticket_iterations_outcome_check;

-- Step 2: Update any existing REVISION_REQUIRED values to REJECTED (for data consistency)
UPDATE ticket_iterations SET outcome = 'REJECTED' WHERE outcome = 'REVISION_REQUIRED';

-- Step 3: Add the new check constraint with REJECTED instead of REVISION_REQUIRED
ALTER TABLE ticket_iterations ADD CONSTRAINT ticket_iterations_outcome_check CHECK (outcome IN ('PENDING', 'APPROVED', 'REJECTED'));
