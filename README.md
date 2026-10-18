# UNFAZED — Practice Management Platform for Therapists in India

**UNFAZED** is a full-stack, production-ready SaaS application engineered for mental health professionals in India to manage their private practices through **one branded link** (e.g. `unfazed.in/dr-sharma`).

---

## 🌟 Key Features

1. **Branded Practice Link (`unfazed.in/:slug`)**:
   - Digital front door showcasing practitioner bio, credentials, fees, languages, and clinic details.
   - Public slot booking with real-time availability and client intake capture.
   - Bank-grade data sanitization (sensitive fields like personal phone and passwords never exposed).

2. **Atomic Scheduling & Double-Booking Prevention**:
   - Server-side slot calculation supporting weekly schedules, blocked dates, and custom date overrides.
   - Configurable rest buffers (e.g., 15 minutes) between consultations.
   - Atomic concurrency checks preventing duplicate bookings for the same time slot (returns HTTP 409 Conflict).

3. **Multi-Theme Engine & Claymorphism UI**:
   - **10 Master Theme Presets**: Emerald & Gold, Navy & Cyan, Charcoal & Electric Blue, Black & Lime, Orange & Navy, Purple & Pink, Red & Cream, Golden Yellow & Electric Violet, Forest Green & Blush Pink, Royal Plum & Mint Mist.
   - **Tactile Claymorphism**: Soft 3D inflated cards (`.clay-card`), tactile buttons (`.clay-btn`), badges (`.clay-badge`), and metric counters (`.clay-stat`).
   - Light, Dark, and OS-matched System modes with local persistence and backend synchronization.

4. **Client CRM & Lead Pipeline**:
   - Patient caseload management with contact details, tags, and status tracking.
   - Inbound lead capture with 1-click lead-to-client conversion without data loss or duplicates.
   - Secure digital intake forms and mandatory informed consent audit trail (IP address, user agent, timestamp).

5. **Clinical Notes Isolation Barrier**:
   - Standardized SOAP (Subjective, Objective, Assessment, Plan), DAP, and Freeform notes.
   - Strict architectural separation: private clinical notes are filtered at database and controller levels. Clients can only see shared therapeutic exercises and reflection notes.

6. **Payments, GST Invoicing & Package Tracking**:
   - Razorpay integration (test simulation mode and live credentials mode).
   - Automated 18% GST calculation (split into 9% CGST + 9% SGST).
   - Instant downloadable GST-compliant PDF invoices powered by PDFKit.
   - Multi-session package management (3, 6, 12 sessions) with validity dates and balance deductions.

7. **Real-Time Clinical Chat & Notifications**:
   - Authenticated WebSocket communication via Socket.IO with typing indicators and read receipts.
   - Centralized notifications bell with mark-all-read capabilities.

8. **Aggregation-Based Analytics**:
   - Native MongoDB aggregation pipelines computing 30-day revenue trends, session completion rates, no-show percentages, and service breakdowns.

---

## 🏗️ Technology Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose ORM), Socket.IO, JWT, PDFKit, Jest, Supertest.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6.
- **Styling Architecture**: Adaptive CSS variables + Claymorphism utilities.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance running locally on `mongodb://127.0.0.1:27017`

### 1. Backend Setup
```bash
cd unfazed-backend
npm install
npm run seed     # Seeds demo therapist, clients, sessions, and notes
npm run dev      # Launches backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd unfazed-frontend
npm install
npm run dev      # Launches Vite dev server on http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd unfazed-backend
npm test         # Runs full Jest test suite (11/11 tests)
```

---

## 🔑 Test Credentials (Pre-Seeded)

| Role | Email | Password | Primary Destination |
|---|---|---|---|
| **Therapist** | `dr.sharma@unfazed.in` | `Therapist123!` | `/dashboard` |
| **Client** | `rohan.verma@example.com` | `Client123!` | `/portal` |
| **Platform Admin** | `admin@unfazed.in` | `AdminUnfazed2026!` | `/dashboard` |

---

## 📂 Project Structure

```
├── unfazed-backend/
│   ├── src/
│   │   ├── config/          # Database & environment configurations
│   │   ├── controllers/     # Auth, scheduling, CRM, notes, payments, analytics
│   │   ├── middleware/      # JWT auth, role RBAC, subscription entitlements
│   │   ├── models/          # Mongoose models (Therapist, Client, Session, etc.)
│   │   ├── routes/          # Express REST API routes
│   │   ├── services/        # Payments, invoices, notifications, analytics
│   │   ├── sockets/         # Socket.IO WebSocket handlers
│   │   ├── tests/           # Automated Jest test suites
│   │   └── utils/           # Database seed script
│   └── package.json
│
├── unfazed-frontend/
│   ├── src/
│   │   ├── components/      # Common UI components (Navbar, Modal, Button, Badge)
│   │   ├── context/         # Auth, Theme, and Socket contexts
│   │   ├── pages/
│   │   │   ├── auth/        # Login, Register, Forgot Password
│   │   │   ├── client/      # Client Care Portal
│   │   │   └── therapist/   # Dashboard (Calendar, CRM, Notes, Payments, Analytics)
│   │   ├── index.css        # Multi-theme design tokens & Claymorphism classes
│   │   └── App.jsx          # Root routing and role guards
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 📜 License
MIT License. Built for mental health practitioners.
