# Quick Start Guide - After npm install

## ✅ Next Steps

### 1. **Check Environment Variables**

Make sure you have a `.env` file in `pms-backend` directory:

```bash
cd pms-backend
cat .env
```

**Required variables:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/butler_pms
JWT_SECRET=your-secret-key-here
PORT=3000
```

**If `.env` doesn't exist, create it:**
```bash
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/butler_pms
JWT_SECRET=change-this-to-a-random-secret-key
PORT=3000
EOF
```

---

### 2. **Start Database**

Make sure PostgreSQL is running:

```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it (macOS)
brew services start postgresql@14
# or
pg_ctl start
```

---

### 3. **Run Migrations**

Create database tables:

```bash
cd pms-backend
npm run migrate
```

**Expected output:**
```
Running migrations...
Migration 002_create_events_table.sql completed
Migration 003_alter_notifications_table.sql completed
...
✅ All migrations completed
```

---

### 4. **Seed Database (Optional)**

Create admin user:

```bash
npm run seed
```

---

### 5. **Start Servers**

**Option A: Using Direct Scripts (Node.js v24 - No hot-reload)**

**Terminal 1 - API Server:**
```bash
npm run dev:api:direct
```

**Terminal 2 - Worker Server:**
```bash
npm run dev:worker:direct
```

**Option B: Using Nodemon (Node.js v20 - With hot-reload)**

**Terminal 1 - API Server:**
```bash
npm run dev:api
```

**Terminal 2 - Worker Server:**
```bash
npm run dev:worker
```

---

### 6. **Verify Servers Are Running**

**Check API Server:**
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2026-01-13T..."}
```

**Check Worker Server:**
Look for this in terminal:
```
[WORKER] 🚀 Worker is active and polling.
```

---

## 🐛 Troubleshooting

### Issue: "DATABASE_URL is not set"

**Solution:**
```bash
# Create .env file
cd pms-backend
nano .env  # or use your preferred editor
```

Add:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/butler_pms
JWT_SECRET=your-secret-key
```

---

### Issue: "Cannot connect to database"

**Check:**
1. PostgreSQL is running: `pg_isready`
2. Database exists: `psql -l | grep butler_pms`
3. DATABASE_URL is correct in `.env`

**Create database if needed:**
```bash
createdb butler_pms
```

---

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

---

### Issue: Node.js v24 compatibility

**Solution:**
- Use `dev:api:direct` and `dev:worker:direct` scripts
- Or switch to Node.js v20: `nvm install 20 && nvm use 20`

---

## ✅ Success Checklist

- [ ] `.env` file exists with DATABASE_URL and JWT_SECRET
- [ ] PostgreSQL is running
- [ ] Database `butler_pms` exists
- [ ] Migrations run successfully (`npm run migrate`)
- [ ] API server starts (`npm run dev:api:direct`)
- [ ] Worker server starts (`npm run dev:worker:direct`)
- [ ] Health check works (`curl http://localhost:3000/health`)

---

## 🚀 Ready to Go!

Once both servers are running:
1. API Server: `http://localhost:3000`
2. Worker Server: Processing events in background

**Start Frontend:**
```bash
cd Frontend
npm run dev
```

Then open `http://localhost:5173` (or the port shown)

---

**Status:** ✅ **Ready to start servers!**
