# Server Startup Fixes

## 🔧 Issue Fixed

**Problem:** Servers were restarting continuously with nodemon but not actually starting. This was caused by:
- Missing error handling during startup
- No database connection validation before starting
- Silent failures causing immediate process exit
- No clear error messages to diagnose issues

---

## ✅ Fixes Applied

### 1. **API Server (`apps/api/server.ts`)**

**Added:**
- ✅ Environment variable validation (`DATABASE_URL`, `JWT_SECRET`)
- ✅ Database connection check before starting HTTP server
- ✅ Clear error messages for common issues
- ✅ Port conflict detection and helpful messages
- ✅ Graceful error handling with detailed logging

**Changes:**
```typescript
// Now validates DATABASE_URL before imports
if (!process.env.DATABASE_URL) {
    console.error('[FATAL] DATABASE_URL is not set...');
    process.exit(1);
}

// Checks database connection before starting server
async function startServer() {
    const dbConnected = await checkConnection();
    if (!dbConnected) {
        // Shows helpful error messages
        process.exit(1);
    }
    // Only starts HTTP server if DB is connected
}
```

---

### 2. **Worker Server (`apps/worker/worker.ts`)**

**Added:**
- ✅ Environment variable validation (`DATABASE_URL`)
- ✅ Database connection check before starting worker
- ✅ Better error messages for connection issues
- ✅ Specific error handling for common database errors

**Changes:**
```typescript
// Validates DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('[WORKER] ❌ FATAL: DATABASE_URL is not set...');
    process.exit(1);
}

// Checks database connection with helpful errors
const dbConnected = await checkConnection();
if (!dbConnected) {
    // Shows specific troubleshooting steps
}
```

---

## 🚀 How to Use

### Start API Server:
```bash
cd pms-backend
npm run dev:api
```

**Expected Output (Success):**
```
[API] Checking database connection...
[DB-SUCCESS] Connected to database at 2026-01-13...
[PMS-BACKEND-API] 🚀 Server running on http://localhost:3000
[PMS-BACKEND-API] Health check: http://localhost:3000/health
```

**Expected Output (Failure):**
```
[FATAL] DATABASE_URL is not set in environment variables
Please create a .env file with DATABASE_URL=postgresql://...
```

OR

```
[API] Checking database connection...
[FATAL] Cannot connect to database. Please check:
1. PostgreSQL is running
2. DATABASE_URL is correct in .env file
3. Database exists and migrations are run
```

---

### Start Worker Server:
```bash
cd pms-backend
npm run dev:worker
```

**Expected Output (Success):**
```
----------------------------------------------------
⚙️  BUTLER BACKGROUND WORKER STARTING...
----------------------------------------------------
[WORKER] Checking database connectivity...
[WORKER] ✅ Database connected successfully at: 2026-01-13...
[WORKER] Setting up cron jobs...
[WORKER] 🚀 Worker is active and polling.
----------------------------------------------------
```

**Expected Output (Failure):**
```
[WORKER] ❌ FATAL: DATABASE_URL is not set in environment variables
Please create a .env file with DATABASE_URL=postgresql://...
```

---

## 🔍 Troubleshooting

### Issue: "DATABASE_URL is not set"

**Solution:**
1. Create `.env` file in `pms-backend` directory
2. Add: `DATABASE_URL=postgresql://username:password@localhost:5432/butler_pms`
3. Restart server

---

### Issue: "Cannot connect to database"

**Checklist:**
1. ✅ PostgreSQL is running: `pg_isready`
2. ✅ DATABASE_URL is correct in `.env`
3. ✅ Database exists: `psql -l | grep butler_pms`
4. ✅ Migrations are run: `npm run migrate`

**Test Connection:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

---

### Issue: "Port 3000 is already in use"

**Solution:**
```bash
# Option 1: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
# In .env file:
PORT=3001
```

---

### Issue: Server still restarting

**Check:**
1. Look at the error message - it will tell you what's wrong
2. Check if `.env` file exists
3. Verify database is running
4. Check Node.js version (use v20 LTS, not v24)

---

## 📋 Pre-Startup Checklist

Before starting servers, ensure:

- [ ] **Node.js v20+ installed** (not v24)
- [ ] **PostgreSQL running** (`pg_isready`)
- [ ] **`.env` file exists** in `pms-backend` directory
- [ ] **DATABASE_URL set** in `.env`
- [ ] **Database created** (`butler_pms`)
- [ ] **Migrations run** (`npm run migrate`)
- [ ] **Dependencies installed** (`npm install`)

---

## 🎯 What Changed

### Before:
- Servers would crash silently
- No error messages
- Nodemon would restart continuously
- Hard to diagnose issues

### After:
- ✅ Clear error messages
- ✅ Database validation before startup
- ✅ Helpful troubleshooting guidance
- ✅ Graceful error handling
- ✅ Process exits with clear error codes

---

## ✅ Verification

**Test API Server:**
```bash
# Start server
npm run dev:api

# In another terminal, test health
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

**Test Worker Server:**
```bash
# Start worker
npm run dev:worker

# Should see:
# [WORKER] 🚀 Worker is active and polling.
```

---

**Status:** ✅ **FIXED - Servers now show clear error messages and validate prerequisites before starting**
