AI Specialist - Nguyen_Manh_Hung

Endpoints:
- GET /health -> health check
- POST /analyze -> form-data file=image, optional query param upload=true

Requirements:
- pillow, numpy, fastapi, uvicorn, cloudinary (optional)

Run locally:
    uvicorn app:app --port 8010

Notes:
- Storage upload uses Cloudinary if environment is configured (CLOUDINARY_URL or separate vars).

http://127.0.0.1:8010/docs#/
http://127.0.0.1:8010/health(status:ok)