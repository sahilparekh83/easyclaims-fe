# EasyClaims Frontend

Next.js 15 frontend for the EasyClaims Membership CRM — three portals (Admin, Partner, Member) with a unified design system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router) + React 19 + TypeScript |
| Styling | styled-components 6 (all UI — no CSS modules) |
| Data fetching | TanStack Query (react-query) v5 |
| Form components | PrimeReact 10 (Dialog, Dropdown, InputText) |
| Auth state | Zustand 5 |
| HTTP client | Axios (JWT interceptor auto-attaches Bearer token) |
| Icons | Lucide React |
| Forms | React Hook Form |
| Notifications | React Toastify |

## Prerequisites

- Node.js 18+
- npm (comes with Node)
- EasyClaims Backend running on port 8000

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/sahilparekh83/easyclaims-fe.git
cd easyclaims-fe
git checkout dev
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

`.env.local` contents:

```env
# Point to the running backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 4. Run development server

```bash
npm run dev
```

Open **http://localhost:3000**

> If port 3000 is in use, Next.js auto-selects the next available port (3001, 3002, …).

### 5. Build for production

```bash
npm run build
npm start
```

---

## Portals and Routes

| Portal | Base URL | Role Required |
|--------|----------|---------------|
| Login | `/login` | Public |
| Admin | `/admin/dashboard` | Admin |
| Partner | `/partner/dashboard` | Partner |
| Member | `/member/dashboard` | Member |

After OTP login, users are auto-redirected to the correct portal based on their role.

### Admin portal pages

| Page | URL |
|------|-----|
| Dashboard | `/admin/dashboard` |
| Membership Plans | `/admin/plans` |
| Members | `/admin/members` |
| Partners | `/admin/partners` |
| Policies | `/admin/policies` |
| Reports | `/admin/reports` |
| Policy Types | `/admin/policy-types` |
| Notifications | `/admin/notifications` |
| Email Templates | `/admin/email-templates` |

### Partner portal pages

| Page | URL |
|------|-----|
| Dashboard | `/partner/dashboard` |
| Members | `/partner/members` |
| Policies | `/partner/policies` |
| Plans | `/partner/plans` |
| Profile | `/partner/profile` |
| Notifications | `/partner/notifications` |

### Member portal pages

| Page | URL |
|------|-----|
| Dashboard | `/member/dashboard` |
| My Plan | `/member/plan` |
| Profile | `/member/profile` |
| Family | `/member/family` |
| Nominees | `/member/nominees` |
| Policies | `/member/policies` |
| Consent | `/member/consent` |
| Notifications | `/member/notifications` |

---

## Project Structure

```
easyclaims-fe/
├── app/
│   ├── globals.css              # Design tokens, Google Fonts, PrimeReact overrides
│   ├── layout.tsx               # Root layout (providers)
│   ├── providers.tsx            # QueryClient + StyledComponentsProvider
│   ├── login/
│   │   └── page.tsx             # OTP login page (navy left panel + white form)
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx       # Admin shell (Sidebar + main content)
│   │       ├── dashboard/
│   │       ├── plans/
│   │       ├── members/
│   │       ├── partners/
│   │       ├── policies/
│   │       ├── reports/
│   │       ├── policy-types/
│   │       ├── notifications/
│   │       └── email-templates/
│   ├── (partner)/
│   │   └── partner/             # Partner portal pages
│   └── (member)/
│       └── member/              # Member portal pages
│
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx          # Role-aware sidebar navigation
│   └── ui/                      # Shared UI components
│
├── imports/
│   └── core/
│       └── api.ts               # All Axios API call functions
│
├── stores/
│   ├── AuthStore.ts             # Zustand store (accessToken, user, role, clearAuth)
│   └── MemberStore.ts           # Member-specific state
│
├── hooks/
│   └── useDebounce.ts
│
├── lib/                         # Utilities and helpers
├── middleware.ts                # Next.js middleware (route protection by role)
├── .env.example                 # Environment variable template
└── public/
    ├── easyclaims-logo.png      # Full logo
    └── easyclaims-mark.svg      # Brand mark (used in sidebar + login)
```

---

## Design System

All styling is done with styled-components. CSS variables are defined in `app/globals.css`.

### Fonts (Google Fonts)

| Variable | Font | Usage |
|----------|------|-------|
| `--ec-font-display` | Plus Jakarta Sans | Headings, brand name |
| `--ec-font-body` | Public Sans | Body text, UI labels |
| `--ec-font-mono` | IBM Plex Mono | Numbers, badges, code |

### Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--ec-primary` | `#0050b0` | Primary blue — buttons, links, accents |
| `--ec-navy` | `#0a2a57` | Sidebar background, dark surfaces |
| `--ec-green-500` | `#65a147` | Active state accent, success |
| `--ec-green-400` | `#84ba52` | Plan card top bar |
| `--ec-green-300` | `#a3cd7a` | Subtle green, tagline text |

---

## Auth Flow

1. User enters email on `/login`
2. Backend sends OTP to that email
3. User enters 6-digit OTP
4. On success, backend returns JWE access token + sets HttpOnly refresh cookie
5. Access token stored in Zustand (memory only — not localStorage)
6. Axios interceptor attaches `Authorization: Bearer <token>` to all API requests
7. On token expiry, interceptor calls `/auth/refresh` transparently
8. Role from token payload determines which portal the user lands on

---

## Connecting to a Deployed Backend

Change `NEXT_PUBLIC_API_URL` in `.env.local` (or your hosting platform's env vars):

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

Ensure the backend's `CORS_ORIGINS` includes your frontend domain.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the EasyClaims Backend API |

All other configuration (auth, role routing) is handled at runtime from the API response — no additional frontend env vars are needed.
