# ITRC Common Criteria Evaluation Platform
# سامانه ارزیابی معیارهای مشترک ITRC

A comprehensive web-based platform for evaluating IT products according to Common Criteria (CC) standards, designed for the Information Technology Research Center (ITRC) of Iran.

پلتفرم جامع تحت وب برای ارزیابی محصولات فناوری اطلاعات بر اساس استانداردهای معیارهای مشترک (CC)، طراحی شده برای مرکز تحقیقات فناوری اطلاعات ایران (ITRC).

## 🚀 Features / ویژگی‌ها

### English
- **Multi-Role Dashboard**: Separate interfaces for Applicants, Evaluators, Governance, and Admin
- **Document Management**: Upload and manage 12 mandatory CC documents
- **Evaluation Workflow**: Complete CC-compliant evaluation process
- **Report Generation**: Generate ETR, TRP, and VTR reports using templates
- **70 Product Types**: Support for diverse IT product evaluations
- **Persian Language**: Full RTL support for Iranian users
- **Real-time Notifications**: Track application status and updates
- **Secure Authentication**: JWT-based authentication with role-based access

### Persian
- **داشبورد چندنقشه**: رابط‌های جداگانه برای متقاضیان، ارزیابان، حاکمیت و مدیر
- **مدیریت اسناد**: آپلود و مدیریت ۱۲ سند الزامی CC
- **گردش کار ارزیابی**: فرآیند کامل ارزیابی مطابق با CC
- **تولید گزارش**: تولید گزارش‌های ETR، TRP و VTR با استفاده از الگوها
- **۷۰ نوع محصول**: پشتیبانی از ارزیابی انواع محصولات IT
- **زبان فارسی**: پشتیبانی کامل RTL برای کاربران ایرانی
- **اطلاع‌رسانی زمان‌واقعی**: پیگیری وضعیت درخواست و به‌روزرسانی‌ها
- **احراز هویت امن**: احراز هویت مبتنی بر JWT با دسترسی مبتنی بر نقش

## 🏗️ Tech Stack / پشته فناوری

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: ORM for database operations
- **JWT**: Secure authentication
- **Pydantic**: Data validation and serialization

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **RTL Support**: Right-to-left layout for Persian

## 📋 Prerequisites / پیش‌نیازها

### System Requirements
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Git

### Persian / فارسی
- پایتون نسخه ۳.۸ یا بالاتر
- Node.js نسخه ۱۸ یا بالاتر
- PostgreSQL نسخه ۱۲ یا بالاتر
- گیت

## 🛠️ Installation & Setup / نصب و راه‌اندازی

### 1. Clone the Repository / کلون کردن مخزن

```bash
git clone https://github.com/your-repo/itrc-cc-platform.git
cd itrc-cc-platform
```

### 2. Database Setup / راه‌اندازی پایگاه داده

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE itrc_cc_db;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE itrc_cc_db TO postgres;
\q
```

### 3. Backend Setup / راه‌اندازی بک‌اند

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
DATABASE_URL=postgresql://postgres:password@localhost:5432/itrc_cc_db
SECRET_KEY=your-secret-key-here-change-in-production-itrc-cc-platform-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads
ALLOWED_EXTENSIONS=.pdf,.doc,.docx,.txt,.zip
REDIS_URL=redis://localhost:6379
EOL

# Create uploads directory
mkdir uploads

# Initialize database with sample data
python init_db.py
```

### 4. Frontend Setup / راه‌اندازی فرانت‌اند

```bash
# Navigate to frontend directory
cd ../frontend/E-learning-1.0.0

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🚀 Running the Application / اجرای برنامه

### Start Backend Server / راه‌اندازی سرور بک‌اند

```bash
cd backend
# Activate virtual environment if not already active
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/api/docs`

### Start Frontend Server / راه‌اندازی سرور فرانت‌اند

```bash
cd frontend/E-learning-1.0.0
npm run dev
```

The frontend will be available at: `http://localhost:3000`

## 👥 Test Accounts / حساب‌های آزمایشی

