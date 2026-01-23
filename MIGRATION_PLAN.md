# Migration Plan: Replit → GitHub + Railway

## Project Overview
**HangTime** - A full-stack meeting scheduler built with:
- Frontend: React 18 + TypeScript + Vite + shadcn/ui
- Backend: Express.js + TypeScript
- Database: PostgreSQL (Neon serverless) + Drizzle ORM

---

## Migration Tasks

### 1. Remove Replit-Specific Code

**`client/index.html`**
- Remove the Replit dev banner script: `https://replit.com/public/js/replit-dev-banner.js`

**`vite.config.ts`**
- Remove `@replit/vite-plugin-runtime-error-modal` import and usage
- Remove `@replit/vite-plugin-cartographer` import and conditional logic
- Remove `REPL_ID` environment variable check

**`package.json`**
- Remove dev dependencies:
  - `@replit/vite-plugin-cartographer`
  - `@replit/vite-plugin-runtime-error-modal`

### 2. Make Port Configurable

**`server/index.ts`**
- Change hardcoded port 5000 to use environment variable: `process.env.PORT || 5000`

### 3. Add GitHub Repository Files

**`.gitignore`**
```
node_modules/
dist/
.env
*.log
.DS_Store
```

**`.env.example`**
```
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=development
PORT=5000
```

### 4. Add GitHub Actions CI/CD

**`.github/workflows/ci.yml`**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check
      - run: npm run build
```

### 5. Add Railway Configuration

**`railway.toml`**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### 6. Initialize Git & Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: HangTime scheduler"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 7. Connect Railway to GitHub
1. In Railway dashboard, create new project from GitHub repo
2. Set environment variables:
   - `DATABASE_URL` (your Neon connection string)
   - `NODE_ENV=production`
3. Railway auto-detects Node.js and deploys

---

## Files to Modify
| File | Action |
|------|--------|
| `client/index.html` | Remove Replit banner script |
| `vite.config.ts` | Remove Replit plugins |
| `package.json` | Remove Replit dependencies |
| `server/index.ts` | Make port configurable via `PORT` env var |

## Files to Create
| File | Purpose |
|------|---------|
| `.gitignore` | Exclude node_modules, dist, .env |
| `.env.example` | Document required environment variables |
| `.github/workflows/ci.yml` | GitHub Actions for type check + build |
| `railway.toml` | Railway deployment configuration |

---

## Verification
1. Run `npm install` after removing Replit packages
2. Run `npm run dev` - verify development server starts
3. Run `npm run check` - verify TypeScript passes
4. Run `npm run build && npm start` - verify production build works
5. Test app functionality locally (create event, share link, submit availability)
6. Push to GitHub and verify CI workflow passes
7. Deploy to Railway and verify production site works
