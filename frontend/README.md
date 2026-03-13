# SA Recruitment ATS - Frontend

React + TypeScript + Vite frontend for the South African Recruitment ATS.

## 🚀 Quick Start

### With Docker (Recommended)

```bash
# From project root
docker-compose up frontend
```

### Without Docker

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start dev server
npm run dev
```

Access: http://localhost:5173

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── store/           # Zustand state management
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # App entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # npm dependencies
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
└── tsconfig.json        # TypeScript config
```

## 🎨 Design System

### Colors
- **Primary**: `#4a90e2` (Blue)
- **Success**: `#27ae60` (Green)
- **Warning**: `#f39c12` (Orange)
- **Danger**: `#e74c3c` (Red)
- **Dark**: `#2c3e50` (Navy)

### Usage
```tsx
// Tailwind classes
<div className="bg-primary text-white">
  <button className="bg-success hover:bg-success-600">
    Click me
  </button>
</div>
```

## 🔧 Development

### Create a new page

```tsx
// src/pages/JobsPage.tsx
import React from 'react'

export default function JobsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Jobs</h1>
    </div>
  )
}
```

### Create an API service

```typescript
// src/services/jobService.ts
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
}
```

### Create a Zustand store

```typescript
// src/store/authStore.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, token: null }),
}))
```

## 🧪 Testing

```bash
npm test                # Run tests
npm run test:ui         # Run with UI
npm run test:coverage   # With coverage
```

## 🏗️ Building

```bash
npm run build          # Build for production
npm run preview        # Preview production build
```

## 📚 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Validation

## 🎯 Wireframes

Reference the wireframes in `../wireframes/` for UI design:
- `01-login-registration.html` - Auth screens
- `02-dashboard.html` - Dashboard
- `03-jobs.html` - Job management
- `04-candidates.html` - Candidate profiles
- `05-applications-ee.html` - Pipeline & EE reports

## 🐛 Troubleshooting

**Module not found**
```bash
npm install
```

**Port 5173 already in use**
```bash
lsof -i :5173
kill -9 <PID>
```

**Tailwind classes not working**
```bash
# Restart dev server
npm run dev
```