Use these accounts to test different user roles:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@itrc.ac.ir | admin123 | مدیر سیستم |
| Governance | governance@itrc.ac.ir | gov123 | مسئول حاکمیتی |
| Evaluator | evaluator@itrc.ac.ir | eval123 | ارزیاب ITRC |
| Applicant | applicant@company.com | app123 | متقاضی |

## 📊 Database Schema / ساختار پایگاه داده

### Key Tables / جداول کلیدی

- **users**: User accounts with role-based access
- **product_types**: 70 different IT product types
- **applications**: Evaluation requests from applicants
- **documents**: Uploaded CC documents (ST, ALC, AGD, etc.)
- **evaluations**: Evaluation process tracking
- **reports**: Generated ETR, TRP, VTR reports

## 🔄 Workflow / گردش کار

### 1. Application Submission / ارسال درخواست
1. Applicant registers and logs in
2. Creates new evaluation application
3. Uploads required documents (12 types)
4. Submits application for review

### 2. Evaluation Process / فرآیند ارزیابی
1. Governance reviews and assigns evaluator
2. Evaluator conducts technical assessment
3. Document review, security testing, vulnerability assessment
4. Generate ETR, TRP, VTR reports

### 3. Certification / صدور گواهی
1. Governance reviews evaluation reports
2. Approves or requests modifications
3. Issues final certification

## 📁 Project Structure / ساختار پروژه

```
itrc-cc-platform/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Core utilities (auth, config)
│   │   ├── routers/        # API route handlers
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── main.py         # FastAPI app entry point
│   ├── requirements.txt    # Python dependencies
│   └── init_db.py         # Database initialization
├── frontend/               # Next.js frontend
│   └── E-learning-1.0.0/
│       ├── src/
│       │   ├── app/        # Next.js app directory
│       │   └── components/ # React components
│       ├── public/         # Static assets
│       └── package.json    # Node.js dependencies
└── README.md              # This file
```

## 🔧 Development / توسعه

### Backend Development / توسعه بک‌اند

```bash
# Add new API endpoint
# Edit app/routers/your_router.py

# Add new database model
# Edit app/models.py

# Create migration (if using Alembic)
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Frontend Development / توسعه فرانت‌اند

```bash
# Add new page
# Create file in src/app/your-page/page.tsx

# Add new component
# Create file in src/components/YourComponent.tsx

# Build for production
npm run build
```

## 🐛 Troubleshooting / عیب‌یابی

### Common Issues / مشکلات رایج

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check database exists
   psql -U postgres -l
   ```

2. **Port Already in Use**
   ```bash
   # Kill process using port 8000
   lsof -ti:8000 | xargs kill -9
   
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

3. **Module Not Found Error**
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt
   npm install
   ```

## 📝 API Documentation / مستندات API

Access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

### Key Endpoints / نقاط پایانی کلیدی

- `POST /api/auth/login` - User authentication
- `GET /api/applications` - List applications
- `POST /api/documents/upload/{application_id}` - Upload documents
- `POST /api/evaluations` - Create evaluation
- `POST /api/reports` - Generate reports

## 🔒 Security / امنیت

- JWT-based authentication
- Role-based access control (RBAC)
- File upload validation
- SQL injection protection
- XSS protection

## 🌐 Deployment / استقرار

### Production Deployment / استقرار تولید

```bash
# Backend (using Gunicorn)
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend (build for production)
npm run build
npm start
```

### Docker Deployment / استقرار با Docker

```dockerfile
# Create docker-compose.yml for easy deployment
# Include PostgreSQL, Redis, Backend, Frontend services
```

## 🤝 Contributing / مشارکت

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## 📄 License / مجوز

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support / پشتیبانی

For support and questions:
- Email: support@itrc.ac.ir
- Phone: +98 21 12345678
- Address: ITRC, Azadi Ave, Tehran, Iran

---

**Built with ❤️ for ITRC Iran** / **ساخته شده با ❤️ برای ITRC ایران** 