from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Optional

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Test server is working", "status": "ok"}

@app.get("/api/applications/{app_id}")
async def get_application(app_id: int, authorization: Optional[str] = Header(None)):
    print(f"🔍 Request for application {app_id}")
    print(f"🔐 Authorization header: {authorization[:50] if authorization else 'None'}...")
    
    # Simulate authentication check
    if not authorization or not authorization.startswith("Bearer "):
        print("❌ No valid authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    print(f"✅ Returning mock data for application {app_id}")
    return {
        "id": app_id,
        "application_number": f"ITRC-2024-{app_id}",
        "product_name": "محصول تست",
        "company_name": "شرکت تست",
        "contact_person": "علی احمدی",
        "contact_email": "test@example.com",
        "contact_phone": "09123456789",
        "product_type": "نرم‌افزار ضد بدافزار",
        "description": "این یک درخواست تست است",
        "evaluation_level": "EAL1",
        "status": "submitted",
        "submission_date": "2024-01-01T00:00:00",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }

@app.get("/api/applications/")
async def get_applications(authorization: Optional[str] = Header(None)):
    print("🔍 Request for applications list")
    print(f"🔐 Authorization header: {authorization[:50] if authorization else 'None'}...")
    
    if not authorization or not authorization.startswith("Bearer "):
        print("❌ No valid authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    print("✅ Returning mock applications list")
    return [
        {
            "id": 1,
            "application_number": "ITRC-2024-1",
            "product_name": "محصول تست 1",
            "status": "submitted",
            "submission_date": "2024-01-01T00:00:00",
            "product_type_name": "نرم‌افزار ضد بدافزار",
            "applicant_name": "شرکت تست 1",
            "evaluation_level": "EAL1"
        },
        {
            "id": 2,
            "application_number": "ITRC-2024-2",
            "product_name": "محصول تست 2",
            "status": "in_evaluation",
            "submission_date": "2024-01-02T00:00:00",
            "product_type_name": "نرم‌افزار ضد بدافزار",
            "applicant_name": "شرکت تست 2",
            "evaluation_level": "EAL2"
        },
        {
            "id": 3,
            "application_number": "ITRC-2024-3",
            "product_name": "محصول تست 3",
            "status": "submitted",
            "submission_date": "2024-01-03T00:00:00",
            "product_type_name": "نرم‌افزار ضد بدافزار",
            "applicant_name": "شرکت تست 3",
            "evaluation_level": "EAL1"
        }
    ]

if __name__ == "__main__":
    print("🚀 Starting test server...")
    uvicorn.run(app, host="127.0.0.1", port=8000) 