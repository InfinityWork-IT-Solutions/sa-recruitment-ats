# SA Recruitment ATS - Backend

FastAPI backend for the South African Recruitment ATS.

## 🚀 Quick Start

### With Docker (Recommended)

```bash
# From project root
docker-compose up backend
```

### Without Docker

```bash
# Install dependencies
poetry install

# Copy environment variables
cp ../.env.example ../.env
# Edit .env with your credentials

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── core/
│   │   ├── config.py        # Application settings
│   │   ├── database.py      # Database connection
│   │   └── security.py      # Auth & JWT utilities
│   ├── api/v1/
│   │   └── router.py        # API v1 router
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── tasks/               # Celery background tasks
│   └── utils/               # Utility functions
├── alembic/                 # Database migrations
├── tests/                   # Pytest tests
├── scripts/                 # Utility scripts
├── pyproject.toml           # Poetry dependencies
└── Dockerfile               # Docker image
```

## 🔧 Development

### Create a new API endpoint

1. **Define Pydantic schema** (`app/schemas/`)
2. **Create service function** (`app/services/`)
3. **Add API endpoint** (`app/api/v1/`)

Example:
```python
# app/schemas/job.py
from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    description: str

# app/services/job_service.py
async def create_job(db: AsyncSession, job: JobCreate):
    # Implementation
    pass

# app/api/v1/jobs.py
@router.post("/jobs")
async def create_job(job: JobCreate, db: AsyncSession = Depends(get_db)):
    return await job_service.create_job(db, job)
```

### Run tests

```bash
pytest                      # All tests
pytest tests/api/          # API tests only
pytest --cov=app           # With coverage
```

## 📚 API Documentation

Once running, access:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc
- OpenAPI JSON: http://localhost:8000/api/v1/openapi.json

## 🗄️ Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## 🔒 Security

- JWT authentication (1hr access + 7d refresh tokens)
- Bcrypt password hashing (12 rounds)
- Role-based access control (RBAC)
- Rate limiting
- CORS protection

## 🐛 Troubleshooting

**ModuleNotFoundError**
```bash
poetry install
```

**Database connection error**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
```

**Port 8000 already in use**
```bash
lsof -i :8000
kill -9 <PID>
```
