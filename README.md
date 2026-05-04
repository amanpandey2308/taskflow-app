# TaskFlow — Team Task Management App

A full-stack collaborative task management web application with role-based access control, Kanban board, and real-time dashboard analytics.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism Dark UI), JavaScript
- **Backend**: Node.js + Express.js (REST API)
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (JSON Web Tokens) + bcryptjs

---

## Project Structure
```
ethara-ai-project-3/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── seed.js
│   ├── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── css/style.css
    ├── js/
    ├── index.html
    ├── dashboard.html
    └── project.html
```

---

## Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

---

## Setup & Run Locally

### 1. Install backend dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

### 3. (Optional) Seed demo data
```bash
npm run seed
```
Demo accounts (password: `password123`):
| Role   | Email           |
|--------|-----------------|
| Admin  | alice@demo.com  |
| Member | bob@demo.com    |
| Member | carol@demo.com  |

### 4. Start the backend
```bash
npm run dev
```
API runs at: `http://localhost:5000`

### 5. Open the frontend
Open `frontend/index.html` in your browser directly (double-click or use Live Server in VS Code).

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/signup | Register | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/me | Current user | JWT |
| GET | /api/projects | List projects | JWT |
| POST | /api/projects | Create project | JWT |
| GET | /api/projects/:id | Get project | JWT |
| POST | /api/projects/:id/members | Add member | Admin |
| DELETE | /api/projects/:id/members/:uid | Remove member | Admin |
| GET | /api/projects/:id/tasks | List tasks | Member |
| POST | /api/projects/:id/tasks | Create task | Admin |
| PATCH | /api/tasks/:id | Update task | Admin/Member |
| DELETE | /api/tasks/:id | Delete task | Admin |
| GET | /api/dashboard | Dashboard stats | JWT |

---

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete tasks | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| View project/tasks | ✅ | ✅ |

---

## Features
- JWT-based authentication
- Role-based access control (Admin / Member)
- Kanban board with task filtering
- Dashboard with stats, completion progress, overdue tasks
- Add/remove project members
- Priority levels (High/Medium/Low) with color coding
- Toast notifications
- Responsive dark glassmorphism UI
