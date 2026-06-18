# 🚀 Hivora Setup & Installation Guide

> **Hivora**: Multi-AI Coordination Platform  
> Aynı projede birden fazla AI aracıyla çalış, projenin bütünlüğünü koru.

---

## 📋 Table of Contents

1. [What is Hivora?](#what-is-hivora)
2. [Quick Start](#quick-start)
3. [Database Setup](#database-setup)
4. [AI Provider Configuration](#ai-provider-configuration)
5. [First Run](#first-run)
6. [Free Tier Limits](#free-tier-limits)
7. [Supported Platforms](#supported-platforms)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 What is Hivora?

### The Problem
Multiple AI tools working on the same codebase leads to:
- ❌ File-level lock conflicts (agents waiting forever)
- ❌ Manual merge conflict resolution
- ❌ Duplicate work and broken code
- ❌ Lost time to coordination overhead

### The Solution
**Symbol-Level Locking**: Lock individual functions/classes, not entire files.
- ✅ Multiple agents work in parallel
- ✅ Automatic conflict prevention
- ✅ Real-time coordination board
- ✅ Full git integration

### How It Works
1. **Agent registers** with the project (Claude, Cursor, Copilot, etc.)
2. **Agent acquires symbol-level locks** for functions/classes it wants to modify
3. **Other agents wait** if locks conflict, but can work on other symbols
4. **Agent commits changes** to its git branch
5. **Automatic coordination** prevents merge conflicts
6. **Project integrity maintained** with type checking + tests

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ (`node --version`)
- PostgreSQL 14+ (local or remote)
- Redis 6+ (optional, for production)
- Git installed

### 1. Clone & Install
```bash
git clone <repo-url>
cd <project-directory>
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Setup Database
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE hivora;"

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/hivora

# Run migrations
npm run db:migrate
```

### 4. Configure AI Providers
```bash
# Edit .env - add at least one AI provider key:

# Option A: OpenAI
OPENAI_API_KEY=sk-...
AI_PROVIDERS=openai

# Option B: Anthropic
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDERS=anthropic

# Option C: Multiple
AI_PROVIDERS=openai,anthropic,cohere
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Start Development
```bash
# Terminal 1: Web app
npm run dev --workspace apps/web

# Terminal 2: API server
npm run dev --workspace apps/api

# Terminal 3: Database viewer (optional)
npm run db:studio --workspace packages/db
```

Visit `http://localhost:3000` and create your first project!

---

## 🗄️ Database Setup

### Local PostgreSQL (Quick)
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows (WSL2 recommended)
wsl --install
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### Create Database
```bash
psql -U postgres
# In psql prompt:
CREATE DATABASE hivora;
\q

# Update .env
DATABASE_URL=postgresql://postgres@localhost:5432/hivora
```

### Verify Connection
```bash
npx prisma db push
# Should say "✓ Pushed"
```

### Run Migrations
```bash
npm run db:migrate --workspace packages/db
```

---

## 🤖 AI Provider Configuration

### OpenAI
1. Visit https://platform.openai.com/account/api-keys
2. Create API key
3. Add to `.env`:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

### Anthropic (Claude)
1. Visit https://console.anthropic.com/account/keys
2. Create API key
3. Add to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-1
```

### Cohere
1. Visit https://dashboard.cohere.ai/api-keys
2. Create API key
3. Add to `.env`:
```
COHERE_API_KEY=...
COHERE_MODEL=command-r-plus
```

### Verify Setup
```bash
# Make a test request after starting the API
curl -X GET http://localhost:4000/api/agents/providers
# Should return available providers
```

---

## 🚀 First Run

### 1. Create Account
- Go to http://localhost:3000
- Click "Sign Up"
- Enter email and password

### 2. Create Organization
- After signup, create your first organization
- Give it a name (e.g., "My Project")

### 3. Create Project
- Inside organization, click "New Project"
- Connect your git repository
- Choose your tech stack

### 4. Add Agents
- In Project Settings → Agents
- Add AI agents:
  - Claude (Backend)
  - Cursor (Frontend)
  - Copilot (DevOps)

### 5. Make Your First Coordination
- Open real-time board
- See agents sync in real-time
- Make changes with multiple agents simultaneously

---

## 📊 Free Tier Limits

### What You Get (Free)
| Feature | Limit |
|---------|-------|
| Concurrent Agents | 2 |
| Symbol Locks/Day | 100 |
| Projects | 5 |
| Team Members | 3 |
| Local Mode | ✓ |
| Git Integration | ✓ |
| Cloud Sync | ✗ |
| Support | Community |

### How to Optimize
#### 1. **Batch Your Locks**
Instead of 100 small locks, use 10-20 large coordinated sessions.

#### 2. **Serial Coordination**
- 9:00 AM: Agent 1 works on auth
- 10:00 AM: Agent 1 commits, Agent 2 starts on UI
- 11:00 AM: Agent 2 commits, Agent 1 starts tests
- Result: 3 concurrent tasks with 2 agents!

#### 3. **Local-First Development**
Free tier works fully offline. Perfect for:
- Local development
- Team experimentation
- Testing multi-AI workflows

#### 4. **Upgrade When Ready**
Move to Pro when you need:
- 10+ concurrent agents
- 10,000+ locks/day
- Cloud team collaboration
- Audit logs

---

## 🌐 Supported Platforms

### AI Agents ⚡
- **Claude** (Anthropic) - Full support
- **GitHub Copilot** - VSCode extension
- **Cursor** - Native IDE
- **OpenAI API** - Custom agents
- More coming soon!

### IDEs 💻
- **VS Code** - Extension + settings
- **Cursor** - Native support
- **IntelliJ IDEA** - Coming soon
- **WebStorm** - Coming soon

### Version Control 📦
- **Git** - Native support
- **GitHub** - Full integration
- **GitLab** - Full integration
- **Gitea** - Coming soon

### Infrastructure 🏗️
- **PostgreSQL** - Data storage
- **Redis** - Caching & messaging
- **Docker** - Containerization
- **Kubernetes** - Orchestration

### How to Integrate

#### VSCode Integration
```json
// .vscode/settings.json
{
  "hivora.enabled": true,
  "hivora.apiUrl": "http://localhost:4000",
  "hivora.showRealTimeBoard": true,
  "hivora.autoDetectAgents": true
}
```

#### Git Pre-commit Hook
```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run db:check-schema
npm run lint
npm run type-check
```

#### Docker Deployment
```bash
# Build
npm run build --workspaces
docker build -t hivora:latest .

# Run
docker run -e DATABASE_URL=postgresql://... hivora:latest
```

---

## 🔧 Project Structure

```
hivora/
├── apps/
│   ├── api/              # Express API server
│   ├── web/              # Next.js web app
│   └── desktop/          # Electron desktop app (v0.1.0)
├── packages/
│   ├── db/               # Prisma ORM + migrations
│   ├── shared/           # Shared types & constants
│   └── orchestrator/      # Lock coordination engine
├── .env.example          # Environment template
├── SETUP.md              # This file
└── package.json          # Monorepo root
```

---

## 📖 Commands Reference

### Development
```bash
npm run dev --workspace apps/api      # Start API
npm run dev --workspace apps/web      # Start web app
npm run dev --workspace apps/desktop  # Start desktop app
```

### Database
```bash
npm run db:generate --workspace packages/db   # Generate Prisma client
npm run db:migrate --workspace packages/db    # Run migrations
npm run db:seed --workspace packages/db       # Seed test data
npm run db:studio --workspace packages/db     # Open Prisma Studio
```

### Build
```bash
npm run build --workspaces             # Build all apps
npm run build --workspace apps/desktop # Build Windows installer
```

### Testing
```bash
npm run typecheck --workspaces  # Type checking
npm run lint --workspaces       # Linting
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Can't reach database server at localhost:5432
```
**Solution:**
```bash
# Check if PostgreSQL is running
psql -U postgres -d postgres -c "SELECT 1"

# If not running:
# macOS: brew services start postgresql@15
# Ubuntu: sudo systemctl start postgresql
```

### AI Provider Error
```
OpenAI API key not configured
```
**Solution:**
- Check `.env` has `OPENAI_API_KEY=sk-...`
- Verify key is valid at https://platform.openai.com/account/api-keys
- Restart API server

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution:**
```bash
# Find and kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Hydration Mismatch Error
This is normal during development. It means server/client rendering differs.
- Refresh the page
- Check `.next` is not committed to git

### Migration Failed
```bash
# Reset database (WARNING: deletes data!)
npx prisma migrate reset

# Then:
npm run db:migrate
npm run db:seed
```

---

## 🎓 Learning Resources

### Understand Symbol-Level Locking
→ Read `/apps/web/app/how-it-works/page.tsx`

### Explore Free Tier Usage
→ Visit `/apps/web/app/free-tier/page.tsx`

### Check Supported Platforms
→ Visit `/apps/web/app/platforms/page.tsx`

---

## 🚀 Next Steps

1. ✅ Database setup
2. ✅ AI providers configured
3. ✅ First run successful
4. 👉 **Now:**
   - Create a test project
   - Invite team members
   - Try 2-agent coordination
   - Read `/how-it-works` page

5. **When ready to share:**
   - Deploy to production
   - Set up billing (Stripe)
   - Invite more users
   - Scale infrastructure

---

## 📞 Support

- **Documentation**: http://localhost:3000/how-it-works
- **Contact**: /contact page
- **GitHub Issues**: Report bugs
- **Community**: Join Discord (coming soon)

---

## 📝 License

This project is part of Hivora. All rights reserved.

---

**Happy coding with AI! 🎉**
