# 🚀 NexusOne AI — Enterprise Business Operating System

> **An AI-powered, full-stack, enterprise-grade SaaS platform** for managing customers, projects, employees, billing, support, analytics, inventory, automation, and intelligent workflows — all from one beautiful dashboard.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Running with Docker](#running-with-docker)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Default Credentials](#default-credentials)
- [Architecture](#architecture)
- [Modules](#modules)

---

## 🎯 Overview

NexusOne AI is a production-ready, multi-tenant SaaS platform that combines:

| Category | What it does |
|----------|-------------|
| **AI + CRM** | Customer management, leads, activity tracking, AI insights |
| **Project Management** | Kanban boards, milestones, team collaboration |
| **Task Management** | Subtasks, checklists, time tracking, drag-and-drop |
| **Billing & Finance** | Invoices, PDF generation, payments, expense tracking |
| **Support System** | Tickets, SLA timers, AI-powered replies |
| **HRM** | Employees, attendance, leave management, payroll |
| **Inventory** | Products, stock tracking, suppliers, warehouses |
| **Analytics** | Revenue charts, KPI dashboards, custom reports |
| **AI Copilot** | GPT-4 powered business Q&A, risk detection |
| **Real-Time** | WebSocket notifications, live dashboards |
| **Documents** | File management, folder structure, version control |
| **Approvals** | Workflow approval for leaves, expenses, invoices |
| **Audit Logs** | Full activity tracking for compliance |
| **Multi-Tenant** | Isolated workspaces per company |

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.x | React framework, SSR, routing |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Framer Motion** | 11.x | Animations |
| **Recharts** | 2.x | Charts & visualizations |
| **Zustand** | 4.x | State management |
| **TanStack Query** | 5.x | Server state, caching |
| **React Hook Form** | 7.x | Form handling |
| **Zod** | 3.x | Validation |
| **Axios** | 1.x | HTTP client |
| **React Dropzone** | - | File uploads |
| **Lucide React** | - | Icons |
| **Radix UI** | - | Accessible UI primitives |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Django** | 5.x | Web framework |
| **Django REST Framework** | 3.15.x | API framework |
| **PostgreSQL** | 16 | Primary database |
| **Redis** | 7 | Cache, Celery broker |
| **Celery** | 5.x | Async tasks, scheduling |
| **Django Channels** | 4.x | WebSockets |
| **Daphne** | 4.x | ASGI server |
| **JWT Auth** | - | Authentication |
| **OpenAI** | - | AI features |
| **Stripe** | - | Payments |
| **ReportLab** | - | PDF generation |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** + **Docker Compose** | Containerization |
| **Nginx** | Reverse proxy |
| **Gunicorn/Daphne** | Production server |

---

## ✨ Features

### 🔐 Authentication & Security
- JWT access + refresh tokens with auto-rotation
- Email verification, password reset
- Two-factor authentication (2FA)
- Login history & device tracking
- Brute force protection, rate limiting
- Session management
- Role-based access control (RBAC)

### 🏢 Multi-Tenant Architecture
- Isolated company workspaces
- Subscription plans (Free/Starter/Pro/Enterprise)
- Storage limits per plan
- Per-company settings

### 📊 Smart Dashboard
- Real-time KPI cards
- Revenue area charts (12 months)
- Customer growth bar charts
- Ticket & project distribution
- Attendance tracking
- Quick actions

### 👥 CRM
- Customer profiles with full history
- Lead pipeline with conversion
- Notes, documents, activity timeline
- Tags, status, assignment
- Revenue tracking per customer

### 📁 Project Management
- Kanban board (drag-and-drop)
- Milestones, team members
- Budget tracking
- Progress monitoring
- Overdue detection

### ✅ Task Management
- Subtasks & checklists
- Priority levels with visual indicators
- Time logging
- Comments & attachments
- Overdue alerts

### 💰 Billing & Finance
- Professional invoices with PDF export
- Multi-currency support
- Tax/VAT, discounts
- Payment tracking
- Expense management
- Revenue analytics

### 🎫 Support Tickets
- SLA timers with breach alerts
- AI-generated summaries
- AI-suggested replies
- Internal notes
- Priority & category system

### 👤 HRM
- Employee profiles
- Attendance check-in/out
- Leave request & approval workflow
- Salary records
- Department management

### 📦 Inventory
- Stock tracking with low-stock alerts
- Multiple warehouses
- Supplier management
- Stock movement history
- Barcode/SKU support

### 🤖 AI Copilot (GPT-4)
- Business Q&A from live data
- Revenue trend analysis
- Project risk detection
- Customer churn prediction
- Smart task prioritization
- AI report generation

### 🔔 Real-Time Notifications
- WebSocket-powered live notifications
- Email & SMS notifications
- In-app notification center
- Unread counter

### 📈 Analytics
- Revenue reports (monthly/quarterly/yearly)
- Customer analytics by status/source
- Employee attendance analytics
- Top customer rankings
- AI-powered narrative analysis

---

## 📂 Project Structure

```
nexusone/
├── backend/                     # Django REST API
│   ├── apps/
│   │   ├── accounts/            # Auth, Users, Sessions
│   │   ├── companies/           # Multi-tenant companies
│   │   ├── crm/                 # Customers, Leads
│   │   ├── projects/            # Projects, Milestones
│   │   ├── tasks/               # Tasks, Comments, Time logs
│   │   ├── billing/             # Invoices, Payments, Expenses
│   │   ├── support/             # Tickets, Replies, SLA
│   │   ├── hrm/                 # Employees, Attendance, Leaves
│   │   ├── inventory/           # Items, Stock, Suppliers
│   │   ├── analytics/           # Dashboard, Reports
│   │   ├── ai_engine/           # OpenAI integration
│   │   ├── notifications/       # WebSocket, Celery tasks
│   │   ├── documents/           # File management
│   │   ├── approvals/           # Workflow approvals
│   │   └── audit/               # Audit logs
│   ├── config/
│   │   ├── settings.py          # Django settings
│   │   ├── urls.py              # URL routing
│   │   ├── asgi.py              # WebSocket support
│   │   └── celery.py            # Celery config
│   ├── requirements/
│   │   └── base.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                    # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/            # Login, Register
│   │   │   └── dashboard/       # All dashboard pages
│   │   │       ├── page.tsx     # Main dashboard
│   │   │       ├── crm/         # CRM page
│   │   │       ├── projects/    # Projects + Kanban
│   │   │       ├── tasks/       # Tasks
│   │   │       ├── billing/     # Invoices, Payments
│   │   │       ├── support/     # Tickets
│   │   │       ├── hrm/         # HR management
│   │   │       ├── inventory/   # Inventory
│   │   │       ├── analytics/   # Charts & reports
│   │   │       ├── ai/          # AI Copilot
│   │   │       ├── documents/   # Documents
│   │   │       ├── approvals/   # Approvals
│   │   │       ├── notifications/
│   │   │       ├── audit/
│   │   │       └── settings/
│   │   ├── components/
│   │   │   └── dashboard/
│   │   │       ├── Sidebar.tsx  # Navigation sidebar
│   │   │       └── Navbar.tsx   # Top navigation
│   │   ├── services/
│   │   │   └── api.ts           # All API calls
│   │   ├── store/
│   │   │   ├── authStore.ts     # Auth state
│   │   │   └── uiStore.ts       # UI state
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript types
│   │   ├── providers/
│   │   │   └── Providers.tsx
│   │   ├── utils/
│   │   │   └── cn.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── .env.example
│   └── Dockerfile
│
├── docker/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start (Recommended: Docker)

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/nexusone-ai.git
cd nexusone-ai
```

### 2. Set up environment variables
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Start everything with Docker
```bash
docker-compose up --build
```

### 4. Access the app
| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000/api/v1/ |
| **Django Admin** | http://localhost:8000/admin/ |

---

## 🐳 Running with Docker

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 🔧 Manual Setup (Development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements/base.txt

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create demo data
python manage.py create_demo_data

# Start Redis (required for Celery)
redis-server

# Start Celery worker (new terminal)
celery -A config.celery worker --loglevel=info

# Start development server
python manage.py runserver
# OR for WebSocket support:
daphne config.asgi:application
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
```

---

## 🔑 Environment Variables

### Backend (.env)

```env
# Django
SECRET_KEY=your-super-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///nexusone.db
# Production: postgres://user:password@localhost:5432/nexusone_db

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# OpenAI (required for AI features)
OPENAI_API_KEY=sk-your-api-key

# Stripe (optional)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 🔑 Default Credentials

After running `python manage.py create_demo_data`:

| Role | Email | Password |
|------|-------|----------|
| **Company Admin** | admin@nexusone.ai | Admin@123456 |
| **Manager** | manager@nexusone.ai | Manager@123456 |

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000/api/v1/
```

### Auth Endpoints
```
POST /auth/register/          # Register
POST /auth/login/             # Login (returns JWT)
POST /auth/logout/            # Logout
POST /auth/token/refresh/     # Refresh JWT
GET  /auth/profile/           # Get profile
PATCH /auth/profile/          # Update profile
POST /auth/change-password/   # Change password
POST /auth/forgot-password/   # Forgot password
POST /auth/reset-password/    # Reset password
GET  /auth/login-history/     # Login history
GET  /auth/sessions/          # Active sessions
```

### All Module Endpoints
```
/companies/         # Company management
/crm/customers/     # Customers
/crm/leads/         # Leads
/projects/          # Projects + Kanban
/tasks/             # Tasks + Comments
/billing/invoices/  # Invoices + PDF
/billing/payments/  # Payments
/billing/expenses/  # Expenses
/support/tickets/   # Support tickets
/hrm/employees/     # Employees
/hrm/attendance/    # Attendance
/hrm/leaves/        # Leave management
/inventory/items/   # Inventory items
/analytics/dashboard/ # Main analytics
/ai/copilot/        # AI Q&A
/ai/insights/       # Business insights
/notifications/     # Notifications
/documents/         # Document management
/approvals/         # Workflow approvals
/audit/logs/        # Audit trail
```

### Authentication Header
```
Authorization: Bearer <access_token>
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX (Port 80)                          │
│              Reverse Proxy + Static Files + SSL                 │
└────────────────┬──────────────────────────┬────────────────────┘
                 │                          │
    ┌────────────▼───────────┐  ┌──────────▼──────────────┐
    │   Next.js Frontend     │  │   Django/Daphne API      │
    │   (Port 3000)          │  │   (Port 8000)            │
    │                        │  │   REST + WebSockets      │
    │   • 20+ Pages          │  │   • 22 modules           │
    │   • Real-time UI       │  │   • JWT Auth             │
    │   • Charts/Kanban      │  │   • Celery Tasks         │
    └────────────────────────┘  └──────┬───────────────────┘
                                       │
              ┌──────────────┬──────────┴──────────┐
              │              │                     │
    ┌─────────▼────┐  ┌──────▼──────┐  ┌──────────▼───────┐
    │  PostgreSQL  │  │    Redis    │  │   OpenAI GPT-4   │
    │  (Port 5432) │  │  (Port 6379)│  │   (AI Copilot)   │
    │  Main DB     │  │  Cache +    │  │   Ticket AI      │
    │  Multi-tenant│  │  Channels   │  │   Insights       │
    └──────────────┘  └─────────────┘  └──────────────────┘
```

---

## 📱 Supported Roles

| Role | Access |
|------|--------|
| **Super Admin** | Everything across all companies |
| **Company Admin** | Everything in their company |
| **Manager** | Projects, CRM, HRM, Billing, Support |
| **Employee** | Tasks, own attendance, documents |
| **Support Agent** | Assigned tickets |
| **Accountant** | Billing, analytics |
| **Customer** | Own tickets and invoices |

---

## 🚀 Production Deployment

### VPS Deployment (Ubuntu)

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone and configure
git clone https://github.com/yourusername/nexusone-ai.git
cd nexusone-ai
cp backend/.env.example backend/.env
# Edit .env with production values

# 3. Deploy
docker-compose -f docker-compose.yml up --build -d

# 4. Create superuser
docker exec nexusone_backend python manage.py createsuperuser

# 5. Setup SSL (Let's Encrypt)
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## 🛡 Security Features

- ✅ JWT with refresh token rotation
- ✅ Password hashing (PBKDF2)
- ✅ CSRF protection
- ✅ XSS protection headers
- ✅ SQL injection prevention (ORM)
- ✅ Rate limiting
- ✅ API throttling
- ✅ Audit logging
- ✅ Multi-tenant data isolation
- ✅ Secure file uploads
- ✅ Login history tracking
- ✅ Suspicious login detection

---

## 🤝 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: Create a GitHub issue
- **Email**: support@nexusone.ai

---

*Built with ❤️ using Django, Next.js, PostgreSQL, Redis, and OpenAI*
