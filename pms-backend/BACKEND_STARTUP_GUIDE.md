# Butler PMS Backend - Startup Guide

## 🚀 Quick Start

The Butler PMS backend consists of **two servers** that need to run simultaneously:

1. **API Server** - Handles HTTP requests (REST API)
2. **Worker Server** - Processes background jobs, events, and cron tasks

---

## 📋 Prerequisites

- **Node.js**: v20 LTS or v18+ (v24.7.0 has issues with nodemon)
- **PostgreSQL**: Database server running
- **npm**: Package manager

---


## 🔧 Setup Steps

### 1. Install Dependencies

```bash
cd pms-backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `pms-backend` directory:

```bash
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/butler_pms

# Server Configuration
PORT=3000

# JWT Secret (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Optional: Email Integration (for notifications)
EMAIL_ENABLED=false
EMAIL_PROVIDER=gmail
EMAIL_FROM=noreply@butler.com
EMAIL_FROM_NAME=Butler PMS
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional: Slack Integration (for notifications)
SLACK_ENABLED=false
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Minimum Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens

---

### 3. Database Setup

#### Option A: Using Migrations (Recommended)

```bash
# Run migrations
npm run migrate
# or
npx ts-node -r tsconfig-paths/register database/run-migrations.ts

# Seed database (optional - creates admin user)
npm run seed
# or
npx ts-node -r tsconfig-paths/register database/seed.ts
```

#### Option B: Manual Setup

```bash
# Create database
createdb butler_pms

# Run schema
psql butler_pms < database/schema.sql

# Run migrations
psql butler_pms < database/migrations/002_create_events_table.sql
psql butler_pms < database/migrations/003_alter_notifications_table.sql
psql butler_pms < database/migrations/003_update_response_sheets.sql
```

**Default Admin Credentials** (after seeding):
- Email: `admin@butler.com`
- Password: `password`

---

## 🎯 Running the Servers

### Option 1: Run Both Servers Separately (Recommended for Development)

**Terminal 1 - API Server:**
```bash
cd pms-backend
npm run dev:api
```

**Terminal 2 - Worker Server:**
```bash
cd pms-backend
npm run dev:worker
```

### Option 2: Using Process Managers

#### Using PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start both servers
pm2 start npm --name "pms-api" -- run dev:api
pm2 start npm --name "pms-worker" -- run dev:worker

# View logs
pm2 logs

# Stop servers
pm2 stop all
```

#### Using concurrently (Development)

Add to `package.json`:
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev:api\" \"npm run dev:worker\""
  }
}
```

Then run:
```bash
npm run dev:all
```

---

## ✅ Verification

### Check API Server

1. **Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-13T..."
   }
   ```

2. **Test Login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@butler.com","password":"password"}'
   ```

### Check Worker Server

Look for these log messages:
```
⚙️  BUTLER BACKGROUND WORKER STARTING...
[WORKER] ✅ Database connected successfully at: ...
[WORKER] 🚀 Worker is active and polling.
```

---

## 📊 Server Details

### API Server (`apps/api/server.ts`)

- **Port:** 3000 (default, configurable via `PORT` env var)
- **Purpose:** Handles all HTTP requests
- **Routes:** All REST API endpoints
- **Features:**
  - CORS enabled
  - Helmet security
  - Request logging (Morgan)
  - Error handling

**Available Scripts:**
```bash
npm run dev:api      # Development with hot reload
npm run dev          # Alias for dev:api
```

### Worker Server (`apps/worker/worker.ts`)

- **Purpose:** Background processing
- **Features:**
  - Event processing (ticket iterations, project events)
  - Cron jobs (red alerts scanning every 30 minutes)
  - Notification processing
  - Database polling

**Available Scripts:**
```bash
npm run dev:worker   # Development with hot reload
```

---

## 🔍 Troubleshooting

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Rebuild TypeScript paths
npm install
# Ensure tsconfig-paths is installed
npm install --save-dev tsconfig-paths
```

### Issue: Database connection errors

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify `DATABASE_URL` in `.env`:
   ```bash
   echo $DATABASE_URL
   ```

3. Test connection:
   ```bash
   npx ts-node -r tsconfig-paths/register test-db.ts
   ```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Change PORT in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Nodemon not working (Node v24)

**Solution:**
Use Node.js v20 LTS:
```bash
# Using nvm
nvm install 20
nvm use 20

# Or run directly without nodemon
node dist/apps/api/server.js
```

### Issue: Worker not processing events

**Check:**
1. Worker server is running
2. Database connection is active
3. Events table exists (run migrations)
4. Check worker logs for errors

---

## 📝 Development Workflow

### Typical Development Setup

1. **Start Database:**
   ```bash
   # PostgreSQL should be running
   pg_ctl start
   ```

2. **Start API Server** (Terminal 1):
   ```bash
   cd pms-backend
   npm run dev:api
   ```

3. **Start Worker Server** (Terminal 2):
   ```bash
   cd pms-backend
   npm run dev:worker
   ```

4. **Start Frontend** (Terminal 3):
   ```bash
   cd Frontend
   npm run dev
   ```

### Hot Reload

Both servers use `nodemon` for automatic reloading on file changes:
- API server reloads on changes to `apps/`, `modules/`, `common/`, `config/`, `database/`
- Worker server reloads on the same files

---

## 🏗️ Production Deployment

### Build for Production

```bash
# Compile TypeScript
npm run build

# Run compiled code
node dist/apps/api/server.js
node dist/apps/worker/worker.js
```

### Environment Variables

Ensure all required environment variables are set:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (optional, defaults to 3000)
- Email/Slack credentials (if using notifications)

### Process Management

Use PM2 or similar:
```bash
pm2 start dist/apps/api/server.js --name "pms-api"
pm2 start dist/apps/worker/worker.js --name "pms-worker"
pm2 save
pm2 startup
```

---

## 📚 Additional Resources

- **API Documentation:** `/API_DOCUMENTATION.md`
- **Frontend Integration Guide:** `/FRONTEND_INTEGRATION_GUIDE.md`
- **Database Schema:** `database/schema.sql`
- **Consistency Report:** `/CONSISTENCY_CHECK_REPORT.md`

---

## 🆘 Support

If you encounter issues:

1. Check logs in both terminals
2. Verify database connection
3. Ensure all environment variables are set
4. Check Node.js version (use v20 LTS)
5. Review error messages in console

---

## ✅ Quick Checklist

- [ ] Node.js v20+ installed
- [ ] PostgreSQL running
- [ ] Database created (`butler_pms`)
- [ ] Migrations run
- [ ] `.env` file created with `DATABASE_URL` and `JWT_SECRET`
- [ ] Dependencies installed (`npm install`)
- [ ] API server running (`npm run dev:api`)
- [ ] Worker server running (`npm run dev:worker`)
- [ ] Health check passes (`curl http://localhost:3000/health`)

---

**Status:** ✅ Ready to run!
