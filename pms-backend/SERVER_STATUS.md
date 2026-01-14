# Server Status & Quick Fixes

## ✅ Current Status

### Worker Server
- ✅ **RUNNING** - Connected to database
- ✅ Cron jobs active (Event Processor, Red Alert Scanner)
- ✅ Processing events every 1 minute
- ✅ Scanning for alerts every 30 minutes

### API Server
- ⚠️ **PORT CONFLICT** - Port 3000 is already in use
- Need to kill old process or change port

---

## 🔧 Quick Fixes

### Fix Port Conflict

**Option 1: Kill process on port 3000**
```bash
lsof -ti:3000 | xargs kill -9
```

**Option 2: Change port in .env**
```bash
# Edit .env file
PORT=3001
```

**Option 3: Use the helper script**
```bash
./START_SERVERS.sh
```

---

## 🚀 Start Servers

### Terminal 1 - API Server:
```bash
cd pms-backend
npm run dev:api:direct  # Node v24
# OR
npm run dev:api         # Node v20 (with nodemon)
```

### Terminal 2 - Worker Server:
```bash
cd pms-backend
npm run dev:worker:direct  # Node v24
# OR
npm run dev:worker         # Node v20 (with nodemon)
```

---

## ✅ Verify Servers

**Check API Server:**
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{"status":"ok","timestamp":"..."}
```

**Check Worker Server:**
Look for in terminal:
```
[WORKER] 🚀 Worker is active and polling.
```

---

## 🐛 Common Issues

### Port Already in Use
```bash
# Find process
lsof -ti:3000

# Kill it
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed
```bash
# Check PostgreSQL
pg_isready

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Nodemon Not Working (Node v24)
Use direct scripts:
```bash
npm run dev:api:direct
npm run dev:worker:direct
```

---

## 📊 Server Logs

**API Server should show:**
```
[API] Checking database connection...
[DB-SUCCESS] Connected to database at...
[PMS-BACKEND-API] 🚀 Server running on http://localhost:3000
```

**Worker Server should show:**
```
[WORKER] Checking database connectivity...
[WORKER] ✅ Database connected successfully at:...
[WORKER] 🚀 Worker is active and polling.
```

---

**Status:** Worker ✅ | API ⚠️ (Port conflict - fix above)
