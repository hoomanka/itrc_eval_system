# Comprehensive Database Guide for Your Application

Welcome! This guide will help you understand **all the data** in your application, how it is structured, how it flows, and how you can work with it—even if you are new to coding, backend, frontend, or databases.

---

## Table of Contents
1. [What is a Database?](#what-is-a-database)
2. [List of All Tables](#list-of-all-tables)
3. [Entity-Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
4. [How Tables Relate (Relationships)](#how-tables-relate-relationships)
5. [Data Flow in the Application](#data-flow-in-the-application)
6. [Where Tables Are Used in the Code](#where-tables-are-used-in-the-code)
7. [How to Manipulate Data with PostgreSQL](#how-to-manipulate-data-with-postgresql)
8. [How Backend, Frontend, and Database Connect](#how-backend-frontend-and-database-connect)
9. [Glossary: What Does Each Field Mean?](#glossary-what-does-each-field-mean)
10. [Detailed Table Fields and Code Mapping](#detailed-table-fields-and-code-mapping)
11. [Mermaid Diagrams for ERD, Data Flow, and Schemas](#mermaid-diagrams-for-erd-data-flow-and-schemas)
12. [Database Connection Information](#database-connection-information)
13. [Technical Data Flow: How Data Moves in the System](#technical-data-flow-how-data-moves-in-the-system)
14. [API Endpoints Table](#api-endpoints-table)
15. [Technical Review: Authentication](#technical-review-authentication)
16. [Technical Review: File Uploads](#technical-review-file-uploads)
17. [Report Generation System: Data, Models, Schemas, Code](#report-generation-system-data-models-schemas-code)
18. [Debugging and Controlling Data Flow](#debugging-and-controlling-data-flow)
19. [Evaluator Request Status Flow](#evaluator-request-status-flow)
20. [Frontend Dashboard Pages and Their Data](#frontend-dashboard-pages-and-their-data)

---

## What is a Database?
A **database** is like a big, organized digital notebook where all your app's information is stored. In this project, you use **PostgreSQL** (a popular, powerful database system).

---

## List of All Tables
Here are the main tables (collections of data) in your app:

- **users**: All people in the system (applicants, evaluators, supervisors, admins)
- **product_types**: Types of products that can be evaluated
- **applications**: Requests from applicants to evaluate a product
- **documents**: Files uploaded for each application
- **evaluations**: The evaluation process for each application
- **technical_reports**: The final reports generated after evaluation
- **protection_profiles**: Security profiles for products
- **evaluation_guidelines**: Guidelines for evaluators
- **product_classes**: Security classes (SFRs, CC classes)
- **product_subclasses**: Subcategories of classes
- **evaluation_helps**: Help texts for evaluators
- **security_targets**: Security target documents for each application
- **st_class_selections**: Which classes/subclasses are selected for a security target

---

## Entity-Relationship Diagram (ERD)
This diagram shows how tables are connected. (Arrows show relationships.)

```
[users] <---+         +--< [documents]
   ^        |         |
   |        v         v
[applications] ---> [evaluations] ---> [technical_reports]
   |   |                ^
   |   +--> [security_targets] --> [st_class_selections] >--+ 
   |                                                        |
   +--> [product_types] <---+                               |
                            |                               |
[product_classes] <---+     |                               |
   ^                  |     |                               |
   |                  +-- [product_subclasses]              |
   |                                                      |
   +--< [evaluation_helps]                                 |
                                                           |
[protection_profiles]                                      |
[ evaluation_guidelines ]                                  |
```

**Legend:**
- `[table]` = a table in the database
- `--->` = one-to-many (one record points to many in the next table)
- `<---+` = many-to-one (many records point to one in the previous table)

---

## Mermaid ERD Diagram
You can copy-paste this into [Mermaid Live Editor](https://mermaid.live/) or [draw.io](https://www.draw.io/) (choose Mermaid diagram) to see a visual ERD:

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

---

## How Tables Relate (Relationships)
- **users** can be applicants, evaluators, supervisors, or admins.
- **applications** are created by users (applicants).
- Each **application** can have many **documents**.
- Each **application** is evaluated (one **evaluation** per application).
- Each **evaluation** is done by a user (evaluator).
- Each **evaluation** can have many **technical_reports**.
- Each **application** has a **security_target** (document describing security goals).
- Each **security_target** has many **st_class_selections** (selected security classes/subclasses).
- **product_types** describe the type of product in an application.
- **product_classes** and **product_subclasses** describe security requirements (SFRs, CC classes).
- **evaluation_helps** and **evaluation_guidelines** help evaluators do their job.

---

## Data Flow in the Application
### Step-by-Step Data Flow
1. **Applicant registers** (creates a user in `users` table).
2. **Applicant creates an application** (`applications` table) and uploads documents (`documents` table).
3. **Admin assigns evaluator** (user with evaluator role) to the application.
4. **Evaluator starts evaluation** (`evaluations` table), fills out security target (`security_targets`), and selects classes (`st_class_selections`).
5. **Evaluator completes evaluation** (updates status, adds findings, recommendations).
6. **Evaluator generates technical report** (`technical_reports` table).
7. **Supervisor/admin reviews and approves report** (updates report status).
8. **All data is available for dashboard and reporting.**

#### Data Flow Mermaid Diagram
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

---

## Where Tables Are Used in the Code
- **models.py**: Defines all tables and relationships (SQLAlchemy models)
- **schemas.py**: Defines data shapes for API (Pydantic schemas)
- **routers/**: Contains API endpoints for each resource (e.g., users, applications, evaluations)
  - `users.py`, `applications.py`, `evaluations.py`, `reports.py`, `security_targets.py`, `documents.py`, `admin.py`
- **services/**: Business logic (e.g., `report_generator.py` for reports)
- **frontend**:
  - Applicant dashboard: `frontend/E-learning-1.0.0/src/app/dashboard/applicant/`
  - Evaluator dashboard: `frontend/E-learning-1.0.0/src/app/dashboard/evaluator/`
  - Supervisor dashboard: `frontend/E-learning-1.0.0/src/app/dashboard/supervisor/`
  - Each subfolder (e.g., `application/`, `reports/`, `evaluation/`) matches a data component

---

## How to Manipulate Data with PostgreSQL
Here are some example SQL commands for each table:

### users
```sql
-- Add a user
INSERT INTO users (email, hashed_password, full_name, role) VALUES ('user@example.com', 'hashedpw', 'Ali', 'applicant');
-- List all users
SELECT * FROM users;
-- Update a user
UPDATE users SET full_name = 'Ali Reza' WHERE id = 1;
-- Delete a user
DELETE FROM users WHERE id = 1;
```

### applications
```sql
-- Add an application
INSERT INTO applications (product_name, applicant_id, product_type_id) VALUES ('MyProduct', 2, 1);
-- List all applications
SELECT * FROM applications;
-- Update application status
UPDATE applications SET status = 'IN_EVALUATION' WHERE id = 1;
-- Delete an application
DELETE FROM applications WHERE id = 1;
```

### evaluations
```sql
-- Add an evaluation
INSERT INTO evaluations (application_id, evaluator_id) VALUES (1, 3);
-- List all evaluations
SELECT * FROM evaluations;
-- Update evaluation status
UPDATE evaluations SET status = 'COMPLETED' WHERE id = 1;
-- Delete an evaluation
DELETE FROM evaluations WHERE id = 1;
```

### technical_reports
```sql
-- Add a report
INSERT INTO technical_reports (evaluation_id, report_number, title) VALUES (1, 'ITRC-ETR-2024-0001', 'گزارش ارزیابی');
-- List all reports
SELECT * FROM technical_reports;
-- Update a report
UPDATE technical_reports SET status = 'APPROVED' WHERE id = 1;
-- Delete a report
DELETE FROM technical_reports WHERE id = 1;
```

*(Repeat similar for other tables as needed)*

---

## How Backend, Frontend, and Database Connect
- **Frontend** (what you see in your browser) sends requests to the **backend** (API).
- **Backend** (FastAPI) receives requests, uses **models.py** to talk to the **database** (PostgreSQL), and uses **schemas.py** to validate data.
- **Database** stores all the information.

**Example:**
- You fill a form in the frontend → frontend sends data to backend → backend saves it in the database.
- You view a report → frontend asks backend for report → backend gets it from database and sends it to frontend.

---

## Glossary: What Does Each Field Mean?
- **id**: Unique number for each record (row)
- **email**: User's email address
- **role**: What type of user (applicant, evaluator, etc.)
- **application_number**: Unique number for each application
- **product_name**: Name of the product being evaluated
- **status**: Current state (e.g., DRAFT, IN_EVALUATION, COMPLETED)
- **evaluation_level**: Security level (e.g., EAL1)
- **report_number**: Unique number for each report
- **created_at/updated_at**: When the record was created/updated
- **ForeignKey**: Connects one table to another (e.g., application_id links to applications)

---

## Detailed Table Fields and Code Mapping
Below is a table-by-table breakdown. For each table, you'll see:
- All fields (with type and meaning)
- Where it appears in the code (models, schemas, routers, services, frontend)

### users
**Fields:**
- id: int — unique user ID
- email: str — user's email
- hashed_password: str — password (encrypted)
- full_name: str — full name
- role: str — applicant, evaluator, supervisor, admin, etc.
- company: str — company name (optional)
- phone: str — phone number (optional)
- supervisor_id: int — supervisor's user ID (optional)
- is_active: bool — is the user active?
- created_at: datetime — when created
- updated_at: datetime — when updated

**Code:**
- models.py: User
- schemas.py: User, UserBase, UserCreate, UserUpdate, UserResponseEnhanced
- routers/users.py, routers/admin.py, routers/auth.py
- Used in: applicant, evaluator, supervisor dashboards (frontend)

### product_types
**Fields:**
- id: int
- name_en: str
- name_fa: str
- protection_profile: str
- description_en: str
- description_fa: str
- estimated_days: int
- estimated_cost: float
- required_documents: JSON (list)
- is_active: bool
- created_at: datetime

**Code:**
- models.py: ProductType
- schemas.py: ProductType, ProductTypeBase, ProductTypeCreate
- routers/applications.py

### applications
**Fields:**
- id: int
- application_number: str
- product_name: str
- product_version: str
- product_type_id: int
- applicant_id: int
- status: str
- submission_date: datetime
- estimated_completion_date: datetime
- actual_completion_date: datetime
- description: str
- evaluation_level: str
- company_name: str
- contact_person: str
- contact_email: str
- contact_phone: str
- product_description: str
- technical_contact: str
- business_contact: str
- notes: str
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: Application
- schemas.py: Application, ApplicationBase, ApplicationCreate, ApplicationUpdate, ApplicationDetail, ApplicationSummary
- routers/applications.py
- frontend: applicant dashboard, evaluator dashboard

### documents
**Fields:**
- id: int
- application_id: int
- document_type: str
- filename: str
- original_filename: str
- file_path: str
- file_size: int
- mime_type: str
- version: int
- is_approved: bool
- approval_notes: str
- uploaded_at: datetime
- uploaded_by: int

**Code:**
- models.py: Document
- schemas.py: Document, DocumentBase, DocumentUpload
- routers/documents.py
- frontend: applicant and evaluator document pages

### evaluations
**Fields:**
- id: int
- application_id: int
- evaluator_id: int
- start_date: datetime
- end_date: datetime
- status: str
- document_review_completed: bool
- security_testing_completed: bool
- vulnerability_assessment_completed: bool
- overall_score: float
- findings: str
- recommendations: str
- report_ready_for_generation: bool
- report_generated_at: datetime
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: Evaluation
- schemas.py: Evaluation, EvaluationBase, EvaluationUpdate, EvaluationResponse
- routers/evaluations.py
- frontend: evaluator dashboard, evaluation pages

### technical_reports
**Fields:**
- id: int
- evaluation_id: int
- report_number: str
- title: str
- report_type: str
- template_version: str
- status: str
- generated_by: int
- reviewed_by: int
- generated_at: datetime
- submitted_for_review_at: datetime
- reviewed_at: datetime
- approved_at: datetime
- executive_summary: str
- evaluation_methodology: str
- findings_summary: str
- conclusions: str
- supervisor_comments: str
- word_file_path: str
- pdf_file_path: str
- file_size: int
- report_data: JSON
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: TechnicalReport
- schemas.py: TechnicalReportBase, TechnicalReportResponse, TechnicalReportCreate, TechnicalReportUpdate
- routers/reports.py
- services/report_generator.py
- frontend: evaluator reports, supervisor review

### protection_profiles
**Fields:**
- id: int
- name: str
- version: str
- description: str
- file_path: str
- requirements: JSON
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: ProtectionProfile
- schemas.py: ProtectionProfile, ProtectionProfileBase, ProtectionProfileCreate
- routers/applications.py

### evaluation_guidelines
**Fields:**
- id: int
- title_en: str
- title_fa: str
- content_en: str
- content_fa: str
- document_mapping: JSON
- category: str
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: EvaluationGuideline
- schemas.py: EvaluationGuideline, EvaluationGuidelineBase, EvaluationGuidelineCreate
- routers/applications.py

### product_classes
**Fields:**
- id: int
- product_type_id: int
- name_en: str
- name_fa: str
- code: str
- description_en: str
- description_fa: str
- weight: float
- order: int
- is_active: bool
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: ProductClass
- schemas.py: ProductClassSchema
- routers/applications.py

### product_subclasses
**Fields:**
- id: int
- product_class_id: int
- name_en: str
- name_fa: str
- code: str
- description_en: str
- description_fa: str
- order: int
- is_active: bool
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: ProductSubclass
- schemas.py: ProductSubclassSchema
- routers/applications.py

### evaluation_helps
**Fields:**
- id: int
- product_class_id: int
- product_subclass_id: int
- help_text_en: str
- help_text_fa: str
- evaluation_criteria: JSON
- examples: JSON
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: EvaluationHelp
- schemas.py: EvaluationHelpSchema
- routers/applications.py

### security_targets
**Fields:**
- id: int
- application_id: int
- version: str
- status: str
- product_description: str
- toe_description: str
- created_at: datetime
- updated_at: datetime
- submitted_at: datetime

**Code:**
- models.py: SecurityTarget
- schemas.py: SecurityTarget, SecurityTargetCreate, SecurityTargetUpdate
- routers/security_targets.py
- frontend: applicant security target, evaluator evaluation

### st_class_selections
**Fields:**
- id: int
- security_target_id: int
- product_class_id: int
- product_subclass_id: int
- description: str
- justification: str
- test_approach: str
- evaluator_notes: str
- evaluation_status: str
- evaluation_score: float
- created_at: datetime
- updated_at: datetime

**Code:**
- models.py: STClassSelection
- schemas.py: STClassSelectionSchema, STClassSelectionCreate
- routers/security_targets.py
- frontend: applicant security target, evaluator evaluation

---

## Mermaid Diagrams for ERD, Data Flow, and Schemas

### ERD (Entity-Relationship Diagram)
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

### Data Flow
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

### Example Schema (users)
```mermaid
classDiagram
  class User {
    int id
    string email
    string hashed_password
    string full_name
    string role
    string company
    string phone
    int supervisor_id
    bool is_active
    datetime created_at
    datetime updated_at
  }
```

*(Repeat similar Mermaid classDiagram for other tables as needed!)*

---

## Database Connection Information

| Property         | Value                                  |
|------------------|----------------------------------------|
| Database Type    | PostgreSQL                             |
| Driver           | psycopg (SQLAlchemy)                   |
| Host             | localhost                              |
| Port             | 5432                                   |
| Database Name    | itrc_cc_db                             |
| User             | postgres                               |
| Password         | postgres123                            |
| URL              | postgresql+psycopg://postgres:postgres123@localhost:5432/itrc_cc_db |

> **Note:** In production, you should always change the default password and use environment variables for security.

---

## Technical Data Flow: How Data Moves in the System

### Overview
- **Frontend** (browser) communicates with the **backend** (FastAPI) over HTTP (or HTTPS in production).
- **Backend** uses **Pydantic schemas** to validate and serialize data, and **SQLAlchemy models** to interact with the **PostgreSQL** database.
- **Routers** define API endpoints (URLs) that the frontend calls to create, read, update, or delete data.
- **Data is transported** as JSON over HTTP(S) using the REST API.
- **Authentication** uses JWT tokens (signed, not encrypted by default).
- **File uploads** are sent as multipart/form-data.
- **Database** stores all persistent data in tables.

### Security
- **Transport encryption:**
  - In development, HTTP is used (not encrypted).
  - In production, you should use HTTPS (encrypted with TLS/SSL).
- **Authentication:**
  - JWT tokens are signed (using HS256 and a secret key).
  - Sensitive data (like passwords) is hashed before storage.
- **Database access:**
  - Only the backend connects directly to the database.
  - Passwords and secrets should be protected and not hardcoded in production.

### Technical Data Flow (Step-by-Step)
1. **User action in frontend** (e.g., submits a form)
2. **Frontend sends HTTP(S) request** (JSON or form-data) to backend API endpoint (router)
3. **Backend router** receives request, validates data with Pydantic schema
4. **Business logic/service** (if needed) processes the request
5. **SQLAlchemy model** is used to read/write data in PostgreSQL
6. **Database** stores or retrieves the data
7. **Backend** serializes response with Pydantic schema
8. **Backend sends JSON response** to frontend
9. **Frontend** updates UI with new data

### Mermaid Sequence Diagram (Technical Data Flow)
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

  Note over API,DB: In production, API <-> Frontend should use HTTPS (encrypted)
  Note over API: JWT tokens are signed, not encrypted
  Note over DB: Only backend connects to DB (not exposed to internet)
```

### Where Each Component Appears in Code
- **Schemas:** `backend/app/schemas.py` (Pydantic)
- **Models:** `backend/app/models.py` (SQLAlchemy)
- **Routers:** `backend/app/routers/` (one file per resource)
- **Services:** `backend/app/services/` (business logic, e.g., report generation)
- **Frontend:** `frontend/E-learning-1.0.0/src/app/dashboard/` (React/Next.js pages)
- **Database config:** `backend/app/core/config.py`

---

**If you want even more detail, or a Mermaid diagram for a specific table or workflow, just ask!** 

---

## API Endpoints Table

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

## Frontend Dashboard Pages and Their Data

This section lists all main dashboard pages in the frontend, what data they display, and which API endpoints or data sources they use. Use this to understand what each page shows and how it connects to the backend/database.

| Page (Path) | User Role | Purpose / Main Data Displayed | Main Data Loaded | API Endpoints / Data Source |
|-------------|-----------|-------------------------------|------------------|-----------------------------|
| `/dashboard/applicant` | Applicant | Applicant dashboard: list of all their applications, stats (total, pending, approved, rejected), user info | Applications (array), User info, Stats | `GET /api/applications` |
| `/dashboard/applicant/application/[id]` | Applicant | View details of a single application | Application details, status, documents, evaluation info | `GET /api/applications/{id}`<br>`GET /api/documents?application_id={id}` |
| `/dashboard/applicant/new-application` | Applicant | Create a new application | Product types, form fields | `GET /api/product-types`<br>`POST /api/applications` |
| `/dashboard/applicant/security-target` | Applicant | Manage/view security target for an application | Security target, selected classes, subclasses | `GET /api/security-targets?application_id={id}`<br>`GET /api/st-class-selections?security_target_id={id}` |
| `/dashboard/evaluator` | Evaluator | Evaluator dashboard: list of assigned applications (submitted/in_evaluation), stats | Applications (filtered), User info, Stats | `GET /api/applications/dashboard/list` |
| `/dashboard/evaluator/evaluation/[id]` | Evaluator | View and perform evaluation for a specific application | Evaluation details, application, findings, recommendations, status | `GET /api/evaluations/{id}`<br>`GET /api/applications/{id}` |
| `/dashboard/evaluator/reports` | Evaluator | List and generate technical reports for completed evaluations | Evaluations, technical reports, report status | `GET /api/evaluations/my`<br>`POST /api/reports/generate/{evaluation_id}`<br>`GET /api/reports/my-reports` |
| `/dashboard/evaluator/documents/[id]` | Evaluator | View/download documents for an application | Document metadata, file download | `GET /api/documents/{id}` |
| `/dashboard/supervisor` | Supervisor | Supervisor dashboard: list of all reports to review, stats, review actions | Technical reports (pending/all), stats, report details | `GET /api/reports/pending-review`<br>`GET /api/reports/my-reports`<br>`POST /api/reports/review/{report_id}` |
| `/dashboard/admin` | Admin | Admin dashboard: system stats, quick links to user/app management, system health | User info, system stats (users, applications, evaluators, certificates), admin actions | Various, mostly static or aggregated from backend |
| `/dashboard/governance` | Governance | Governance dashboard: system stats, quick links to governance actions, recent activities | User info, stats (applications, pending, in evaluation, completed), recent activities | Various, mostly static or aggregated from backend |

**Notes:**
- Subpages (like `/application/[id]`, `/evaluation/[id]`, etc.) load more detailed data for a single entity (application, evaluation, document, etc.).
- Stats are usually calculated from the main data array (e.g., applications, reports) or fetched from the backend.
- User info is loaded from `localStorage` (after login) and used for display and API authentication.
- API endpoints are called using the JWT token stored in `localStorage`.

**How to Use This Table**
- Find the page you want to understand or debug.
- See what data it loads and from where (API endpoint).
- Check the backend guide for the schema of each data type (application, evaluation, report, etc.).
- Use browser DevTools (Network tab) to see the actual API requests and responses for each page.

If you want a more detailed breakdown (including all subpages, modals, or specific component data), or a Mermaid diagram of page-data relationships, just ask!

---

## Technical Review: Authentication
- **Login:** User sends email and password to `/api/auth/login`.
- **Password:** Is hashed (not stored in plain text).
- **JWT Token:** On successful login, backend returns a signed JWT token (HS256, secret key).
- **Frontend:** Stores token (usually in localStorage or memory) and sends it in `Authorization: Bearer <token>` header for all API requests.
- **Backend:** Validates token on each request, loads user info.
- **Code:**
  - `backend/app/routers/auth.py` (login endpoint)
  - `backend/app/core/auth.py` (token creation, password hashing)
  - `backend/app/schemas.py` (Token, LoginRequest)
  - `backend/app/models.py` (User)

**Mermaid Sequence Diagram:**
```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant API
  participant DB
  User->>Frontend: Enter email/password
  Frontend->>API: POST /api/auth/login (JSON)
  API->>DB: Query users (hashed_password)
  DB-->>API: User data
  API->>API: Verify password, create JWT
  API-->>Frontend: JWT token
  Frontend->>API: (future requests) Authorization: Bearer <token>
  API->>API: Validate JWT, load user
```

---

## Technical Review: File Uploads
- **Frontend:** User selects file, uploads via form to `/api/documents/upload`.
- **Backend:** Receives file as `multipart/form-data`, saves to `uploads/` folder, stores metadata in `documents` table.
- **Database:** Stores file info (not the file itself).
- **Security:** Only authenticated users can upload; file type/size is checked.
- **Code:**
  - `backend/app/routers/documents.py`
  - `backend/app/models.py` (Document)
  - `backend/app/schemas.py` (Document, DocumentUpload)

**Mermaid Sequence Diagram:**
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

---

## Report Generation System: Data, Models, Schemas, Code

| Component | File(s) | Purpose |
|-----------|---------|---------|
| Model     | models.py (TechnicalReport, Evaluation, Application, User) | DB tables |
| Schema    | schemas.py (TechnicalReportBase, TechnicalReportResponse, Evaluation, Application) | API data shapes |
| Router    | routers/reports.py, routers/evaluations.py | API endpoints |
| Service   | services/report_generator.py | Business logic for report creation |
| Frontend  | dashboard/evaluator/reports/page.tsx | UI for generating/downloading reports |

**Data Flow:**
1. Evaluator completes evaluation (status changes in DB)
2. Evaluator generates report (API call)
3. Backend uses report generator service to create Word file, save metadata
4. Report is available for download/review

**Mermaid Diagram:**
```mermaid
flowchart TD
  FE[Frontend Evaluator Reports] -->|POST /api/reports/generate/{evaluation_id}| API[Backend API]
  API -->|calls| Service[Report Generator Service]
  Service -->|writes| DB[technical_reports, evaluations, applications]
  API -->|returns| FE
```

---

## Debugging and Controlling Data Flow
- **Browser DevTools (F12):**
  - Open Network tab to see all API requests/responses
  - Check request URL, method, payload, response, status code
  - Look for errors (red), missing data, or failed requests
- **Backend logs:**
  - Check terminal/server logs for errors or tracebacks
- **Database:**
  - Use SQL tools (e.g., DBeaver, pgAdmin) to inspect tables directly
- **Code:**
  - Trace from frontend (API call) → backend router → service/model → database
- **Common issues:**
  - Wrong/missing data: check API response, backend logic, DB contents
  - 401/403 errors: check authentication/permissions
  - 500 errors: check backend logs for tracebacks

---

## Evaluator Request Status Flow
- **Initial:** Application is created (status = `SUBMITTED` or `IN_EVALUATION`)
- **After evaluation:** Evaluator completes evaluation (status = `COMPLETED` in `evaluations` and `applications` tables)
- **After report generation:** Application status = `REPORT_GENERATED`
- **After supervisor review:** Application status = `SUPERVISOR_REVIEW` or `COMPLETED`

**Database role:**
- Status fields in `applications` and `evaluations` tables track progress
- Routers/evaluations.py and routers/reports.py update these fields
- Frontend reads status to show correct label (e.g., "new", "completed")

**Code files involved:**
- Backend: `models.py`, `schemas.py`, `routers/evaluations.py`, `routers/reports.py`, `services/report_generator.py`
- Frontend: `dashboard/evaluator/`, `dashboard/evaluator/reports/`, `dashboard/evaluator/evaluation/`

**Mermaid Diagram:**
```mermaid
stateDiagram-v2
  [*] --> Submitted: Application created
  Submitted --> InEvaluation: Evaluator assigned
  InEvaluation --> Completed: Evaluation completed
  Completed --> ReportGenerated: Report generated
  ReportGenerated --> SupervisorReview: Submitted for supervisor review
  SupervisorReview --> Approved: Supervisor approves
  SupervisorReview --> NeedsRevision: Supervisor requests revision
  NeedsRevision --> Completed: Evaluator revises
  Approved --> [*]
```

---

(Keep all previous content, just add and expand.) 