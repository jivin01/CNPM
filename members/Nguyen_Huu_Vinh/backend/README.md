# AURA Backend - AI System for Retinal Vascular Health Screening

## Overview
AURA is a medical software platform for retinal image analysis and disease risk assessment. This backend provides REST APIs for patient image uploads, AI analysis simulation, and doctor review workflows.

## Features
- JWT-based authentication with role-based access control (RBAC)
- Retinal image upload to Cloudinary storage
- AI analysis simulation with realistic medical findings
- Doctor dashboard for reviewing analysis results
- PostgreSQL database with async SQLAlchemy ORM

## Tech Stack
- **Framework**: FastAPI with Python 3.9+
- **Database**: PostgreSQL with Async SQLAlchemy
- **Authentication**: JWT tokens with OAuth2
- **File Storage**: Cloudinary
- **ORM**: SQLAlchemy 2.0 (async)

## Installation

1. Clone the repository
2. Navigate to backend directory
3. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. Set up PostgreSQL database and update DATABASE_URL in .env

7. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user info

### Patient Profile
- `POST /api/v1/users/profile` - Create patient profile
- `GET /api/v1/users/profile` - Get patient profile

### Medical Images
- `POST /api/v1/images/upload` - Upload retinal image
- `GET /api/v1/images/my-images` - Get patient's images

### Analysis
- `GET /api/v1/analysis/doctor/dashboard` - Doctor dashboard (doctors only)
- `PATCH /api/v1/analysis/{analysis_id}/validate` - Add doctor notes
- `GET /api/v1/analysis/my-results` - Get patient's analysis results

## Database Schema

### Users
- `id` (UUID) - Primary key
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `role` - Enum: patient, doctor, admin

### Patient Profiles
- `id` (UUID) - Primary key
- `user_id` - Foreign key to users
- `full_name` - Patient's full name
- `date_of_birth` - Date of birth
- `medical_history` - Text field for medical history

### Medical Images
- `id` (UUID) - Primary key
- `patient_id` - Foreign key to patient profiles
- `image_url` - Cloudinary URL
- `status` - Enum: pending, processing, analyzed

### Analysis Results
- `id` (UUID) - Primary key
- `image_id` - Foreign key to medical images
- `risk_level` - Enum: low, medium, high
- `confidence_score` - Float (0.0-1.0)
- `findings` - JSON with detailed analysis
- `doctor_notes` - Text for doctor validation

## Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/aura_db
SECRET_KEY=your-super-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Development

The API documentation is available at `http://localhost:8000/docs` when running the server.

## Security Notes

- Use strong SECRET_KEY in production
- Enable HTTPS in production
- Configure proper CORS origins
- Use environment variables for sensitive data
