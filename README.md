<div align="center">
<img width="1200" height="475" alt="Structura Banner" src="/assets/structura.png" />

# STRUCTURA

### Enterprise Construction Intelligence & Oversight OS

**Building Tomorrow. Together.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## Overview

**Structura** is a full-stack enterprise construction lifecycle platform designed for building owners, real estate developers, project directors, general contractors, and structural QA/QC auditors. It provides an end-to-end control cockpit for managing construction projects from initial estimation through handover, powered by **AI** for intelligent insights, visual inspection, and automated reporting.

The platform combines a **React + TypeScript** frontend (built with Vite) with an **Express.js** backend server, leveraging AI-driven analysis for cost estimation, site photo inspection, periodic situation reports (SITREPs), and a conversational construction advisor.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Building for Production](#building-for-production)
- [Core Modules](#core-modules)
  - [Stakeholder Portal Hub](#stakeholder-portal-hub)
  - [Project Estimator Wizard](#project-estimator-wizard)
  - [Executive Overview Dashboard](#executive-overview-dashboard)
  - [Periodic Monitoring & SITREP](#periodic-monitoring--sitrep)
  - [AI Visual Site Inspection](#ai-visual-site-inspection)
  - [Budget Variance & Escrow Tracker](#budget-variance--escrow-tracker)
  - [Finished Building Visualizer](#finished-building-visualizer)
  - [AI Construction Advisor](#ai-construction-advisor)
- [API Endpoints](#api-endpoints)
- [Role-Based Access Control](#role-based-access-control)
- [Data Model](#data-model)
- [NPM Scripts](#npm-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

| Feature | Description |
|---|---|
| **Stakeholder Governance** | Role-based portal hub with dedicated dashboards for Owners, Project Directors, General Contractors, and QA/QC Auditors |
| **AI Cost Estimation** | Domain-engineered cost estimation with structural core, foundation, MEP, and interior finish multipliers, enhanced by Gemini AI insights |
| **Site Photo Vision AI** | Upload construction site photos for AI-powered defect detection, compliance scoring, safety observations, and completion estimation |
| **Automated SITREPs** | Generate Daily, Weekly, Fortnightly, or Monthly Situation Reports with Earned Value Analysis (CPI/SPI), budget alerts, and owner action items |
| **Budget & Escrow Tracker** | Bill of Quantities (BOQ) tracking with variance analysis, milestone-linked escrow release, and cost performance dashboards |
| **3D Building Visualizer** | Interactive Three.js-powered 3D model viewer and 360-degree panoramic tour of proposed and finished buildings |
| **AI Chat Advisor** | Conversational AI assistant acting as a Senior Construction Executive for real-time project guidance |
| **Dark/Light Theme** | Full theme support with architectural blueprint grid backgrounds and smooth transitions |
| **Persistent Projects** | Projects are persisted to localStorage and pre-loaded with realistic sample data |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks and context |
| **TypeScript 5.8** | Type-safe development |
| **Vite 6** | Build tooling and HMR dev server |
| **Tailwind CSS 4** | Utility-first styling via Vite plugin |
| **Motion (Framer Motion)** | Page transitions, animations, and micro-interactions |
| **Three.js** | 3D building model rendering and panoramic viewers |
| **Recharts** | Data visualization (S-curves, charts, graphs) |
| **Lucide React** | Icon library |

### Backend

| Technology | Purpose |
|---|---|
| **Express.js** | REST API server |
| **Google Gemini AI** | AI-powered estimation, vision inspection, SITREP generation, and chat advisor |
| **dotenv** | Environment variable management |
| **esbuild** | Server-side bundling for production |
| **tsx** | TypeScript execution for development |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                   │
│                                                       │
│  React 19 + TypeScript + Tailwind CSS + Motion       │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐    │
│  │Stakeholder│ │  Module  │ │   3D Visualizer   │    │
│  │  Portal   │ │  Panels  │ │  (Three.js/360°)  │    │
│  └──────────┘ └──────────┘ └───────────────────┘    │
│          │              │              │               │
│          └──────────────┼──────────────┘               │
│                         │                              │
│                    fetch / API                         │
└─────────────────────────┬─────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────┐
│              Express.js Server (port 3000)             │
│                                                       │
│  /api/health          → Health check                  │
│  /api/projects/*      → Estimation & project logic    │
│  /api/ai/*            → Gemini AI powered endpoints   │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │         Google Gemini AI (gemini-3.7-flash)   │    │
│  │  - Architectural insights & value engineering │    │
│  │  - Vision-based site photo defect analysis    │    │
│  │  - Situation Report synthesis                 │    │
│  │  - Conversational construction advisor        │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  Dev: Vite middleware (HMR)                           │
│  Prod: Static files from /dist                        │
└───────────────────────────────────────────────────────┘
```

---

## Project Structure

```
structura/
├── assets/
│   └── structura.png              # Banner image
├── src/
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Root app with routing, roles, and state
│   ├── types.ts                   # TypeScript interfaces and type definitions
│   ├── index.css                  # Tailwind imports, CSS variables, custom styles
│   ├── vite-env.d.ts              # Vite environment type declarations
│   ├── context/
│   │   └── ThemeContext.tsx        # Dark/light theme provider
│   ├── data/
│   │   └── sampleProjects.ts      # Pre-loaded sample construction projects
│   ├── components/
│   │   ├── Navbar.tsx             # Top navigation bar with project/role selector
│   │   ├── StructuraLogo.tsx      # Animated brand logo component
│   │   ├── MotionBackground.tsx   # Ambient animated background
│   │   ├── ExecutiveOverview.tsx  # Executive KPI dashboard
│   │   ├── ProjectEstimatorWizard.tsx   # Multi-step project creation wizard
│   │   ├── PeriodicMonitoringSITREP.tsx # SITREP generation & viewing
│   │   ├── VisualInspectionAI.tsx       # AI site photo analysis
│   │   ├── BudgetVarianceEscrow.tsx     # BOQ & budget tracking
│   │   ├── FinishedBuildingVisualizer.tsx # 3D building & panoramic viewer
│   │   ├── AIConsultantModal.tsx        # AI advisor chat modal
│   │   ├── AccessRestrictedView.tsx     # Unauthorized access view
│   │   ├── 3d/
│   │   │   ├── Building3DModel.tsx      # Three.js 3D building renderer
│   │   │   └── Panorama360Viewer.tsx    # 360-degree panoramic viewer
│   │   └── stakeholders/
│   │       ├── StakeholderPortalHub.tsx       # Landing page / role selection
│   │       ├── OwnerDashboard.tsx             # Owner-specific dashboard
│   │       ├── ProjectDirectorDashboard.tsx   # Director-specific dashboard
│   │       ├── GeneralContractorDashboard.tsx # Contractor-specific dashboard
│   │       └── StructuralQADashboard.tsx      # QA/QC auditor dashboard
│   └── assets/
│       └── images/                # Image assets
├── structura/                     # Git submodule / additional files
├── server.ts                      # Express backend with Gemini AI endpoints
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration with Tailwind plugin
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
├── LICENSE                        # MIT License
└── README.md                      # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **bun** (bun.lock included)
- **Google Gemini API Key** (for AI features — optional, app runs with fallback data without it)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/structura.git
   cd structura
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | No* | Google Gemini API key for AI-powered features (estimation insights, vision inspection, SITREPs, chat advisor). The app gracefully falls back to computed models without it. |
| `APP_URL` | No | The URL where the app is hosted. Auto-injected by AI Studio when deployed to Cloud Run. |
| `DISABLE_HMR` | No | Set to `true` to disable Vite HMR and file watching (used in AI Studio agent mode to prevent flickering). |

> *Without a `GEMINI_API_KEY`, all modules function with domain-engineered fallback data. AI-specific insights will be replaced with pre-computed engineering models.

### Running Locally

**Development mode** (with Vite HMR):

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

**Production mode:**

```bash
npm run build
npm run start
```

### Building for Production

```bash
npm run build
```

This runs:
1. `vite build` — Bundles the React frontend to `/dist`
2. `esbuild server.ts` — Bundles the Express server to `dist/server.cjs`

Then start with:

```bash
npm run start
```

---

## Core Modules

### Stakeholder Portal Hub

The landing page of the application. Users select their role to access a tailored dashboard:

- **Owner / Client** — Financial summaries, confidence scores, finished building renders, budget alerts
- **Senior Project Director** — Full cockpit access: estimation, monitoring, inspection, budget, renders
- **General Contractor** — Monitoring, site inspection, budget tracking
- **Structural QA/QC Auditor** — Inspection reports, compliance monitoring, visual verification

### Project Estimator Wizard

A multi-step wizard for creating new construction projects:

1. **Land Specifications** — Plot area, topography, soil type, zoning, setback dimensions, location
2. **Floor Plan** — GFA, floors, building style, rooms, special features (pool, basement, rooftop)
3. **Materials & Structural** — Structural core, foundation, facade, roof, MEP tier, interior grade
4. **Cost Estimation** — Engineered cost breakdown with trade-level detail and AI value engineering notes
5. **Visual Proposal** — AI-generated architectural rendering prompt and 360-degree proposed views

### Executive Overview Dashboard

High-level project KPIs including:

- Overall progress and confidence score
- Budget vs. actual spend with forecast at completion
- S-curve visualization (planned, actual, earned value)
- Milestone timeline with escrow status
- Quick access to AI advisor

### Periodic Monitoring & SITREP

Generate and review Situation Reports with configurable cadence (Daily / Weekly / Fortnightly / Monthly):

- Earned Value Analysis (CPI, SPI, cost/schedule variance)
- Key accomplishments and upcoming milestones
- Budget variance alerts with trade-level detail
- Owner action items requiring approval
- Print-ready SITREP export

### AI Visual Site Inspection

Upload construction site photographs for AI-powered analysis:

- **Overall Health** — Optimal / Caution / Critical rating
- **Completion Estimate** — Progress percentage for the visible trade/zone
- **Defect Findings** — Severity, title, description, and recommendations
- **Compliance Score** — Engineering best practices adherence (0-100)
- **Safety Observations** — PPE compliance, edge protection, housekeeping
- **Variance Alerts** — Schedule alignment deviations

### Budget Variance & Escrow Tracker

Comprehensive financial tracking:

- **Bill of Quantities (BOQ)** — Trade-level cost items with unit rates, quantities, spent amounts, and variance percentages
- **Milestone Escrow** — Payment release tied to milestone completion and certification clearance
- **S-Curve Data** — Monthly planned vs. actual spend vs. earned value charts
- **Variance Alerts** — Automated flagging of cost overruns and favorable variances

### Finished Building Visualizer

Interactive visualization of proposed and completed buildings:

- **3D Building Model** — Three.js-powered interactive 3D viewer
- **360-Degree Panoramic Tours** — Exterior, interior, rooftop, and structural views
- **Multiple Angle Views** — Switch between different perspectives
- **AI Rendering Prompts** — Photorealistic architectural visualization descriptions

### AI Construction Advisor

A floating AI chat assistant available on every screen:

- Acts as a **Senior Construction Executive** with 35 years of EPC experience
- Answers questions about cost breakdowns, structural integrity, material trade-offs
- Provides guidance on contractor milestones, risk mitigations, and variation claims
- Context-aware — uses current project data for personalized responses

---

## API Endpoints

The Express server exposes the following REST API:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — returns `{ status: 'ok', hasGeminiKey: boolean }` |
| `POST` | `/api/projects/estimate-and-propose` | Accepts building specifications, returns engineered cost breakdown and AI architectural insights |
| `POST` | `/api/ai/analyze-site-photo` | Accepts a base64 image + context, returns AI-powered defect analysis, compliance score, and safety observations |
| `POST` | `/api/ai/generate-sitrep` | Accepts project logs and budget metrics, returns a structured Situation Report |
| `POST` | `/api/ai/chat-advisor` | Accepts chat messages + project context, returns AI advisor response |

All AI endpoints gracefully fall back to domain-engineered models when the Gemini API is unavailable.

---

## Role-Based Access Control

Each role has a specific set of permitted navigation tabs:

| Tab | Owner | Director | Contractor | QA/QC |
|---|---|---|---|---|
| Stakeholder Hub | ✅ | ✅ | ✅ | ✅ |
| Role Dashboard | ✅ | ✅ | ✅ | ✅ |
| Executive Cockpit | — | ✅ | — | — |
| Monitoring / SITREP | ✅ | ✅ | ✅ | ✅ |
| Site Inspection | — | ✅ | ✅ | ✅ |
| Budget / Escrow | ✅ | ✅ | ✅ | — |
| Finished Render | ✅ | ✅ | — | ✅ |
| New Estimator | — | ✅ | — | — |

Attempting to access an unauthorized tab shows an **Access Restricted View** with navigation back to permitted areas.

---

## Data Model

Key TypeScript interfaces (defined in `src/types.ts`):

| Interface | Purpose |
|---|---|
| `ConstructionProject` | Top-level project entity with all specs, milestones, BOQ, photos, logs, and renders |
| `LandSpecifications` | Plot area, topography, soil type, zoning, setback dimensions |
| `FloorPlanSpecifications` | GFA, floors, style, ceiling height, rooms, features |
| `MaterialSpecifications` | Structural core, foundation, facade, roof, MEP, interior grade |
| `BOQItem` | Individual Bill of Quantities line item with cost and variance tracking |
| `ConstructionMilestone` | Phase milestone with dates, progress, escrow, and certification status |
| `SitePhotoInspection` | Photo record with AI analysis results |
| `PeriodicLogEntry` | Daily/weekly activity log with weather, manpower, tasks, spend |
| `SituationReport` | Generated SITREP with EVM, accomplishments, alerts, action items |

---

## NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Vite HMR on port 3000 |
| `npm run build` | Build frontend (Vite) and bundle server (esbuild) to `/dist` |
| `npm run start` | Start production server from `dist/server.cjs` |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove `dist/` directory and `server.js` |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`) |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all TypeScript types are correct by running `npm run lint` before submitting.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Olalekan Sanni
