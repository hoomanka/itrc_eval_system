# Backend System Guide

## Table of Contents

- [Technology Stack](#technology-stack)
- [System Architecture Overview](#system-architecture-overview)
- [How Backend Connects to Frontend and Database](#how-backend-connects-to-frontend-and-database)
- [Main Backend Components and Their Roles](#main-backend-components-and-their-roles)
- [Subsystems and Their Responsibilities](#subsystems-and-their-responsibilities)
- [REST API Design](#rest-api-design)
- [How to Extend or Debug](#how-to-extend-or-debug)
- [Summary Table: Main Backend Files](#summary-table-main-backend-files)
- [Related Diagrams](#related-diagrams)
- [What Happens in Different Layers (Network, Application, etc.)](#what-happens-in-different-layers-network-application-etc)
- [What is an Endpoint?](#what-is-an-endpoint)
- [Backend Endpoints Table](#backend-endpoints-table)
- [SQLAlchemy, Alembic, and Schema Migration](#sqlalchemy-alembic-and-schema-migration)
- [Debug Guide](#debug-guide)
- [Test Guide](#test-guide)
- [File Uploads: How They Work and Deployment Considerations](#file-uploads-how-they-work-and-deployment-considerations)
- [Deployment Paths and Steps](#deployment-paths-and-steps)
- [Further Reading](#further-reading)

---

## Technology Stack

- **Language:** Python 3.x
- **Framework:** FastAPI (for REST APIs)
- **ASGI Server:** Uvicorn
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL (default, can be changed in config)
- **Migrations:** Alembic
- **Authentication:** JWT (JSON Web Tokens), OAuth2
- **Password Hashing:** Passlib (bcrypt)
- **Data Validation:** Pydantic
- **File Uploads:** python-multipart
- **Document Generation:** python-docx (for Word reports)
- **Testing:** Pytest, pytest-asyncio

### Key Dependencies (from `requirements.txt`)
- fastapi
- uvicorn[standard]
- sqlalchemy
- psycopg2-binary
- alembic
- python-multipart
- python-jose[cryptography]
- passlib[bcrypt]
- python-decouple
- pydantic-settings
- pytest, pytest-asyncio
- python-docx

---

## System Architecture Overview

- **FastAPI** serves as the main web framework, exposing RESTful endpoints for all backend operations.
- **SQLAlchemy** is used for ORM (Object-Relational Mapping) to interact with the PostgreSQL database.
- **Alembic** manages database migrations.
- **Routers** in FastAPI organize API endpoints by domain (users, applications, evaluations, reports, etc.).
- **Services** encapsulate business logic (e.g., report generation).
- **Pydantic Schemas** are used for request/response validation and serialization.
- **Authentication** is handled via JWT tokens, with role-based access control.
- **Static files** (uploads) are served via FastAPI's static file mounting.

---

## How Backend Connects to Frontend and Database

- **Frontend (UI):**
  - The frontend (e.g., React/Next.js) communicates with the backend via HTTP(S) REST API calls (AJAX/fetch/axios).
  - CORS is enabled for local development (`localhost:3000`).
  - Endpoints are prefixed with `/api/` (e.g., `/api/applications`, `/api/evaluations`).
  - Authentication is via JWT tokens stored in the frontend and sent as Bearer tokens.

- **Database:**
  - SQLAlchemy connects to PostgreSQL using the connection string in `core/config.py`.
  - All models are defined in `app/models.py`.
  - Alembic is used for schema migrations (see `alembic.ini` and `alembic/versions/`).

---

## Main Backend Components and Their Roles

### 1. Entry Point
- **`app/main.py`**: Initializes FastAPI app, sets up CORS, mounts static files, and includes all routers.

### 2. Core Modules
- **`core/config.py`**: Centralized configuration (DB URL, JWT secret, etc.).
- **`core/auth.py`**: Authentication, password hashing, JWT creation/validation, role-based access control.

### 3. Database
- **`database.py`**: SQLAlchemy engine/session setup, DB connection, and dependency for routes.
- **`models.py`**: All ORM models (User, Application, Evaluation, TechnicalReport, etc.).
- **`schemas.py`**: Pydantic schemas for request/response validation and serialization.

### 4. Routers (API Endpoints)
- **`routers/auth.py`**: User authentication (login, register, change password, get current user).
- **`routers/users.py`**: User profile, evaluator listing, product type listing.
- **`routers/applications.py`**: Application CRUD, dashboard stats, applicant workflows.
- **`routers/evaluations.py`**: Evaluation CRUD, evaluator workflows, status updates.
- **`routers/reports.py`**: Technical report generation, supervisor review, download, and report listing.
- **`routers/security_targets.py`**: Security target management, class selection, evaluation help.
- **`routers/documents.py`**: Document upload, download, approval, and management.
- **`routers/admin.py`**: Admin-specific endpoints (user management, etc.).

### 5. Services
- **`services/report_generator.py`**: Business logic for generating technical reports (Word documents) from evaluation data.

### 6. Migrations
- **`alembic/`**: Database migration scripts (auto-generated or custom).
- **`alembic.ini`**: Alembic configuration file.

### 7. Utilities
- **`uploads/`**: Directory for uploaded files (served as static files).
- **`reports/`**: Directory for generated reports.

---

## Subsystems and Their Responsibilities

- **Authentication & Authorization:**
  - JWT-based, with role checks in endpoints (see `core/auth.py`).
- **User Management:**
  - Registration, login, profile update, role assignment.
- **Application Management:**
  - Applicants submit and manage product evaluation applications.
- **Evaluation Management:**
  - Evaluators conduct and update evaluations, mark as complete, and generate reports.
- **Report Generation:**
  - Evaluators generate technical reports; supervisors review and approve them.
- **Security Target Management:**
  - Applicants define security targets and select product classes/subclasses.
- **Document Management:**
  - Applicants upload required documents; evaluators and supervisors review/approve.
- **Admin Tools:**
  - Admins manage users, product types, and system settings.

---

## REST API Design

- **All endpoints are RESTful and organized by resource.**
- **Authentication:** `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Applications:** `/api/applications/`, `/api/applications/{id}`
- **Evaluations:** `/api/evaluations/`, `/api/evaluations/my`, `/api/evaluations/{id}`
- **Reports:** `/api/reports/generate/{evaluation_id}`, `/api/reports/my-reports`, `/api/reports/pending-review`
- **Security Targets:** `/api/security-targets/applications/{application_id}/security-target`
- **Documents:** `/api/documents/upload`, `/api/documents/{id}`

---

## How to Extend or Debug

- **Add a new API:** Create a new router in `routers/`, define endpoints, and include it in `main.py`.
- **Add a new model:** Define in `models.py`, create a migration with Alembic, and update schemas as needed.
- **Change DB config:** Edit `core/config.py` and `alembic.ini`.
- **Debug authentication:** Check `core/auth.py` and JWT logic.
- **Debug report generation:** See `services/report_generator.py` and related endpoints in `routers/reports.py`.

---

## Summary Table: Main Backend Files

| File/Folder                        | Role/Responsibility                                              |
|------------------------------------|-----------------------------------------------------------------|
| `main.py`                          | FastAPI app entrypoint, router inclusion, CORS, static files     |
| `core/config.py`                   | Configuration (DB, JWT, etc.)                                   |
| `core/auth.py`                     | Auth, JWT, password hashing, role checks                        |
| `database.py`                      | DB connection/session setup                                     |
| `models.py`                        | ORM models (User, Application, etc.)                            |
| `schemas.py`                       | Pydantic schemas for API validation                             |
| `routers/auth.py`                  | Auth endpoints (login, register, etc.)                          |
| `routers/users.py`                 | User profile, evaluator/product type listing                    |
| `routers/applications.py`          | Application CRUD, dashboard, applicant workflows                |
| `routers/evaluations.py`           | Evaluation CRUD, evaluator workflows                            |
| `routers/reports.py`               | Report generation, supervisor review, download                  |
| `routers/security_targets.py`      | Security target, class selection, evaluation help               |
| `routers/documents.py`             | Document upload, download, approval                             |
| `routers/admin.py`                 | Admin endpoints                                                 |
| `services/report_generator.py`     | Technical report generation logic                               |
| `alembic/`, `alembic.ini`          | DB migrations                                                   |
| `uploads/`                         | Uploaded files (static)                                         |
| `reports/`                         | Generated reports                                               |

---

## Related Diagrams

### 1. Entity-Relationship Diagram (ERD)
```mermaid
erDiagram
  users ||--o{ applications : "creates"
  users ||--o{ evaluations : "performs"
  users ||--o{ technical_reports : "generates/reviews"
  users ||--o{ documents : "uploads"
  applications ||--o{ documents : "has"
  applications ||--|| evaluations : "is evaluated by"
  applications ||--|| security_targets : "has"
  applications }o--|| product_types : "is of type"
  applications ||--o{ technical_reports : "has reports via evaluation"
  evaluations ||--o{ technical_reports : "has"
  security_targets ||--o{ st_class_selections : "selects"
  product_types ||--o{ product_classes : "has"
  product_classes ||--o{ product_subclasses : "has"
  product_classes ||--o{ evaluation_helps : "has help"
  product_subclasses ||--o{ evaluation_helps : "has help"
  protection_profiles ||--o{ product_types : "profile for type"
  evaluation_guidelines ||--o{ product_types : "guides for type"
```

### 2. Data Flow Diagram
```mermaid
flowchart TD
  A[Applicant registers] --> B[Creates Application]
  B --> C[Uploads Documents]
  B --> D[Admin assigns Evaluator]
  D --> E[Evaluator starts Evaluation]
  E --> F[Fills Security Target]
  F --> G[Selects Classes]
  G --> H[Completes Evaluation]
  H --> I[Generates Technical Report]
  I --> J[Supervisor Reviews]
  J --> K[Report Approved]
```

### 3. Backend Component Diagram
```mermaid
flowchart TD
  FE[Frontend (React/Next.js)] -- REST API --> API[FastAPI Backend]
  API -- ORM --> DB[(PostgreSQL)]
  API -- File Uploads --> FS[Uploads Folder]
  API -- Static Files --> FS
  API -- Business Logic --> Service[Report Generator]
  API -- Routers --> Routers[API Routers]
  API -- Auth --> Auth[JWT, OAuth2]
```

### 4. File Upload Sequence
```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant API
  participant Storage as File Storage
  participant DB
  User->>Frontend: Select file
  Frontend->>API: POST /api/documents/upload (multipart/form-data)
  API->>Storage: Save file
  API->>DB: Insert document metadata
  API-->>Frontend: Document info
```

### 5. Technical Data Flow (API)
```mermaid
sequenceDiagram
  participant User as User (Browser)
  participant Frontend as Frontend (React/Next.js)
  participant API as Backend API (FastAPI)
  participant DB as PostgreSQL Database

  User->>Frontend: Fill form / click button
  Frontend->>API: HTTP(S) POST/GET/PUT/DELETE (JSON, JWT token)
  API->>API: Validate with Pydantic schema
  API->>DB: SQLAlchemy ORM (SQL over TCP)
  DB-->>API: Data (rows)
  API->>API: Serialize with Pydantic schema
  API-->>Frontend: JSON response
  Frontend-->>User: Update UI
```

## What Happens in Different Layers (Network, Application, etc.)

When a user interacts with the system (e.g., uploads a file, requests data, logs in), the request passes through several logical and technical layers. Each layer has a specific role in processing, securing, and delivering the request and response.

### Layered Architecture Overview

```mermaid
flowchart TD
  User[User (Browser)]
  Net[Network Layer (HTTP/S, TCP/IP)]
  App[Application Layer (FastAPI, Routers, Auth, Business Logic)]
  DB[Database Layer (SQLAlchemy, PostgreSQL)]
  Storage[Storage Layer (Uploads Folder, Static Files)]
  Sec[Security Layer (JWT, OAuth2, CORS, Validation)]

  User --> Net
  Net --> Sec
  Sec --> App
  App --> DB
  App --> Storage
  DB <--> Storage
```

---

### 1. Network Layer
- **Role:** Transports data between the user's browser and the backend server over the internet or local network.
- **Protocols:** HTTP/HTTPS (application), TCP/IP (transport/network).
- **What Happens:**
  - User's browser sends an HTTP(S) request (e.g., file upload, API call) to the backend server's IP address and port (e.g., `http://localhost:8000`).
  - Routers, firewalls, and load balancers may forward or filter the request.
- **Code/Deployment Mapping:**
  - No direct code, but affected by server configuration, deployment (Nginx, cloud, etc.), and CORS settings in `main.py`.

### 2. Security Layer
- **Role:** Ensures only authorized and valid requests are processed.
- **Mechanisms:** JWT authentication, OAuth2, CORS, input validation, HTTPS (TLS/SSL).
- **What Happens:**
  - Checks for valid JWT token in headers (authentication).
  - Enforces CORS policy (which origins can access the API).
  - Validates request data (Pydantic schemas, file type/size checks).
  - In production, HTTPS encrypts all traffic.
- **Code/Deployment Mapping:**
  - `core/auth.py`, `main.py` (CORS), `schemas.py`, `routers/` (role checks).

### 3. Application Layer
- **Role:** Handles business logic, API routing, and request/response processing.
- **Components:** FastAPI app, routers, services, Pydantic schemas.
- **What Happens:**
  - FastAPI receives the request and routes it to the correct endpoint (router function).
  - Business logic is executed (e.g., create application, upload file, generate report).
  - Data is validated and serialized using Pydantic schemas.
- **Code/Deployment Mapping:**
  - `main.py`, `routers/`, `services/`, `schemas.py`.

### 4. Database Layer
- **Role:** Stores and retrieves persistent data (users, applications, documents, etc.).
- **Components:** SQLAlchemy ORM, PostgreSQL database.
- **What Happens:**
  - Application layer uses SQLAlchemy to query or update the database.
  - Alembic manages schema migrations.
- **Code/Deployment Mapping:**
  - `models.py`, `database.py`, `alembic/`, `alembic.ini`.

### 5. Storage Layer
- **Role:** Manages file storage for uploads and generated reports.
- **Components:** Local filesystem (`uploads/`, `reports/`), optionally cloud storage.
- **What Happens:**
  - Uploaded files are saved to the `uploads/` directory.
  - Generated reports are saved to the `reports/` directory.
  - Files are served as static files via FastAPI or a web server.
- **Code/Deployment Mapping:**
  - `routers/documents.py`, `main.py` (static files), `core/config.py`.

---

**Summary Table: Layer Responsibilities and Code Mapping**

| Layer            | Responsibility                                 | Main Code/Config Files                |
|------------------|------------------------------------------------|---------------------------------------|
| Network Layer    | HTTP(S) transport, routing, CORS               | main.py (CORS), deployment configs    |
| Security Layer   | Auth, JWT, OAuth2, validation, HTTPS           | core/auth.py, main.py, schemas.py     |
| Application Layer| Routing, business logic, serialization         | main.py, routers/, services/, schemas.py |
| Database Layer   | Persistent data storage, schema migration      | models.py, database.py, alembic/      |
| Storage Layer    | File uploads, static files, report storage     | routers/documents.py, main.py, core/config.py |

---

When a user uploads a file or makes any request, the data flows through all these layers, each adding value (transport, security, logic, storage) and ensuring the system is robust, secure, and maintainable.

---

## What is an Endpoint?

An **endpoint** is a specific URL path in the backend API that performs a particular action (such as creating, reading, updating, or deleting data). Endpoints are defined in FastAPI routers using decorators like `@router.get`, `@router.post`, etc. Each endpoint corresponds to a function that handles HTTP requests and responses.

- **Example:** `POST /api/applications` creates a new application.
- **Endpoints are grouped by resource** (applications, users, documents, etc.) and follow RESTful conventions.
- **See routers/** for all endpoint definitions.

---

## Backend Endpoints Table

| Method | Endpoint | Purpose | Request Schema | Response Schema | Tables Affected |
|--------|----------|---------|---------------|----------------|-----------------|
| POST   | /api/auth/login | User login, get JWT | LoginRequest | Token | users |
| GET    | /api/users/me | Get current user info | JWT token | User | users |
| POST   | /api/applications | Create application | ApplicationCreate | Application | applications |
| GET    | /api/applications | List applications | - | List[Application] | applications |
| PUT    | /api/applications/{id} | Update application | ApplicationUpdate | Application | applications |
| POST   | /api/documents/upload | Upload document | multipart/form-data | Document | documents |
| GET    | /api/documents/{id} | Download document | - | File | documents |
| POST   | /api/evaluations | Create evaluation | EvaluationCreate | Evaluation | evaluations |
| GET    | /api/evaluations/my | List my evaluations | - | List[Evaluation] | evaluations |
| PUT    | /api/evaluations/{id} | Update evaluation | EvaluationUpdate | Evaluation | evaluations |
| POST   | /api/reports/generate/{evaluation_id} | Generate report | (title) | TechnicalReportResponse | technical_reports, evaluations, applications |
| GET    | /api/reports/my-reports | List my reports | - | List[TechnicalReportResponse] | technical_reports |
| POST   | /api/reports/submit-for-review/{report_id} | Submit report for review | - | MessageResponse | technical_reports, applications |
| POST   | /api/reports/review/{report_id} | Supervisor review | TechnicalReportUpdate | MessageResponse | technical_reports |
| GET    | /api/reports/download/{report_id} | Download report file | - | File | technical_reports |

*(And more for other resources; see routers/ for full list)*

---

## SQLAlchemy, Alembic, and Schema Migration

- **SQLAlchemy** is the ORM (Object-Relational Mapper) used to define Python classes (`models.py`) that map to database tables. It allows you to interact with the database using Python code instead of raw SQL.
  - **Code:** `app/models.py`, `app/database.py`, `app/schemas.py`
- **Alembic** is the migration tool that manages changes to the database schema over time. It tracks changes in your models and generates migration scripts to upgrade or downgrade the database structure.
  - **Code:** `alembic/`, `alembic.ini`, `alembic/env.py`, `alembic/versions/`
- **Schema Migration** is the process of updating the database structure (tables, columns, constraints) as your application evolves. Alembic automates this process.

**How it works:**
1. You define or update models in `models.py`.
2. Run `alembic revision --autogenerate -m "Describe change"` to create a migration script.
3. Run `alembic upgrade head` to apply migrations to the database.
4. The database schema is now in sync with your models.

**Key files:**
- `app/models.py`: SQLAlchemy models (tables)
- `alembic/`: Migration scripts and config
- `alembic.ini`: Alembic settings (DB URL, script location)
- `app/database.py`: SQLAlchemy engine/session setup

---

## Debug Guide

- **Browser DevTools:**
  - Use the Network tab to inspect API requests/responses, check for errors, and debug data flow.
- **Backend Logs:**
  - Check terminal/server logs for error messages, tracebacks, or failed requests.
- **Database Inspection:**
  - Use tools like DBeaver or pgAdmin to inspect tables and data directly.
- **Code Tracing:**
  - Trace the flow from frontend API call → backend router → service/model → database.
- **Common Issues:**
  - 401/403 errors: Check authentication/permissions.
  - 500 errors: Check backend logs for tracebacks.
  - Wrong/missing data: Check API response, backend logic, and DB contents.
- **See also:** Debugging and Controlling Data Flow section in `database_guide.md`.

---

## Test Guide

- **Manual Testing:**
  - Use the test accounts provided to log in as different roles (admin, evaluator, applicant, etc.).
  - Test all main workflows: application submission, document upload, evaluation, report generation, supervisor review.
- **API Testing:**
  - Use browser DevTools or tools like Postman to test API endpoints directly.
  - Use the provided `testAPIEndpoints()` utility in the frontend console for automated endpoint checks.
- **Automated Testing:**
  - Run `pytest` in the backend directory to execute backend tests.
  - See `TESTING_GUIDE.md` for detailed test scenarios and troubleshooting tips.

---

## File Uploads: How They Work and Deployment Considerations

- **Upload Flow:**
  - User selects a file in the frontend and uploads via `/api/documents/upload`.
  - Backend receives the file, validates type/size, and saves it to the `uploads/` directory (see `core/config.py`, `routers/documents.py`).
  - Metadata is stored in the `documents` table (file path, size, type, etc.).
  - Files are served as static files via `/uploads/` (see `main.py`).
- **Deployment Considerations:**
  - The `uploads/` folder must exist and be writable by the backend server.
  - In production, you may want to use a dedicated storage volume or cloud storage (e.g., AWS S3) for uploads.
  - By default, uploaded files are accessible via `/uploads/{application_id}/{filename}`. If public access is not desired, restrict access at the web server or application level.
  - **Security:** Only authenticated users can upload. File types and sizes are restricted in `core/config.py`.
- **User Access:**
  - Uploaded files are accessible via download endpoints and `/uploads/` URLs. If deploying publicly, consider access controls.
- **Code:**
  - `routers/documents.py`, `core/config.py`, `main.py`, `models.py` (Document)

---

## Deployment Paths and Steps

### 1. Database
- PostgreSQL should be running as a service (default port 5432).
- Database name: `itrc_cc_db`
- User: `postgres` (change password in production)
- Connection string: `postgresql+psycopg://postgres:your_password@localhost:5432/itrc_cc_db`

### 2. Backend
- Path: `backend/`
- Create and activate virtual environment:
  - `python -m venv venv`
  - `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/Mac)
- Install dependencies: `pip install -r requirements.txt`
- Create `.env` file with DB and secret settings (see README.md)
- Initialize database: `python init_db.py`
- Start server: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/api/docs`

### 3. Frontend
- Path: `frontend/E-learning-1.0.0/`
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Frontend: `http://localhost:3000`

**For production:**
- Use a process manager (e.g., Gunicorn, Supervisor) for backend
- Use a production web server (e.g., Nginx) to serve frontend and proxy API requests
- Secure `.env` files and database credentials
- Set up HTTPS (TLS/SSL) for secure communication
- Ensure `uploads/` and `reports/` folders are persistent and backed up

---

## Further Reading
- See `database_guide.md` in this folder for detailed database schema and relationships.
- For API usage, see the OpenAPI docs at `/api/docs` when the backend is running. 