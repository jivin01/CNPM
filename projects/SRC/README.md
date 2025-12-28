# SP26SE025 — AURA: System for Retinal Vascular Health Screening

A comprehensive web-based platform for retinal vascular health screening that serves multiple user groups (patients, doctors, clinics, and administrators) through AI-powered analysis of retinal images (Fundus and OCT).

## Overview

AURA is an integrated system that enables:
- **Patients**: Upload retinal images, view AI analysis results with annotations, and receive preliminary health recommendations
- **Doctors**: Review AI results, validate/adjust diagnoses, add professional comments, and communicate with patients
- **Clinics**: Manage patient populations, monitor screening campaigns, and analyze aggregated risk statistics
- **Administrators**: Manage users, roles, service packages, and monitor AI model performance

## Architecture

This system is built with a modular, layered architecture:

1. **Frontend Layer** (`frontend/`): React/TypeScript UI with role-specific dashboards and shared components
2. **Backend Layer** (`backend/`): FastAPI REST API with authentication, image processing, and business logic
3. **AI/ML Layer** (`ai/`): Independent AI inference engine for retinal image analysis
4. **Data Layer**: Centralized database with secure storage for medical data and images

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Project Structure
- `backend/`: FastAPI backend with REST APIs, authentication, upload endpoints, and analysis result management
- `ai/`: AI inference engine (currently a stub, can be replaced with trained models)
- `frontend/`: React/TypeScript frontend with patient, doctor, and admin dashboards

## Quick start (dev)
1. Backend: 
   - cd projects/SP26SE025/backend
   - PowerShell: `./setup.ps1` (creates venv and installs deps)
   - Windows CMD: `run.bat`
   - Then: `uvicorn app.main:app --reload --port 8000`

2. Frontend:
   - cd projects/SP26SE025/frontend
   - npm install
   - npm install -D parcel
   - npm run start  # runs on http://localhost:3000

3. Real-time & Messaging
   - WebSocket notifications available at ws://localhost:8000/ws/{user_id}
   - REST messaging endpoints:
     - POST /messages/  (body: {receiver_id, content})
     - GET /messages/with/{other_user_id}  (returns conversation)

4. RBAC (Role-Based Access Control)
   - Roles: `patient` (default), `doctor`, `clinic`, `admin`
   - Admin endpoints (require `admin` role):
     - GET /admin/users/  (list users)
     - POST /admin/users/{user_id}/role?role=ROLE  (change role)
   - Use admin role to manage user roles and access

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### End-to-End Smoke Test
```bash
cd backend
python e2e_smoke.py
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md): Comprehensive system architecture documentation
- This README: Quick start guide and overview

## Notes

- This is an initial scaffold. Replace the AI stub in `ai/` with real training/model files later.
- The system uses SQLite for development; PostgreSQL is recommended for production.
- Image storage currently uses local filesystem; cloud storage integration is available via the storage service abstraction.


uvicorn app.main:app --reload
