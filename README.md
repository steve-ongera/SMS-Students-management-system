# SMS Backend – Django REST API

## Setup
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data        # creates admin/admin123
python manage.py runserver 8000
```

## API Base URL
`http://localhost:8000/api/`

## Auth Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/login/ | Login → returns JWT tokens |
| POST | /api/auth/refresh/ | Refresh access token |
| POST | /api/auth/logout/ | Logout |
| GET  | /api/auth/me/ | Current user info |

## Resource Endpoints (all require Bearer token + is_staff)
| Resource | URL |
|----------|-----|
| Dashboard stats | GET /api/dashboard/ |
| Programmes | /api/programmes/ |
| Courses | /api/courses/ |
| Students | /api/students/ |
| Enrollments | /api/enrollments/ |
| Exams | /api/exams/ |
| Exam Results | /api/results/ |
| Admin Users | /api/users/ |

## Default Credentials
- **admin** / admin123 (superuser)
- **registrar** / reg123 (staff)