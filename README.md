# CasePilot — Attorney Case Management Platform

<div align="center">

![MERN](https://img.shields.io/badge/Stack-MERN-00ADD8?style=flat-square&logo=mongodb)
![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)

**A full-stack legal tech dashboard for managing cases, clients, documents, tasks, and attorney workloads — built for law firms of any size.**

</div>

---

## Features

| Module | Highlights |
|--------|-----------|
| **Dashboard** | Personalized "My Work" row (my cases, tasks, docs), firm-wide KPI cards, 3 interactive charts, "This Week's Deadlines" timeline, recent-cases table, upcoming-hearings list |
| **Cases** | Full CRUD, filters (category / status / urgency), auto-generated refs (CP-YYYY-NNNN), detailed case profiles with **status progress pipeline**, print/export |
| **Documents** | Upload with drag-and-drop, revision tracking, review-status workflow (Draft → Filed), due-date alerts, remarks column |
| **Tasks** | List + Kanban board views, drag-and-drop stage changes (Backlog → Todo → In Progress → Review → Done → Dropped), checklist support, progress tracking |
| **Clients** | Card + Table views, tier badges (VIP / Premium / Standard), billing totals, standing status, internal notes |
| **Calendar** | Monthly grid with colored event dots (hearings, filings, tasks, doc deadlines), day-detail side panel, month navigation |
| **Insights** | Deep-dive analytics with **date range / attorney / category filters** — 4 performance KPIs, attorney performance charts (cases per attorney, task completion, case outcomes, workload balance), case pipeline funnel + category heatmap, document review-status pie |
| **Notifications** | Slide-in drawer, auto-alerts on every CRUD action, mark read / clear, 30-second polling |
| **Quick Search** | `Ctrl+K` overlay, parallel search across all collections, keyboard navigation, recent searches |
| **Team Members** | Admin-only member list, role display, admin toggle (grant/revoke admin status) |
| **My Account** | View & edit profile (name, email, role) |
| **Seed Data** | One-click demo-data generation (10 clients, 20 cases, 20 documents, 20 tasks) |

## Pages Walkthrough

### Login
- Branded sign-in page with pre-configured demo accounts
- Session stored in `localStorage`; no token-based auth (assignment scope)

### Dashboard (`/`)
1. **Greeting banner** — time-aware message ("Good morning, Arjun 👋"), today's date, attention-items count
2. **My Work row** — 3 cards personalised to the logged-in attorney:
   - *My Cases* (total + active), *My Tasks* (open + total), *My Docs*
3. **Firm KPI row** — Active Cases, Total Clients, Open Tasks, Docs Filed, Portfolio Value
4. **Charts row** — Cases by Category (bar), Status Overview (pie)
5. **Trend + Progress row** — Filing trend (area chart, last 6 months) + recent-cases quick-list
6. **This Week's Deadlines** — unified chronological list merging hearings (⚖), tasks (☑), and document due-dates (📄) within the next 7 days; color-coded urgency (TODAY / TOMORROW / X days)
7. **Tables row** — Recent Cases table (ref, title, category, attorney, status, urgency) + Upcoming Hearings (color-striped by days-left)

### Cases (`/cases`)
- Paginated card grid with filters for category, status, and urgency
- Each card shows ref, title, lead attorney, client name, filing/hearing dates, urgency badge
- **Case Profile** (`/cases/:id`) — full detail view with **status progress pipeline** (Pending → Active → On Hold → Appeal → Closed), overview, client link, documents, tasks, timeline, and hearing info
- **Export/Print** button for cases table

### Documents (`/documents`)
- Filterable table: name, type, review status, case ref, prepared-by, due date, remarks, revision
- Drag-and-drop file upload (Multer, 20 MB limit)
- Status workflow badges (Draft → Submitted → Under Review → Approved → Filed)

### Tasks (`/tasks`)
- List view with filters (stage, urgency, owner)
- Kanban board with drag-and-drop across stages (Backlog → Todo → In Progress → Review → Done → Dropped)
- Progress bar, checklist items, planned vs logged hours per task
- Urgency levels: Critical, High, Standard, Low

### Clients (`/clients`)
- Toggle between card grid and table view
- Tier badges (VIP, Premium, Standard), standing indicator, billing totals
- Internal notes displayed on cards (📝 icon)
- Full CRUD with detail drawer

### Calendar (`/calendar`)
- Monthly calendar grid; click any day to see that day's events
- Four event types with colored dots: **Hearing** (rose), **Filing** (emerald), **Task Deadline** (amber), **Doc Due** (violet)
- Navigation arrows, "Today" shortcut
- Empty-month alert with link to seed demo data when no events exist

### Insights (`/insights`)
- **Filter bar** — date range (1 month / 3 months / 6 months / 12 months), attorney dropdown, case category dropdown; all filters applied server-side
- **Performance Metrics** — 4 KPI cards: Total (in range), Resolution Rate %, Avg Task Completion %, Overdue Docs count
- **Attorney Performance** — 4 charts:
  1. Cases per Attorney — horizontal bar
  2. Task Completion Rate — vertical bar (% per attorney)
  3. Case Outcomes — stacked bar (Won / Lost / Settled / Open per attorney)
  4. Workload Balance — horizontal bar (tasks assigned per attorney)
- **Case Pipeline** — funnel chart (Pending → Active → On Hold → Appeal → Closed) + category heatmap (horizontal bar)
- **Document Health** — Review Status donut/pie (Draft / Submitted / Under Review / Approved / Filed)

### Notifications (drawer)
- Bell icon in top bar with unread count badge
- Slide-in panel listing auto-generated alerts for every create/update/delete action
- Mark all as read, clear all, or dismiss individually

### Quick Search (`Ctrl+K`)
- Modal overlay searches Cases, Clients, Documents, and Tasks in parallel
- Keyboard-navigable results grouped by collection
- Recent-search memory

### Team Members (`/team`)
- Admin-only page (requires `isAdmin` flag) listing all registered users with name, email, role, and admin status
- Toggle admin status for any member via clickable badge
- Add new team members with optional admin checkbox

### My Account (`/account`)
- View/edit current user's name, email, and role

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| Vite | 4.5 | Build tool & dev server |
| Tailwind CSS | 3.3 | Utility-first styling with custom design tokens |
| Recharts | 2.9 | Responsive SVG charts |
| Framer Motion | 10 | Page transitions & micro-animations |
| Headless UI | 1.7 | Accessible dialog / transition primitives |
| Lucide React | — | Icon library |
| React Hot Toast | 2.4 | Toast notifications |
| Axios | 1.6 | HTTP client with interceptors |
| React Router DOM | 6.18 | Client-side routing |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Express | 4.18 | HTTP framework |
| Mongoose | 7.6 | MongoDB ODM |
| Multer | — | File upload handling (20 MB limit) |
| Helmet | — | Security headers |
| CORS | — | Cross-origin requests |
| Morgan | — | Request logging |
| Express Validator | — | Input validation |

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on `mongodb://localhost:27017`
- **npm** or **yarn**

## Installation

### 1. Clone & Install

```bash
# Backend
cd casepilot/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Setup

Backend `.env`:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/casepilot
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:8080/api
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend (port 8080)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

### 4. Seed Demo Data

Click the **"Seed Demo Data"** button on the Dashboard, or:
```bash
curl http://localhost:8080/api/seed
```

## Default Login Credentials

| Name | Email | Password | Role |
|------|-------|----------|------|
| Arjun Mehta | arjun@casepilot.io | Pilot2026 | Managing Partner |
| Elena Vasquez | elena@casepilot.io | Pilot2026 | Senior Associate |
| Daniel Okafor | daniel@casepilot.io | Pilot2026 | Associate Attorney |
| Sofia Petrov | sofia@casepilot.io | Pilot2026 | Paralegal |
| Kevin Liang | kevin@casepilot.io | Pilot2026 | Junior Associate |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET / POST | `/api/cases` | List (paginated, filterable) / Create case |
| GET / PUT / DELETE | `/api/cases/:id` | Read / Update / Delete case |
| GET / POST | `/api/clients` | List / Create client |
| GET / PUT / DELETE | `/api/clients/:id` | Read / Update / Delete client |
| GET / POST | `/api/documents` | List / Create document |
| GET / PUT / DELETE | `/api/documents/:id` | Read / Update / Delete document |
| GET / POST | `/api/tasks` | List / Create task |
| GET / PUT / DELETE | `/api/tasks/:id` | Read / Update / Delete task |
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications` | Clear all notifications |
| GET | `/api/stats` | Dashboard data (counts, charts, myWork, deadlines) |
| GET | `/api/stats/insights` | Insights analytics with filters (`range`, `attorney`, `category`) |
| GET | `/api/search?q=term` | Cross-collection search |
| GET | `/api/calendar?year=&month=` | Calendar events for a month |
| POST | `/api/upload` | File upload (multipart) |
| GET | `/api/seed` | Generate demo data |

### Stats API Response Shape

```
GET /api/stats
Headers: x-user-name (auto-sent by frontend)

Response.data:
├── counts        — totalCases, activeCases, closedCases, pendingCases,
│                   totalClients, premiumClients, totalDocs, filedDocs,
│                   overdueDocs, totalTasks, doneTasks, overdueTasks
├── aggregated    — avgProgress, totalPortfolioValue
├── charts
│   ├── casesByCategory, casesByStatus, casesByMonth
│   ├── tasksByStage, docsByStatus
│   └── attorneyWorkload      ← cases per attorney
├── lists         — recentCases, upcomingHearings, latestAlerts
└── myWork
    ├── myCases, myActiveCases, myTasks, myOpenTasks, myDocs
    ├── myHearings
    └── weekDeadlines [ { type, label, date, meta, ref?, stage?, status? } ]
```

```
GET /api/stats/insights?range=12m&attorney=&category=

Response.data:
├── performance   — totalInRange, resolved, resolutionRate,
│                   avgTaskCompletion, overdueDocs
├── attorneys[]   — { name, cases, tasksDone, totalTasks,
│                   completionRate, outcomes { Won, Lost, Settled, Open },
│                   taskCount }
├── pipeline
│   ├── statusFunnel[]    — [{ name, value }] per case status
│   └── categoryHeatmap[] — [{ name, value }] per category
└── documents
    └── docsByStatus[]    — [{ name, value }] per review status
```

## Project Structure

```
casepilot/
├── backend/
│   ├── config/db.js           # MongoDB connection
│   ├── middleware/             # Error handler
│   ├── models/                 # Mongoose schemas (5)
│   │   ├── Case.js
│   │   ├── Client.js
│   │   ├── Document.js
│   │   ├── Task.js
│   │   └── Notification.js
│   ├── routes/                 # Express routes (10)
│   │   ├── cases.js
│   │   ├── clients.js
│   │   ├── documents.js
│   │   ├── tasks.js
│   │   ├── notifications.js
│   │   ├── stats.js
│   │   ├── search.js
│   │   ├── calendar.js
│   │   ├── upload.js
│   │   └── seed.js
│   ├── utils/notifyHelper.js  # Auto-notification creator
│   ├── uploads/                # Uploaded files directory
│   └── server.js               # Express entry point
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Axios API layer with interceptors
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar (collapsible, tooltips), TopBar, PageShell
│   │   │   ├── ui/             # 9 reusable primitives (KPICard, Badge, Dialog, FilterBar, Paginator, etc.)
│   │   │   ├── charts/         # 4 Recharts wrappers (CasesBarChart, StatusPieChart, FilingTrendChart, TaskDonutChart)
│   │   │   ├── QuickSearch.jsx # Ctrl+K search overlay
│   │   │   └── AlertsDrawer.jsx# Notifications slide-in panel
│   │   ├── hooks/              # useApi, useDebounce, useLocalStorage
│   │   ├── pages/              # 11 page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Cases.jsx
│   │   │   ├── CaseProfile.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── MyAccount.jsx
│   │   │   └── TeamMembers.jsx
│   │   ├── utils/              # authStore (session), formatters (date, currency, colors)
│   │   ├── App.jsx             # Root component with React Router
│   │   ├── main.jsx            # React DOM entry
│   │   └── index.css           # Tailwind directives & custom classes
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Design System

| Token | Value |
|-------|-------|
| **Primary** | Indigo `#4F46E5` |
| **Secondary** | Teal `#0D9488` |
| **Accent** | Violet `#7C3AED` |
| **Background** | `#F5F7FF` |
| **Heading Font** | Plus Jakarta Sans |
| **Body Font** | Inter |
| **Mono Font** | Fira Code |
| **Card Radius** | 16 px |
| **Badge Radius** | 20 px |
| **Input Radius** | 10 px |

## MongoDB Collections

| Collection | Key Fields |
|------------|-----------|
| **Cases** | ref, title, category, status, urgency, clientId, leadAttorney, supportingCounsel, court, hearingDate, filedOn, portfolioValue, labels |
| **Clients** | fullName, email, org, entityType, tier, standing, totalBilled, totalPaid |
| **Documents** | name, caseId, docType, reviewStatus, preparedBy, fileUrl, fileSizeBytes, revision, dueBy |
| **Tasks** | title, caseId, owner, createdBy, stage, urgency, deadline, plannedHours, loggedHours, progress, checklist |
| **Notifications** | level, heading, body, entity, read, expireAt (30-day TTL) |

---

<div align="center">
Built with ❤️ for Medicodio Assignment
</div>
