# SA Recruitment ATS

> Complete recruitment application for South African agencies - Backend + Frontend + Database

[![CI Status](https://github.com/infinitywork/sa-recruitment-ats/workflows/CI/badge.svg)](https://github.com/infinitywork/sa-recruitment-ats/actions)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

## 📦 What's in This Repository

This repository contains **ALL APPLICATION CODE**:
- ✅ **Backend** (FastAPI with Python 3.11+)
- ✅ **Frontend** (React 18 + TypeScript + Vite)
- ✅ **Database Migrations** (Alembic)
- ✅ **API Documentation**
- ✅ **Tests**
- ✅ **Documentation & Wireframes**

**Infrastructure** (Terraform, Kubernetes, Docker) → See [sa-recruitment-ats-infra](https://github.com/infinitywork/sa-recruitment-ats-infra)

---

## 🏗️ Project Structure

```
sa-recruitment-ats/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/            # API endpoints
│   │   ├── core/              # Config, database, security
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── tasks/             # Celery background tasks
│   │   └── utils/             # Utility functions
│   ├── alembic/               # Database migrations ⭐
│   │   ├── versions/          # Migration files
│   │   ├── env.py            # Alembic environment
│   │   └── script.py.mako    # Migration template
│   ├── tests/                 # Backend tests
│   ├── docs/
│   │   └── database_schema.sql  # Initial schema
│   ├── scripts/               # Utility scripts
│   ├── alembic.ini           # Alembic configuration
│   ├── Dockerfile
│   └── pyproject.toml        # Poetry dependencies
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   ├── store/            # Zustand state management
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   ├── App.tsx           # Main component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── index.html
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── package.json
│
├── docs/                      # Documentation
│   ├── api/                  # API documentation
│   ├── architecture/         # Architecture decisions
│   └── wireframes/           # UI/UX wireframes
│
├── .github/workflows/        # CI/CD pipelines
├── README.md                 # This file
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.11+, PostgreSQL 15+
- **Frontend**: Node 18+
- **OR**: Docker & Docker Compose (easier!)

### Option 1: Using Docker (Recommended)

```bash
# Clone both repositories
git clone https://github.com/infinitywork/sa-recruitment-ats.git
git clone https://github.com/infinitywork/sa-recruitment-ats-infra.git

# Start infrastructure
cd sa-recruitment-ats-infra
docker-compose -f docker/docker-compose.dev.yml up -d

# Access applications
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
```

### Option 2: Manual Setup (Local Development)

**Backend:**
```bash
cd backend

# Ensure you are using a compatible Python version (3.11 - 3.13) to avoid asyncpg compilation issues on Windows
poetry env use 3.13

# Install dependencies
poetry install

# Set up environment
cp ../.env.example .env
# Edit .env with your credentials

# Initialize database
psql -U postgres -c "CREATE DATABASE recruiter_ats"
psql -U postgres -d recruiter_ats -f docs/database_schema.sql

# Run migrations
poetry run alembic upgrade head

# Start local server (Method 1: Poetry)
poetry run uvicorn app.main:app --reload

# Start local server (Method 2: Virtual Env - Windows PowerShell)
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with API URL

# Start dev server
npm run dev
```


---

## 🗄️ Database Management

### The Backend Owns the Database

**Key Concept:** Database migrations are generated FROM backend models!

```python
# 1. Define model in backend/app/models/job.py
class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID, primary_key=True)
    title = Column(String(255))
    # ...

# 2. Generate migration automatically
cd backend
alembic revision --autogenerate -m "add jobs table"

# 3. Review generated migration
# Edit backend/alembic/versions/xxx_add_jobs_table.py

# 4. Apply migration
alembic upgrade head
```

### Common Database Tasks

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# View current version
alembic current

# Reset database (DEV ONLY!)
psql -d recruiter_ats -f docs/database_schema.sql
alembic stamp head
```

---

## 📚 Backend (FastAPI)

### Tech Stack

- **Framework**: FastAPI 0.109+
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15 (SQLAlchemy 2.0 async)
- **Cache**: Redis 7
- **Queue**: Celery
- **Auth**: JWT (access 1hr + refresh 7d)
- **Validation**: Pydantic v2
- **Testing**: Pytest

### Key Features

- ✅ Async/await endpoints
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (4 roles)
- ✅ OpenAPI/Swagger documentation
- ✅ Background task processing (Celery)
- ✅ AI resume parsing (OpenAI API)
- ✅ POPIA compliance (consent, DSAR, audit logs)
- ✅ Employment Equity reporting

### Adding a New Feature

**Example: Add Jobs Endpoint**

```bash
# 1. Create model (backend/app/models/job.py)
from app.core.database import Base
from sqlalchemy import Column, String, UUID

class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID, primary_key=True)
    title = Column(String(255), nullable=False)
    # ...

# 2. Generate migration
alembic revision --autogenerate -m "add jobs table"
alembic upgrade head

# 3. Create schema (backend/app/schemas/job.py)
from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    description: str

class JobResponse(JobCreate):
    id: UUID
    
# 4. Create service (backend/app/services/job_service.py)
async def create_job(db: AsyncSession, job: JobCreate):
    db_job = Job(**job.dict())
    db.add(db_job)
    await db.commit()
    return db_job

# 5. Create endpoint (backend/app/api/v1/jobs.py)
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/jobs", response_model=JobResponse)
async def create_job(
    job: JobCreate,
    db: AsyncSession = Depends(get_db)
):
    return await job_service.create_job(db, job)

# 6. Register router (backend/app/api/v1/router.py)
from app.api.v1 import jobs

api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
```

### Testing

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/api/test_jobs.py

# Run specific test
pytest tests/api/test_jobs.py::test_create_job
```

---

## 🎨 Frontend (React + TypeScript)

### Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build**: Vite 5
- **Styling**: Tailwind CSS (custom design system)
- **State**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios
- **Testing**: Vitest + React Testing Library

### Design System

**Colors:**
```tsx
// Primary color
<button className="bg-primary hover:bg-primary-600 text-white">
  Click Me
</button>

// Available colors:
bg-primary    // #4a90e2 (Blue)
bg-success    // #27ae60 (Green)
bg-warning    // #f39c12 (Orange)
bg-danger     // #e74c3c (Red)
bg-dark       // #2c3e50 (Navy)
```

**Custom Design System** configured in `frontend/tailwind.config.js`

### Adding a New Component

```tsx
// frontend/src/components/JobCard.tsx
interface JobCardProps {
  job: Job
  onApply: (jobId: string) => void
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="text-lg font-bold text-dark">{job.title}</h3>
      <p className="text-gray-600 mt-2">{job.description}</p>
      <button 
        onClick={() => onApply(job.id)}
        className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary-600"
      >
        Apply Now
      </button>
    </div>
  )
}
```

### API Service Pattern

```typescript
// frontend/src/services/jobService.ts
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const jobService = {
  async getJobs() {
    const response = await axios.get(`${API_URL}/jobs`)
    return response.data
  },
  
  async createJob(data: JobCreate) {
    const response = await axios.post(`${API_URL}/jobs`, data)
    return response.data
  },
  
  async getJob(id: string) {
    const response = await axios.get(`${API_URL}/jobs/${id}`)
    return response.data
  }
}
```

### Testing

```bash
cd frontend

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
```

---

## 🌍 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/recruiter_ats

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET=your_very_secure_random_string_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# AWS (for S3 storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=af-south-1
S3_BUCKET_RESUMES=recruiter-ats-resumes-dev
S3_BUCKET_EXPORTS=recruiter-ats-exports-dev

# OpenAI (resume parsing)
OPENAI_API_KEY=sk-your_openai_api_key

# SendGrid (email)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@infinityworkitsolutions.com

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Application
APP_NAME=RecruitPro SA
APP_ENV=development
DEBUG=true
```

### Frontend (.env.local)

```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_NAME=RecruitPro SA
VITE_APP_ENV=development
```

---

## 🧪 Testing Strategy

### Backend Testing

- **Unit Tests**: Individual functions and services
- **Integration Tests**: API endpoints with database
- **E2E Tests**: Complete workflows

**Coverage Target**: 80%+

### Frontend Testing

- **Unit Tests**: Components and hooks
- **Integration Tests**: Page flows
- **E2E Tests**: Critical user journeys (Playwright)

---

## 🚢 Deployment

**This repository is deployed via the infrastructure repository:**
- [sa-recruitment-ats-infra](https://github.com/infinitywork/sa-recruitment-ats-infra)

### CI/CD Workflow

```
1. Push to this repo
   ↓
2. GitHub Actions runs tests
   ↓
3. Build Docker images (backend + frontend)
   ↓
4. Push to container registry
   ↓
5. Trigger deployment (infra repo)
   ↓
6. Infrastructure deploys new version
   ↓
7. Run database migrations
   ↓
8. Done! ✅
```

---

## 📖 API Documentation

Once running: **http://localhost:8000/api/v1/docs**

- **Swagger UI**: Interactive API testing
- **ReDoc**: Beautiful API documentation
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

---

## 🎨 Wireframes & Design

UI/UX wireframes available in `docs/wireframes/`

**Open**: `docs/wireframes/index.html` for interactive gallery

Screens:
- Login & Registration
- Dashboard with KPIs
- Job Listing & Creation
- Candidate Profiles & Resume Upload
- Applications Pipeline & EE Reports

---

## 🤝 Contributing

### Branch Strategy

- `main` - Production code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

### Commit Convention

```bash
feat: add job matching algorithm
fix: resolve resume parsing timeout
docs: update API documentation
test: add unit tests for auth service
refactor: extract parsing logic to service
```

### Development Workflow

```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/job-matching

# 2. Make changes
# - Add model to backend/app/models/
# - Generate migration: alembic revision --autogenerate
# - Add service logic
# - Add API endpoint
# - Add tests

# 3. Test locally
cd backend && pytest
cd frontend && npm test

# 4. Commit and push
git add .
git commit -m "feat: add job matching algorithm"
git push origin feature/job-matching

# 5. Create Pull Request to develop
# 6. After review, merge to develop
# 7. Release to main when ready
```

---

## 🔄 Related Repository

| Repository | Purpose | Contains |
|------------|---------|----------|
| **[sa-recruitment-ats](https://github.com/infinitywork/sa-recruitment-ats)** | Application | Backend + Frontend + Migrations |
| **[sa-recruitment-ats-infra](https://github.com/infinitywork/sa-recruitment-ats-infra)** | Infrastructure | Terraform, K8s, Docker, Scripts |

---

## 🐛 Troubleshooting

### Backend Issues

**"Can't connect to database"**
```bash
# Check PostgreSQL is running
psql -h localhost -U postgres -c "SELECT version();"

# If using Docker
docker ps | grep postgres
```

**"Alembic can't find migrations"**
```bash
# Make sure you're in backend/ directory
cd backend
alembic current
```

**"Module not found"**
```bash
cd backend
poetry install
```

### Frontend Issues

**"Module not found"**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**"Tailwind classes not working"**
```bash
# Restart dev server
npm run dev
```

### Database Issues

**"Migration failed"**
```bash
# Check current version
alembic current

# Try manual downgrade and upgrade
alembic downgrade -1
alembic upgrade head

# If stuck, reset (DEV ONLY!)
psql -d recruiter_ats -f docs/database_schema.sql
alembic stamp head
```

---

## 📊 Project Stats

- **Languages**: Python, TypeScript, SQL
- **Backend LoC**: ~2,000+
- **Frontend LoC**: ~1,000+
- **Database Tables**: 20+
- **API Endpoints**: 50+ (planned)
- **Tests**: 80%+ coverage target
- **Documentation Pages**: 8+

---

## 📄 License

Proprietary - © 2026 InfinityWork IT Solutions (Pty) Ltd

---

## 👥 Team

- **Founder & Lead Developer**: Mpumelelo Magagula
- **Company**: InfinityWork IT Solutions (Pty) Ltd
- **Location**: Cape Town, South Africa 🇿🇦
- **Email**: mpumelelo@infinityworkitsolutions.com
- **Website**: infinityworkitsolutions.com

---

**Built with ❤️ in Cape Town, South Africa**  
**Infinite Tech. Limitless Solutions.**


cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
