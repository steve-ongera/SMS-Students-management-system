# SMS Backend – Django REST API

## Setup
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data        # creates admin/admin123
python manage.py runserver 8000
```

## API Base URL
`http://localhost:8000/api/`

## Auth Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/login/ | Login → returns JWT tokens |
| POST | /api/auth/refresh/ | Refresh access token |
| POST | /api/auth/logout/ | Logout |
| GET  | /api/auth/me/ | Current user info |

## Resource Endpoints (all require Bearer token + is_staff)
| Resource | URL |
|----------|-----|
| Dashboard stats | GET /api/dashboard/ |
| Programmes | /api/programmes/ |
| Courses | /api/courses/ |
| Students | /api/students/ |
| Enrollments | /api/enrollments/ |
| Exams | /api/exams/ |
| Exam Results | /api/results/ |
| Admin Users | /api/users/ |

## Default Credentials
- **admin** / admin123 (superuser)
- **registrar** / reg123 (staff)


# EduCore SMS — React Frontend

A polished React + Vite single-page admin portal for the EduCore Student Management System.

## Tech Stack
- **React 18** — UI library
- **Vite 5** — build tool & dev server
- **Bootstrap Icons** — icon set (CDN, no npm install needed)
- **DM Sans + Playfair Display** — Google Fonts
- **Plain CSS** — custom design system (`src/styles/main.css`)
- **Fetch API** — HTTP client with JWT auto-refresh (`src/services/api.js`)

## Project Structure

```
sms_frontend/
├── index.html                  ← entry HTML (fonts, icons, Bootstrap icons)
├── vite.config.js              ← Vite config with API proxy
├── package.json
├── .env.example                ← copy to .env
└── src/
    ├── main.jsx                ← React entry point
    ├── App.jsx                 ← shell + page routing
    ├── styles/
    │   └── main.css            ← full design system (CSS variables, all components)
    ├── services/
    │   └── api.js              ← all API calls + JWT token management
    ├── context/
    │   ├── AuthContext.jsx     ← login/logout state
    │   └── ToastContext.jsx    ← global toast notifications
    ├── components/
    │   ├── Sidebar.jsx         ← collapsible left nav
    │   ├── Navbar.jsx          ← top bar with breadcrumb & user chip
    │   └── Modal.jsx           ← reusable Modal + ConfirmModal
    └── pages/
        ├── Login.jsx           ← split-panel login page
        ├── Dashboard.jsx       ← stat cards + recent tables
        ├── Students.jsx        ← full CRUD, search, filter, pagination, profile view
        ├── Programmes.jsx      ← card-grid CRUD
        ├── Courses.jsx         ← table CRUD with filters
        ├── Enrollments.jsx     ← enrollment management
        ├── Exams.jsx           ← exam scheduling + inline result recording
        ├── Results.jsx         ← results management
        └── UserManagement.jsx  ← admin user CRUD + password change + toggle active
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set VITE_API_URL to your Django backend URL
# Default: http://localhost:8000/api
```

### 3. Start Django backend first
```bash
cd ../sms_backend
python manage.py runserver 8000
```

### 4. Start the dev server
```bash
npm run dev
# Opens at http://localhost:5173
```

### 5. Login
| Username    | Password   | Role        |
|-------------|------------|-------------|
| `admin`     | `admin123` | Superuser   |
| `registrar` | `reg123`   | Staff Admin |

## Build for Production
```bash
npm run build
# Output in /dist — deploy as static files
# Point your web server to serve index.html for all routes
```

## Design System

All design tokens live in CSS variables at the top of `main.css`:

| Variable | Value | Usage |
|---|---|---|
| `--clr-primary` | `#1a472a` | Sidebar bg, buttons |
| `--clr-accent` | `#52b788` | Highlights, active nav |
| `--clr-bg` | `#f7f5f0` | Page background |
| `--font-ui` | DM Sans | All UI text |
| `--font-display` | Playfair Display | Page titles, modal headers |
| `--font-mono` | DM Mono | Student IDs, codes |

## Pages & Features

| Page | Features |
|---|---|
| **Login** | Split panel, show/hide password, JWT auth, admin-only gate |
| **Dashboard** | 7 stat cards, recent students table, upcoming exams list |
| **Students** | Full CRUD, search, status/programme/level filters, pagination, profile + results view |
| **Programmes** | Card grid, CRUD, student & course counts |
| **Courses** | Table CRUD, programme & level filters |
| **Enrollments** | Enroll students to courses, remove enrollments |
| **Exams** | Schedule exams, update status, inline result recording per exam |
| **Results** | All results view, add/edit/delete, filter by exam or student |
| **User Management** | Admin user cards, create/edit, change password, toggle active, delete |