# Discord Project Introduction - KyuubiSoft Hytale Panel

Discord has a 2000 character limit per message. Below are multiple posts designed to be sent sequentially.

---

## POST 1 - Introduction (copy everything below this line until the next POST header)

**KyuubiSoft Hytale Panel** — Professional Server Management

A production-ready web management system for Hytale Dedicated Servers. Deploy with a single Docker command and get a modern admin panel with real-time monitoring, player management, automated backups, and comprehensive server control.

**Current Version:** 2.1.1
**License:** GPL-3.0 (Open Source)
**Languages:** English, German, Portuguese

**Core Features**
```
• Automated Setup       — Server auto-download via official Hytale Downloader
• Web Admin Panel       — Modern dark UI with real-time updates
• Live Console          — Real-time logs, command history, filtering
• Performance Metrics   — CPU, RAM, TPS, MSPT, JVM stats with live graphs
• Player Management     — Kick, ban, teleport, inventory, statistics
• Backup System         — Scheduled and manual backups with restore
• Multi-User Support    — Role-based access control (Admin/Mod/Operator/Viewer)
• Mod Integration       — Upload, configure, Modtale & StackMart support
```

---

## POST 2 - Technical Details (copy everything below this line until the next POST header)

**Technology Stack**

| Layer | Technologies |
|-------|-------------|
| Frontend | Vue.js 3.4, TailwindCSS, Pinia, XTerm.js, Vite |
| Backend | Node.js, Express.js, TypeScript, WebSocket |
| Security | JWT Auth, bcrypt, Helmet.js, CORS, Rate Limiting |
| Infrastructure | Docker, Docker Compose, Java 25, Nginx |

**Security Features**
• JWT token authentication with expiration and invalidation
• Password hashing with bcrypt (minimum 12 characters enforced)
• Non-root container execution with resource limits
• Complete activity audit log for all admin actions
• Configurable CORS origins and rate limiting

**Additional Capabilities**
• Scheduled tasks — automated restarts with player warnings
• Server broadcasts — timed announcements
• WebMap integration — optional live server map
• Prometheus metrics — Grafana-compatible monitoring endpoint
• Asset Explorer — browse and analyze game assets

---

## POST 3 - Quick Start (copy everything below this line until the next POST header)

**Quick Start**

```bash
# Clone the repository
git clone https://github.com/KyuubiDDragon/KyuubiSoft-Hytale-Panel.git
cd KyuubiSoft-Hytale-Panel

# Configure environment
cp .env.example .env

# Deploy
docker compose up -d
```

Access the panel at `http://your-server-ip:18080`
The setup wizard will guide you through initial configuration.

**Requirements**
• Docker and Docker Compose
• Linux, Windows (Docker Desktop), or macOS
• Minimum 4GB RAM recommended

**Links**
• GitHub: <https://github.com/KyuubiDDragon/KyuubiSoft-Hytale-Panel>
• Documentation: See README in repository
• Issues & Feedback: GitHub Issues

Contributions welcome — star the repo, report bugs, or submit pull requests.

*Developed by KyuubiDDragon | KyuubiSoft*

---

## SINGLE POST VERSION (if you prefer one message - 1950 chars)

**KyuubiSoft Hytale Panel** — Professional Server Management

A production-ready web management system for Hytale Dedicated Servers. Deploy with Docker and get a modern admin panel with real-time monitoring, player management, and automated backups.

**Version:** 2.1.1 | **License:** GPL-3.0

**Features**
```
• Automated server download and setup
• Modern web UI with dark theme
• Live console with real-time logs
• Performance monitoring (CPU, RAM, TPS, MSPT)
• Player management (kick, ban, teleport, stats)
• Scheduled backups with one-click restore
• Multi-user with role-based permissions
• Mod support with marketplace integration
```

**Tech Stack**
Vue.js 3 | Node.js | TypeScript | Express | Docker | WebSocket

**Security:** JWT auth, bcrypt, CORS, rate limiting, audit logging, non-root execution

**Quick Start**
```bash
git clone https://github.com/KyuubiDDragon/KyuubiSoft-Hytale-Panel.git
cd KyuubiSoft-Hytale-Panel
cp .env.example .env
docker compose up -d
```
Panel: `http://your-server:18080`

**GitHub:** <https://github.com/KyuubiDDragon/KyuubiSoft-Hytale-Panel>

Contributions welcome. Star the repo, report issues, or submit PRs.

*Developed by KyuubiDDragon | KyuubiSoft*
