<div align="center">

# ⚔️ AlgoArena
### *The Real-Time 1v1 Competitive Coding & Multiplayer DSA Battleground*

<p align="center">
  <strong>Chess.com meets LeetCode.</strong> Battle developers head-to-head on real Data Structures & Algorithms challenges, race the clock, and climb the global Elo leaderboard with live verdict streaming and sandboxed execution.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.0-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/BullMQ-Queue-FF4F00?style=for-the-badge&logo=redis&logoColor=white" alt="BullMQ" />
  <img src="https://img.shields.io/badge/Docker-Sandbox-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
</p>

---

</div>

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Complete Tech Stack](#-complete-tech-stack)
- [Judge & Docker Sandbox Engine](#-judge--docker-sandbox-engine)
- [Elo Rating & Competitive Model](#-elo-rating--competitive-model)
- [Real-Time Socket.io Protocol](#-real-time-socketio-protocol)
- [Database Schema & Architecture](#-database-schema--architecture)
- [REST API Reference](#-rest-api-reference)
- [Directory Structure](#-directory-structure)
- [Local Development Setup](#-local-development-setup)
- [Environment Variables](#-environment-variables)
- [Testing & Verification](#-testing--verification)
- [Deployment Guide](#-deployment-guide)
- [License & Author](#-license--author)

---

## 💡 Overview

Practicing algorithmic problem-solving on traditional platforms is solitary and asynchronous. **AlgoArena transforms DSA practice into high-stakes, real-time multiplayer duels.**

Two developers are paired by Elo rating into a live room with identical problem statements, starter templates, and secret test suites. As they code, live telemetry synchronizes typing activity, line counts, and submission progress. When a player submits, their code is evaluated in an isolated Docker sandbox across multiple languages (JavaScript, Python, C++, Java) with instant verdict streaming back to both players over WebSockets.

---

## ✨ Key Features

### ⚡ Real-Time 1v1 Ranked Matchmaking
- **Skill-Based Matchmaking (SBMM)**: Matchmaking engine automatically widens Elo tolerance window (`±100` base, expanding every 10 seconds) to balance queue times with match fairness.
- **Topic & Difficulty Filters**: Queue for specific categories (`Arrays`, `Trees`, `Graphs`, `DP`, `Strings`, `Linked Lists`, `Binary Search`, `Sorting`) across `Easy`, `Medium`, or `Hard`.
- **Live Reconnection & State Recovery**: Graceful disconnect handling with 45-second reconnect windows and match state synchronization.

### 👥 Custom Matches & Private Rooms
- **Private Room Codes**: Generate 6-character room codes or share direct battle links.
- **Unrated / Custom Sparring**: Practice with teammates, host study groups, or run collegiate coding mini-tournaments without risking ranked Elo.

### 💻 Monaco Code Editor & Live Workspace
- **Multi-Language Support**: Write and submit in **JavaScript (Node.js)**, **Python 3**, **C++ (C++17)**, and **Java (OpenJDK 17)**.
- **Custom AlgoArena Dark Theme**: Tailored syntax highlighting and typography optimized for speed and contrast.
- **Rich Data Structure Serialization**: Native automatic tree/list builders (`TreeNode`, `ListNode`) that parse JSON arrays into object graphs on the fly.
- **Run vs Submit**: Test against public sample cases instantly before submitting against full hidden test suites.

### 🔒 Enterprise-Grade Isolated Code Sandbox
- **Zero Network Access**: Sandboxed containers run with `--network none`.
- **Hard Resource Caps**: Capped at 256MB RAM (no swap), 0.5 CPU cores, 50 max PIDs (fork-bomb immune), and read-only root filesystems.
- **Sub-Second Execution**: BullMQ worker queues with Redis Pub/Sub broadcast results back to the WebSocket room in milliseconds.

### 📊 Competitive Elo Engine & Leaderboards
- **Dynamic K-Factor**: Adaptive sensitivity (48 for calibration placement matches, 32 for normal, 24 for expert, 16 for grandmasters).
- **Difficulty & Speed Multipliers**: Solve time bonuses (under 5m/10m/20m) and scaled weights for harder problems.
- **Rank Tiers**: `Novice` (<1200), `Apprentice` (1200+), `Specialist` (1400+), `Expert` (1600+), `Candidate Master` (1800+), `Grandmaster` (2000+).
- **Historical Analytics**: Rating progression graphs, match history timelines, and global leaderboards.

### 🔐 Multi-Provider Authentication & Security
- **Email / Password & OTP**: Email verification and password resets with 6-digit OTPs delivered via Nodemailer SMTP.
- **Firebase OAuth**: One-click Google sign-in with automatic account linking.
- **JWT Session Security**: Secure HS256 JWT tokens for both HTTP requests and WebSocket handshakes.
- **Custom DiceBear Avatars**: Dynamic avatar seed and style selection stored per user profile.

---

## 🏛️ System Architecture

AlgoArena is architected as a distributed, event-driven system comprising three core layers:

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client (React 19 + Vite)"]
        UI[Monaco Editor & Battle UI]
        SockClient[Socket.io Client]
        AuthClient[Firebase & JWT Auth]
    end

    subgraph GatewayLayer["API Gateway & WebSockets (Express 5)"]
        API[REST Endpoints /api/*]
        SockServer[Socket.io Server]
        AuthMW[JWT Auth Middleware]
        Matchmaker[Matchmaking Engine]
        SubProducer[BullMQ Submission Producer]
        VerdictSub[Redis Verdict Subscriber]
    end

    subgraph DataLayer["Storage & Cache"]
        Postgres[(PostgreSQL / Supabase)]
        Redis[(Redis / Upstash - Queues & PubSub)]
    end

    subgraph WorkerLayer["Judge & Execution Workers"]
        BullWorker[BullMQ Worker Pool]
        DockerEngine[Docker Container Sandbox]
        Runtimes[Node.js | Python 3 | C++17 | Java 17]
    end

    UI --> SockClient
    UI --> AuthClient
    SockClient <--> SockServer
    AuthClient <--> API

    API --> Postgres
    SockServer --> Matchmaker
    Matchmaker --> Postgres
    Matchmaker --> SockServer

    SockServer --> SubProducer
    SubProducer --> Redis
    Redis --> BullWorker

    BullWorker --> Postgres
    BullWorker --> DockerEngine
    DockerEngine --> Runtimes

    BullWorker -- Publish Verdict --> Redis
    Redis -- "aa:verdicts" --> VerdictSub
    VerdictSub --> SockServer
    SockServer -- "submission_result" --> SockClient
```

### End-to-End Submission Lifecycle:
1. **Player Submits Code**: Client emits `submit_code` via WebSocket with code, language, and room details.
2. **Submission Queued**: Express server creates a pending submission record in PostgreSQL and pushes a job to the `submissions` BullMQ queue on Redis.
3. **Worker Pickup**: A background judge worker claims the job, fetches hidden test cases from PostgreSQL, and constructs the language-specific test harness.
4. **Sandboxed Run**: Worker spawns a locked-down Docker container with strict memory, CPU, PID, and network limits.
5. **Verdict Publication**: The worker logs execution time and memory into Postgres, then publishes verdict JSON to Redis channel `aa:verdicts`.
6. **Live Broadcast**: The API server's Redis subscriber receives the verdict, calculates Elo/match outcome if accepted, and emits `submission_result` and `match_end` to both players simultaneously.

---

## 🛠️ Complete Tech Stack

### Frontend Application
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | UI Component Architecture and Virtual DOM |
| **Vite** | `^8.2.0` | Ultra-fast bundling, HMR, and development tooling |
| **Monaco Editor** | `^4.7.0` | Full-featured VS Code-like coding interface (`@monaco-editor/react`) |
| **Tailwind CSS** | `^3.4.19` | Utility-first responsive styling and custom design system |
| **Socket.io Client**| `^4.8.3` | Low-latency duplex WebSocket connection for real-time matches |
| **React Router** | `^7.18.2` | Declarative client-side routing & page navigation |
| **Axios** | `^1.19.0` | Promise-based HTTP client with auth interceptors |
| **Firebase Client**| `^12.18.0` | Client-side Google OAuth and identity token generation |
| **DiceBear API** | `HTTP API`| Deterministic SVG avatar generation based on user seeds |

### Backend API & Real-Time Server
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `18+ / 20+` | Server runtime environment |
| **Express** | `^5.2.1` | REST API routing, middleware pipeline, and HTTP handlers |
| **Socket.io** | `^4.8.3` | Real-time WebSocket server with rooms and heartbeat monitoring |
| **PostgreSQL (`pg`)**| `^8.23.0` | Relational persistence, connection pooling, and ACID transactions |
| **Redis (`ioredis`)**| `^5.11.1` | High-performance in-memory cache and pub/sub message broker |
| **BullMQ** | `^5.81.3` | Distributed, reliable submission job queue |
| **JSONWebTokens** | `^9.0.3` | Stateless authentication tokens for API and WebSocket handshakes |
| **Bcrypt.js** | `^3.0.3` | Secure password hashing (salted bcrypt rounds) |
| **Nodemailer** | `^9.0.5` | Transactional email delivery for OTP verification & password resets |
| **Firebase Admin** | `^14.3.0` | Server-side Firebase ID token verification |

### Sandbox & Judge Workers
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Docker** | `Engine 24+` | Container isolation for untrusted user code execution |
| **Alpine Linux** | `node:20-alpine` | Minimal container base image to minimize attack surface |
| **GCC / G++** | `13+` | C++17 compiler with `nlohmann-json` header support |
| **Python 3** | `3.11+` | Python runtime with custom AST wrapper for tree/list manipulation |
| **OpenJDK** | `17` | Java runtime and compiler (`javac` / `java`) |
| **Node.js VM** | `node:vm` | In-process VM sandbox for ultra-fast JavaScript evaluations |

---

## 🔒 Judge & Docker Sandbox Engine

The sandbox worker executes untrusted user submissions inside locked-down Docker containers. Every submission is mounted read-only with ephemeral scratch memory.

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER SANDBOX (UID 1001)                │
│                                                             │
│  [--network none]           No internet or socket access   │
│  [--memory 256m]            Hard limit (OOM killed if >256MB)│
│  [--memory-swap 256m]       Disables swap memory            │
│  [--cpus 0.5]               Strict CPU core quota           │
│  [--pids-limit 50]          Prevents fork bombs             │
│  [--read-only]              Immutable root filesystem       │
│  [--tmpfs /tmp:32m]         Non-executable scratch space    │
│  [-v /tmp/run_xyz:/sandbox:ro] Code mounted READ-ONLY       │
│                                                             │
│   Compiled Binary / Script  ───> Ingests Testcases JSON     │
│                             ───> Emits Single Verdict Line  │
└─────────────────────────────────────────────────────────────┘
```

### Supported Language Harnesses:
1. **JavaScript**: Supports standard ES6+ syntax, functions named `solution` or class `Solution`, and automatic `TreeNode` / `ListNode` reconstruction.
2. **Python 3**: Supports `def solution(...)` or `class Solution`, handling recursion depth, lists, and binary trees.
3. **C++ (C++17)**: Compiled via `g++ -O3 -std=c++17`. Features automated JSON parsing with `nlohmann::json` and standard STL containers.
4. **Java (OpenJDK 17)**: Compiled via `javac Solution.java` and executed with memory-tuned flags (`-Xmx192m -Xms64m`).

### Verdict Codes:
- `ACCEPTED`: All test cases passed with matching expected outputs.
- `WRONG_ANSWER`: One or more test cases yielded mismatched outputs.
- `TIME_LIMIT_EXCEEDED`: Execution exceeded sandbox timeout (default: 5000ms - 8000ms).
- `RUNTIME_ERROR`: Process crashed, threw unhandled exception, syntax error, or hit OOM limit.

---

## 🏆 Elo Rating & Competitive Model

AlgoArena uses an enhanced Elo formula tailored for competitive coding duels:

$$\text{Expected Score } E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$

### Dynamic Parameters:
- **K-Factor Scale**:
  - $\le 5$ matches: $K = 48$ (Rapid calibration placement)
  - $6 - 15$ matches: $K = 36$
  - Normal tier: $K = 32$
  - Expert tier ($>1600$): $K = 24$
  - Grandmaster tier ($>2000$): $K = 16$ (Rating stability)
- **Problem Difficulty Multiplier**:
  - **Easy**: $\times 0.85$
  - **Medium**: $\times 1.00$
  - **Hard**: $\times 1.30$
- **Speed Bonus**:
  - Solved in $\le 5$ min: $+5$ Elo bonus
  - Solved in $\le 10$ min: $+3$ Elo bonus
  - Solved in $\le 20$ min: $+1$ Elo bonus
- **Wrong Attempt Penalty**: $-1$ Elo per failed submission (capped at $-4$).

---

## 📡 Real-Time Socket.io Protocol

All real-time communication between players and the server is handled via authenticated Socket.io connections.

### Client-to-Server Events

| Event Name | Payload Format | Description |
| :--- | :--- | :--- |
| `join_queue` | `{ topic: string, difficulty: string }` | Enters the ranked matchmaking queue |
| `leave_queue` | `None` | Removes player from all matchmaking queues |
| `rejoin_match` | `{ roomId: string }` | Reconnects to an ongoing match after disconnect |
| `code_change` | `{ roomId, lineCount, charCount, isTyping }` | Sends typing activity and metrics to opponent |
| `submit_code` | `{ roomId, code, language, topic, difficulty }` | Submits code for sandbox judging |
| `resign_match` | `{ roomId: string }` | Forfeits the ongoing match immediately |
| `create_custom_room` | `{ topic: string, difficulty: string }` | Creates a private custom battle room |
| `join_custom_room` | `{ code: string }` | Joins a private room using a 6-character code |
| `cancel_custom_room` | `{ code: string }` | Host closes the pending custom room |

### Server-to-Client Events

| Event Name | Payload Format | Description |
| :--- | :--- | :--- |
| `queue_status` | `{ status, position, topic, difficulty }` | Queue state update (`waiting` / `cancelled`) |
| `match_found` | `{ roomId, matchId, problem, players, duration }` | Match created; initiates battle countdown |
| `opponent_code_change` | `{ lineCount, charCount, isTyping }` | Live opponent editor telemetry |
| `submission_progress` | `{ username, verdict, testIndex, totalTests }` | Streaming progress during test suite execution |
| `submission_result` | `{ username, verdict, runtimeMs, passCount }` | Final verdict for a submission |
| `match_end` | `{ winner, loser, reason, ratingUpdates }` | Match outcome, winner declaration, and Elo deltas |
| `player_disconnected` | `{ userId, username, timeoutSec }` | Alerts opponent that player disconnected |
| `player_reconnected` | `{ userId, username }` | Alerts opponent that player reconnected |
| `match_state_restored` | `{ matchId, problem, players, timeRemaining }` | Restores full match state after refresh |
| `custom_room_created` | `{ code, roomId, topic, difficulty }` | Confirms custom room creation |
| `custom_room_error` | `{ message: string }` | Custom room error notification |

---

## 🗄️ Database Schema & Architecture

The database is built on PostgreSQL with UUID primary keys (`pgcrypto` extension) and optimized index structures.

```
 ┌──────────────────────┐         ┌──────────────────────┐
 │        users         │         │       problems       │
 ├──────────────────────┤         ├──────────────────────┤
 │ id (UUID, PK)        │         │ id (UUID, PK)        │
 │ username (VARCHAR)   │         │ title (VARCHAR)      │
 │ email (VARCHAR)      │         │ description (TEXT)   │
 │ password (VARCHAR)   │         │ topic (VARCHAR)      │
 │ elo_rating (INT)     │         │ difficulty (VARCHAR) │
 │ wins (INT)           │         │ sample_input (TEXT)  │
 │ losses (INT)         │         │ sample_output (TEXT) │
 │ avatar_seed (TEXT)   │         └──────────┬───────────┘
 └──────────┬───────────┘                    │ 1
            │ 1                              │
            │                                │ N
            │ N                   ┌──────────┴───────────┐
 ┌──────────┴───────────┐         │      test_cases      │
 │       matches        │         ├──────────────────────┤
 ├──────────────────────┤         │ id (UUID, PK)        │
 │ id (UUID, PK)        │         │ problem_id (UUID, FK)│
 │ player_one_id (FK)   │         │ input (TEXT)         │
 │ player_two_id (FK)   │         │ output (TEXT)        │
 │ problem_id (FK)      │         │ is_hidden (BOOLEAN)  │
 │ winner_id (FK)       │         └──────────────────────┘
 │ topic / difficulty   │
 │ status (active/done) │
 └──────────┬───────────┘
            │ 1
            │
            │ N
 ┌──────────┴───────────┐         ┌──────────────────────┐
 │     submissions      │         │     elo_history      │
 ├──────────────────────┤         ├──────────────────────┤
 │ id (UUID, PK)        │         │ id (UUID, PK)        │
 │ match_id (UUID, FK)  │         │ user_id (UUID, FK)   │
 │ user_id (UUID, FK)   │         │ match_id (UUID, FK)  │
 │ code (TEXT)          │         │ old_rating (INT)     │
 │ language (VARCHAR)   │         │ new_rating (INT)     │
 │ verdict (VARCHAR)    │         │ delta (INT)          │
 │ runtime_ms (INT)     │         │ created_at (TS)      │
 └──────────────────────┘         └──────────────────────┘
```

---

## 🌐 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account with username, email, password.
- `POST /api/auth/login` — Authenticate and obtain JWT token.
- `POST /api/auth/send-otp` — Request 6-digit OTP for email verification / passwordless login.
- `POST /api/auth/verify-otp` — Validate 6-digit OTP and issue JWT.
- `POST /api/auth/firebase` — Exchange Firebase Google OAuth token for AlgoArena JWT.
- `POST /api/auth/forgot-password` — Send password reset token to email.
- `POST /api/auth/reset-password` — Set new password using verified OTP/token.

### Users & Profiles (`/api/users`)
- `GET /api/users/stats` — Platform-wide stats (total users, matches played, submissions).
- `GET /api/users/leaderboard` — Top 20 players ordered by Elo rating.
- `GET /api/users/me` — Authenticated user profile and rating data.
- `GET /api/users/me/history` — Recent match history for the current user.
- `GET /api/users/me/elo-history` — Historical rating data points for charts.
- `PATCH /api/users/me/username` — Update username.
- `PATCH /api/users/me/avatar` — Update avatar seed and style.
- `GET /api/users/search?q=:query` — Autocomplete search for usernames.
- `GET /api/users/:username/profile` — Public profile details for a given username.

### Problems (`/api/problems`)
- `GET /api/problems/stats` — Problem distribution across topics and difficulties.
- `GET /api/problems/daily` — Today's deterministic Daily Duel problem.
- `GET /api/problems` — Filter problems by `topic` and `difficulty`.
- `GET /api/problems/:id` — Retrieve problem description, examples, and starter templates.
- `POST /api/problems/:id/run` — Fast evaluation against visible sample test cases.

### Matches (`/api/matches`)
- `GET /api/matches` — List completed matches.
- `GET /api/matches/:id` — Match details, players, problem, submissions, and timeline.

### System & Health
- `GET /health` — Service health check, uptime, and environment status.
- `GET /queue-stats` — Live snapshot of in-memory matchmaking queues (dev mode).

---

## 📂 Directory Structure

```
algoarena/
├── backend/                        # API Gateway, WebSocket Server & Database
│   ├── db/                         # PostgreSQL connection & migrations
│   │   ├── schema.sql              # Core DDL tables, indexes, constraints
│   │   ├── seed_v3.js / seed_v4.js # 175+ Problem dataset & testcase seeders
│   │   └── verify.js               # Database connection verification script
│   ├── middleware/
│   │   ├── auth.js                 # Express JWT authentication middleware
│   │   └── socketAuth.js           # Socket.io handshake JWT verification
│   ├── queues/
│   │   ├── redisClient.js          # Shared ioredis client singleton
│   │   ├── submission.js           # BullMQ producer for code submissions
│   │   └── verdictSubscriber.js    # Redis pub/sub subscriber ("aa:verdicts")
│   ├── routes/
│   │   ├── auth.js                 # Registration, login, OTP, Firebase OAuth
│   │   ├── matches.js              # Match query endpoints
│   │   ├── problems.js             # Problem fetching & test runner
│   │   └── users.js                # Profiles, leaderboard, Elo analytics
│   ├── services/
│   │   └── judge.js                # Multi-language evaluation router
│   ├── socket/
│   │   ├── customRoom.js           # Private custom lobby socket handlers
│   │   ├── match.js                # In-match events, typing, resign, submit
│   │   └── matchmaking.js          # Elo-bucket matchmaking engine
│   ├── utils/
│   │   ├── elo.js                  # Elo calculation & tier mathematics
│   │   └── mailer.js               # Nodemailer SMTP email service
│   ├── index.js                    # Express + Socket.io main entrypoint
│   └── package.json
│
├── frontend/                       # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.jsx      # Monaco Editor wrapper
│   │   │   ├── EloDisplay.jsx      # Animated Elo rating component
│   │   │   ├── LeetCodeProblemView.jsx # Rich problem description panel
│   │   │   ├── Navbar.jsx          # Header navigation & auth controls
│   │   │   ├── OpponentStatus.jsx  # Live opponent activity widget
│   │   │   └── Timer.jsx           # Circular match timer
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # User auth state & session provider
│   │   ├── hooks/
│   │   │   ├── useAuth.js          # Custom hook for auth context
│   │   │   ├── useSocket.js        # Persistent WebSocket connection hook
│   │   │   └── useStreak.js        # Daily duel streak calculator
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page with interactive demo
│   │   │   ├── Leaderboard.jsx     # Global rankings & search
│   │   │   ├── Lobby.jsx           # Ranked matchmaking & custom rooms
│   │   │   ├── Match.jsx           # 1v1 Battle Arena & Split IDE
│   │   │   ├── Profile.jsx         # User profile, history & Elo charts
│   │   │   └── Result.jsx          # Post-match summary & Elo change modal
│   │   ├── utils/
│   │   │   ├── api.js              # Axios instance with auth interceptor
│   │   │   ├── avatar.jsx          # DiceBear avatar generator
│   │   │   ├── firebase.js         # Firebase client config
│   │   │   ├── problemSignatures.js# Starter code templates & typings
│   │   │   └── socket.js           # Socket.io client initializer
│   │   ├── App.jsx                 # Route definitions & layout wrappers
│   │   └── index.css               # Design tokens & animation utilities
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── workers/                        # Standalone Sandbox Worker & Judge
    ├── Dockerfile.sandbox          # Alpine Linux container with multi-compilers
    ├── judge.js                    # BullMQ Worker consumer & Redis publisher
    ├── sandbox.js                  # Docker process spawner & security jail
    ├── javaRunner.js               # Java testcase harness generator
    ├── all_175_problems_raw.json   # Canonical problem dataset with test cases
    └── package.json
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **PostgreSQL**: PostgreSQL database (local or hosted on Supabase / Neon)
- **Redis**: Redis instance (local or hosted on Upstash)
- **Docker**: Docker Desktop (required for C++, Python, and Java sandboxed execution)

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/algoarena.git
cd algoarena
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install worker dependencies
cd ../workers && npm install

# Return to root
cd ..
```

---

### 3. Configure Environment Variables

Create `.env` files in `backend/`, `workers/`, and `frontend/`:

#### `backend/.env`
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/algoarena
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# Optional: SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="AlgoArena <your-email@gmail.com>"

# Optional: Firebase Admin (for Google OAuth)
FIREBASE_PROJECT_ID=algoarena
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@algoarena.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

#### `workers/.env`
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/algoarena
REDIS_URL=redis://localhost:6379
SANDBOX_IMAGE=algoarena-sandbox
SANDBOX_TIMEOUT_MS=8000
WORKER_CONCURRENCY=3
```

#### `frontend/.env`
```env
VITE_API_URL=http://localhost:4000

# Optional: Firebase Client Config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=algoarena.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=algoarena
VITE_FIREBASE_STORAGE_BUCKET=algoarena.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

---

### 4. Database Setup & Problem Seeding

1. Execute `backend/db/schema.sql` in your PostgreSQL client (pgAdmin, psql, or Supabase SQL Editor).
2. Seed the curated problem dataset:
```bash
cd backend
node db/verify.js       # Verify database connection
node db/seed_v3.js      # Seed problems and full test suites
```

---

### 5. Build the Docker Sandbox Image
*(Required to run the code execution judge)*
```bash
docker build -t algoarena-sandbox -f workers/Dockerfile.sandbox workers/
```

Test the sandbox image:
```bash
cd workers
npm test                # Runs sandbox verification suite across all 4 languages
```

---

### 6. Start the Services

Open three separate terminals:

```bash
# Terminal 1: API Server & WebSocket Gateway
cd backend
npm run dev
# Running on http://localhost:4000
```

```bash
# Terminal 2: Background Submission Worker
cd workers
npm run dev
# Consuming jobs from BullMQ queue
```

```bash
# Terminal 3: Frontend Client
cd frontend
npm run dev
# Running on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Verification

| Target | Command | Purpose |
| :--- | :--- | :--- |
| **Backend DB** | `cd backend && npm run db:verify` | Checks DB connectivity and verifies required tables exist |
| **Sandbox Unit**| `cd workers && npm test` | Runs JS, Python, C++, and Java execution tests inside Docker |
| **Sandbox Net** | `cd workers && npm run test:network` | Validates that network isolation (`--network none`) is active |
| **Frontend Lint**| `cd frontend && npm run lint` | Runs `oxlint` static code analysis on frontend files |

---

## 🚢 Deployment Guide

### Recommended Cloud Stack:
- **Frontend SPA**: [Vercel](https://vercel.com) / [Netlify](https://netlify.com) / [Cloudflare Pages](https://pages.cloudflare.com)
- **API & WebSocket Server**: [Render](https://render.com) Web Service / [Fly.io](https://fly.io) / [Railway](https://railway.app)
- **PostgreSQL Database**: [Supabase](https://supabase.com) / [Neon](https://neon.tech)
- **Redis Queue & PubSub**: [Upstash Redis](https://upstash.com)
- **Judge Worker**: [Render](https://render.com) Background Worker / Docker Container Host

### Production Notes:
1. **WebSocket Sticky Sessions**: When scaling the API horizontally, configure Redis adapter (`@socket.io/redis-adapter`) for multi-node WebSocket broadcasting.
2. **Docker in Docker**: On cloud hosts where raw Docker socket access isn't available, workers can run with in-process VM sandboxing for JS and isolated microVMs / Judge0 instances for multi-language execution.

---

## 📄 License & Author

Distributed under the **ISC License**.

Created with ❤️ by **[Ayush](https://github.com/ayushoncode)**.

<div align="center">
  <sub>Built for competitive programmers, interview preppers, and problem solvers everywhere.</sub>
</div>
