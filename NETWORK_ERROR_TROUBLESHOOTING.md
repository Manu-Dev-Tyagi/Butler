# Network Error Troubleshooting Guide

## 🔍 Issue: "Network Error" when saving client

This error means the frontend cannot connect to the backend API server.

---

## ✅ Quick Fixes

### 1. **Check if Backend Server is Running**

**Terminal 1 - Start API Server:**
```bash
cd pms-backend
npm run dev:api
```

**Expected Output:**
```
[PMS-BACKEND-API] 🚀 Server running on http://localhost:3000
```

**If you see errors:**
- Check if port 3000 is already in use
- Check if database is running
- Check `.env` file exists with `DATABASE_URL`

---

### 2. **Verify Backend is Reachable**

Open in browser or use curl:
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2026-01-13T..."}
```

**If this fails:**
- Backend is not running
- Port is wrong
- Firewall blocking connection

---

### 3. **Check Frontend API URL**

**Check browser console:**
- Open DevTools (F12)
- Go to Network tab
- Try creating client
- Check the failed request URL

**Should be:** `http://localhost:3000/clients`

**If different:**
- Check `.env` file in Frontend directory
- Set `VITE_API_BASE_URL=http://localhost:3000`

---

### 4. **Check CORS Configuration**

The backend now has improved CORS settings. If you still get CORS errors:

**Backend (server.ts):**
```typescript
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**If CORS errors persist:**
- Check browser console for CORS error details
- Verify frontend URL matches backend CORS origin

---

## 🔧 Step-by-Step Diagnosis

### Step 1: Verify Backend Server

```bash
# Check if process is running
lsof -i :3000

# Or check with curl
curl http://localhost:3000/health
```

**If not running:**
```bash
cd pms-backend
npm run dev:api
```

---

### Step 2: Check Database Connection

Backend needs database to be running. Check backend logs for:
```
[DB-ERROR] Failed to connect to database
```

**Fix:**
```bash
# Start PostgreSQL
pg_ctl start

# Or check if running
pg_isready
```

---

### Step 3: Check Environment Variables

**Backend `.env` file should have:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/butler_pms
JWT_SECRET=your-secret-key
PORT=3000
```

**Frontend `.env` file (optional):**
```env
VITE_API_BASE_URL=http://localhost:3000
```

---

### Step 4: Check Browser Console

**Open DevTools (F12) → Console tab**

Look for:
- Network errors
- CORS errors
- Connection refused errors

**Common errors:**
- `ERR_CONNECTION_REFUSED` → Backend not running
- `ERR_NETWORK_CHANGED` → Network issue
- `CORS policy` → CORS configuration issue

---

### Step 5: Test API Directly

**Using curl:**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test client creation (requires auth token)
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Client"}'
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev:api
```

---

### Issue 2: Database Connection Failed

**Error:** `[DB-ERROR] Failed to connect to database`

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

---

### Issue 3: Frontend Can't Reach Backend

**Error:** `Network Error` or `ERR_CONNECTION_REFUSED`

**Checklist:**
- [ ] Backend server is running (`npm run dev:api`)
- [ ] Backend shows: `🚀 Server running on http://localhost:3000`
- [ ] Health check works: `curl http://localhost:3000/health`
- [ ] Frontend URL matches backend URL
- [ ] No firewall blocking localhost:3000

---

### Issue 4: CORS Errors

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
- Backend CORS is already configured
- Check browser console for specific CORS error
- Verify frontend origin matches CORS settings

---

## 📋 Verification Checklist

Before testing client creation:

- [ ] **Backend API Server Running**
  ```bash
  cd pms-backend
  npm run dev:api
  # Should see: 🚀 Server running on http://localhost:3000
  ```

- [ ] **Backend Worker Running** (optional but recommended)
  ```bash
  cd pms-backend
  npm run dev:worker
  ```

- [ ] **Database Running**
  ```bash
  pg_isready
  # Should return: accepting connections
  ```

- [ ] **Health Check Works**
  ```bash
  curl http://localhost:3000/health
  # Should return: {"status":"ok",...}
  ```

- [ ] **Frontend Running**
  ```bash
  cd Frontend
  npm run dev
  ```

- [ ] **Environment Variables Set**
  - Backend: `DATABASE_URL`, `JWT_SECRET`
  - Frontend: `VITE_API_BASE_URL` (optional)

---

## 🚀 Quick Start Commands

**Terminal 1 - Backend API:**
```bash
cd pms-backend
npm run dev:api
```

**Terminal 2 - Backend Worker:**
```bash
cd pms-backend
npm run dev:worker
```

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm run dev
```

---

## 🔍 Debug Mode

**Enable detailed logging:**

**Backend:**
- Already has `morgan('dev')` for request logging
- Check terminal for request logs

**Frontend:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

---

## 📞 Still Having Issues?

1. **Check Backend Logs:**
   - Look for error messages in terminal
   - Check for database connection errors
   - Check for route registration errors

2. **Check Frontend Console:**
   - Open DevTools → Console
   - Look for network errors
   - Check error details

3. **Test Health Endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Verify Port:**
   ```bash
   lsof -i :3000
   ```

---

## ✅ Expected Behavior

When everything is working:

1. **Backend Terminal Shows:**
   ```
   [PMS-BACKEND-API] 🚀 Server running on http://localhost:3000
   POST /clients 201 45.123 ms
   ```

2. **Frontend Modal:**
   - No error messages
   - Client created successfully
   - Modal closes
   - Client appears in dropdown

3. **Browser Console:**
   - No network errors
   - Request shows status 201

---

**Status:** ✅ **TROUBLESHOOTING GUIDE READY**

Use this guide to diagnose and fix network errors.
