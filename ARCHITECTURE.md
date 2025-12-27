# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PLATEFORME PÉDAGOGIQUE                           │
│                        Educational Platform                              │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┐          ┌────────────────────────────────┐
│      FRONTEND (React)          │          │      BACKEND (Django)          │
│      Port: 5173                │◄────────►│      Port: 8000                │
└────────────────────────────────┘   HTTP   └────────────────────────────────┘
                                    REST API
┌────────────────────────────────┐          ┌────────────────────────────────┐
│  • React 19.2                  │          │  • Django 6.0                  │
│  • Material-UI 6               │          │  • Django REST Framework       │
│  • React Router 7              │          │  • JWT Authentication          │
│  • Vite 7                      │          │  • CORS Headers                │
│  • Axios (for API calls)       │          │  • Pillow (file handling)      │
└────────────────────────────────┘          └────────────────────────────────┘

                                            ┌────────────────────────────────┐
                                            │     DATABASE (SQLite)          │
                                            │                                │
                                            │  • User accounts               │
                                            │  • File metadata               │
                                            │  • Progress tracking           │
                                            └────────────────────────────────┘

                                            ┌────────────────────────────────┐
                                            │    FILE STORAGE (media/)       │
                                            │                                │
                                            │  • PDF documents               │
                                            │  • Word documents              │
                                            │  • PowerPoint files            │
                                            └────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              API ENDPOINTS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTHENTICATION                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ POST   /api/auth/register/         │ Register new user (formateur/apprenant)│
│ POST   /api/auth/login/            │ Login and get JWT tokens               │
│ POST   /api/auth/token/refresh/    │ Refresh access token                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ USERS                                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET    /api/users/                 │ List all users (authenticated)         │
│ GET    /api/users/me/              │ Get current user info                  │
│ GET    /api/users/{id}/            │ Get user details                       │
│ PUT    /api/users/{id}/            │ Update user                            │
│ DELETE /api/users/{id}/            │ Delete user                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ FILES                                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET    /api/files/                 │ List all files                         │
│ POST   /api/files/                 │ Upload new file (formateurs only)      │
│ GET    /api/files/{id}/            │ Get file details                       │
│ PUT    /api/files/{id}/            │ Update file metadata                   │
│ DELETE /api/files/{id}/            │ Delete file                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PROGRESS                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ GET    /api/progress/              │ List progress entries                  │
│ POST   /api/progress/              │ Create new progress entry              │
│ GET    /api/progress/{id}/         │ Get progress details                   │
│ PUT    /api/progress/{id}/         │ Update progress                        │
│ DELETE /api/progress/{id}/         │ Delete progress                        │
│ GET    /api/progress/stats/        │ Get statistics (apprenants only)       │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              DATA MODELS
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────┐
│  User                          │
├────────────────────────────────┤
│  • id (PK)                     │
│  • username (unique)           │
│  • email                       │
│  • password (hashed)           │
│  • user_type (formateur/       │
│    apprenant)                  │
│  • first_name                  │
│  • last_name                   │
│  • date_joined                 │
└────────────────────────────────┘
         │
         │ 1:N
         ▼
┌────────────────────────────────┐
│  File                          │
├────────────────────────────────┤
│  • id (PK)                     │
│  • title                       │
│  • subject                     │
│  • theme                       │
│  • file (FileField)            │
│  • uploaded_by (FK → User)     │
│  • uploaded_at                 │
└────────────────────────────────┘

         │
         │ 1:N
         ▼
┌────────────────────────────────┐
│  Progress                      │
├────────────────────────────────┤
│  • id (PK)                     │
│  • user (FK → User)            │
│  • quiz_title                  │
│  • quiz_subject                │
│  • score                       │
│  • max_score                   │
│  • percentage (calculated)     │
│  • completed (boolean)         │
│  • completed_at                │
│  • created_at                  │
│  • updated_at                  │
└────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              USER FLOW
═══════════════════════════════════════════════════════════════════════════════

FORMATEUR (Trainer) Flow:
─────────────────────────
1. Register/Login → Get JWT token
2. Access Dashboard
3. Upload files (PDF, DOC, PPT)
4. View uploaded files
5. View learner progress (all users)

APPRENANT (Learner) Flow:
──────────────────────────
1. Register/Login → Get JWT token
2. Access Dashboard
3. View available files
4. Take quizzes
5. View personal progress
6. View statistics (total quizzes, scores, etc.)


═══════════════════════════════════════════════════════════════════════════════
                              SECURITY
═══════════════════════════════════════════════════════════════════════════════

✓ JWT Token Authentication
✓ Password Hashing (PBKDF2)
✓ CORS Protection
✓ Permission-based Access Control
✓ User Data Isolation
✓ Environment Variables for Secrets
✓ SQL Injection Prevention (ORM)
✓ XSS Protection (DRF escaping)


═══════════════════════════════════════════════════════════════════════════════
                              FILE STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

quiz/
├── backend/                    # Django Backend
│   ├── config/                 # Project settings
│   │   ├── settings.py         # Configuration
│   │   ├── urls.py             # Main routing
│   │   └── wsgi.py             # WSGI entry
│   ├── pedagogical/            # Main app
│   │   ├── models.py           # Data models
│   │   ├── serializers.py      # DRF serializers
│   │   ├── views.py            # API views
│   │   ├── urls.py             # App routing
│   │   └── admin.py            # Admin config
│   ├── media/                  # Uploaded files
│   ├── manage.py               # Django CLI
│   ├── requirements.txt        # Dependencies
│   ├── test_api.sh            # Test script
│   └── README.md              # Backend docs
├── src/                        # React Frontend
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── App.jsx                # Main app
│   └── main.jsx               # Entry point
├── INTEGRATION.md             # Integration guide
├── IMPLEMENTATION_SUMMARY.md  # Implementation summary
└── README.md                  # Main documentation


═══════════════════════════════════════════════════════════════════════════════
                              DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════════

DEVELOPMENT:
  Backend:  python manage.py runserver (port 8000)
  Frontend: npm run dev (port 5173)

PRODUCTION (Future):
  Backend:  Gunicorn/uWSGI + Nginx
  Frontend: npm run build → Static hosting
  Database: PostgreSQL/MySQL
  Storage:  S3/Cloud storage for media files
```
