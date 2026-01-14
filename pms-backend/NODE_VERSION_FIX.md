# Node.js v24 Compatibility Fix

## 🔴 Issue

Node.js v24.7.0 has compatibility issues with `nodemon` and the `debug` package:
- `Error: Invalid package config /node_modules/debug/package.json`
- `TypeError: require(...) is not a function` in nodemon

---

## ✅ Solutions

### Option 1: Use Node.js v20 LTS (Recommended)

**Install Node.js v20:**
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Verify version
node --version  # Should show v20.x.x
```

**Then run servers normally:**
```bash
npm run dev:api
npm run dev:worker
```

---

### Option 2: Use Direct Scripts (No Nodemon)

If you must use Node.js v24, use the direct scripts without nodemon:

**Terminal 1 - API Server:**
```bash
npm run dev:api:direct
```

**Terminal 2 - Worker Server:**
```bash
npm run dev:worker:direct
```

**Note:** These scripts don't have hot-reload. You'll need to manually restart after code changes.

---

### Option 3: Fix Node Modules (Temporary)

If the issue persists after reinstalling:

```bash
cd pms-backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 🔧 Quick Fix Script

Create a script to check Node version and use appropriate command:

```bash
#!/bin/bash
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -ge 24 ]; then
    echo "⚠️  Node.js v24 detected. Using direct scripts (no hot-reload)..."
    echo "💡 Recommendation: Use Node.js v20 LTS for best compatibility"
    npm run dev:api:direct
else
    echo "✅ Using nodemon with hot-reload..."
    npm run dev:api
fi
```

---

## 📋 Verification

**Check Node version:**
```bash
node --version
```

**Expected:**
- ✅ `v20.x.x` - Best compatibility
- ⚠️ `v24.x.x` - Use direct scripts or downgrade

---

## 🎯 Recommended Setup

1. **Install nvm** (if not already installed):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Install Node.js v20:**
   ```bash
   nvm install 20
   nvm use 20
   nvm alias default 20
   ```

3. **Verify:**
   ```bash
   node --version  # Should be v20.x.x
   ```

4. **Run servers:**
   ```bash
   npm run dev:api
   npm run dev:worker
   ```

---

## 🐛 Troubleshooting

### Issue: Still getting errors after reinstalling

**Solution:**
```bash
cd pms-backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### Issue: nvm not found

**Solution:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Then restart terminal or run:
```bash
source ~/.zshrc
```

---

## ✅ Status

- ✅ Added `dev:api:direct` script (no nodemon)
- ✅ Added `dev:worker:direct` script (no nodemon)
- ✅ Documented Node.js v24 compatibility issues
- ✅ Provided Node.js v20 installation guide

**Recommendation:** Use Node.js v20 LTS for best compatibility with all packages.
