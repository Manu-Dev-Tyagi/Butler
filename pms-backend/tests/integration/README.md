# Integration Tests

This directory contains integration tests for the ticket lifecycle system.

## Available Tests

### 1. Happy Path Test (`ticket_lifecycle_happy_path.test.ts`)
Tests the ideal ticket flow without revisions:
```
CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED
```

**Validates:**
- ✅ All state transitions work correctly
- ✅ Iteration 1 is created automatically on first submit
- ✅ FTR = TRUE (first time right, approved on first iteration)
- ✅ SLA success (delivered before deadline)
- ✅ Only 1 iteration exists (no revisions)

### 2. Revision Flow Test (`ticket_lifecycle_revision_flow.test.ts`)
Tests the ticket flow with one revision cycle:
```
CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → REVISION_REQUIRED
→ IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED
```

**Validates:**
- ✅ All state transitions work correctly through revision cycle
- ✅ Iteration 1 created on first submit (outcome = PENDING → REJECTED)
- ✅ Iteration 2 created on second submit (outcome = PENDING → APPROVED)
- ✅ FTR = FALSE (not first time right, took 2 iterations)
- ✅ Revision comments are captured
- ✅ Multiple iterations are tracked correctly

## Prerequisites

1. Backend server must be running:
```bash
npm run dev:api
# or
npm run dev:all
```

2. Database must be set up with migrations:
```bash
npm run migrate
```

## Running the Tests

### Run Happy Path Test
```bash
npm run test:integration:happy
```

### Run Revision Flow Test
```bash
npm run test:integration:revision
```

### Run All Integration Tests
```bash
npm run test:integration:all
```

### Run Manually with Custom API URL
```bash
API_URL=http://localhost:3000 ts-node -r tsconfig-paths/register tests/integration/ticket_lifecycle_happy_path.test.ts
```

## Test Output

Each test provides detailed console output showing:
- ✅ Step-by-step progress through the lifecycle
- ✅ Validation results for each transition
- ❌ Any errors or bugs detected
- ⚠️  Required fixes if issues are found

Example output:
```
🚀 Starting Ticket Lifecycle Happy Path Test...
============================================================
Testing: CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED
============================================================

📋 SETUP: Creating Test Data
------------------------------------------------------------
✅ Client created: abc123
✅ Project created: def456
✅ Employee created: ghi789
✅ PM created: jkl012

📝 STEP 1: Creating Ticket (Status: CREATED)
------------------------------------------------------------
✅ Ticket created with status: CREATED
✅ No iterations exist before submission (correct)

...

📊 TEST SUMMARY
============================================================
✅ ALL TESTS PASSED!
```

## What Gets Tested

### Data Creation
- Clients, Projects, Users (Employee & PM)
- Tickets with proper metadata

### State Transitions
- Each status change is validated
- Invalid transitions are caught

### Iteration Management
- Auto-creation on submit
- Outcome updates (PENDING → APPROVED/REJECTED)
- Multiple iterations for revision flows

### Business Logic
- FTR calculation (TRUE on iteration 1, FALSE on iteration 2+)
- Approval records
- Revision comments
- SLA tracking

## Expected Behavior

### Happy Path
- **1 iteration** created (iteration 1)
- Iteration 1 outcome: **PENDING → APPROVED**
- **FTR = TRUE**
- Final status: **CLOSED**

### Revision Flow
- **2 iterations** created (iteration 1 & 2)
- Iteration 1 outcome: **PENDING → REJECTED**
- Iteration 2 outcome: **PENDING → APPROVED**
- **FTR = FALSE**
- Final status: **CLOSED**

## Troubleshooting

### Test fails with connection error
- Ensure the backend server is running (`npm run dev:api`)
- Check that the API_URL is correct (default: http://localhost:3000)

### Test fails with database errors
- Run migrations: `npm run migrate`
- Check database connection in `.env` file

### Test fails on specific validation
- Read the error message carefully - it will indicate which validation failed
- Check the "FIXES NEEDED" section in the output for suggested fixes
- Review the backend code for the failing endpoint

## Adding New Tests

To add a new integration test:

1. Create a new file: `tests/integration/your_test_name.test.ts`
2. Follow the structure of existing tests
3. Add a script to `package.json`:
```json
"test:integration:yourtest": "ts-node -r tsconfig-paths/register tests/integration/your_test_name.test.ts"
```
4. Update this README with your test description

## Notes

- These are **integration tests** - they test the full system end-to-end
- They create real data in the database (use test/dev database, not production!)
- Each test is independent and creates its own test data
- Tests use unique timestamps in names to avoid conflicts
