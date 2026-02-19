# GMS Setup Guide

## Quick Start (Windows with XAMPP)

### 1. Install Dependencies
```bash
cd c:\xampp\htdocs\GMS
npm install
cd backend
npm install
cd ..\frontend
npm install
```

### 2. Setup PostgreSQL Database

**Option A: Using XAMPP PostgreSQL**
1. Start PostgreSQL from XAMPP Control Panel
2. Open pgAdmin or command line
3. Create database:
```sql
CREATE DATABASE gms_db;
```

**Option B: Using Standalone PostgreSQL**
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create database using pgAdmin or psql

### 3. Configure Environment

Edit `backend\.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/gms_db?schema=public"
JWT_SECRET="gms-super-secret-jwt-key-change-in-production-2024"
PORT=5000
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 4. Initialize Database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
node scripts\seed.js
```

### 5. Start Application

**Option A: Start Both (Recommended)**
```bash
cd c:\xampp\htdocs\GMS
npm run dev
```

**Option B: Start Separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 6. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Login: admin@gym.com / admin123

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in backend\.env
- Ensure database `gms_db` exists

### Port Already in Use
- Change PORT in backend\.env
- Update proxy in frontend\vite.config.js

### Prisma Errors
```bash
cd backend
npx prisma generate
npx prisma migrate reset
node scripts\seed.js
```

### Module Not Found
```bash
npm run install-all
```

## Production Deployment

### Backend (Render/Heroku)
1. Push code to GitHub
2. Connect to Render/Heroku
3. Add PostgreSQL addon
4. Set environment variables
5. Run: `npx prisma migrate deploy`

### Frontend (Vercel)
1. Push code to GitHub
2. Import to Vercel
3. Set build command: `cd frontend && npm run build`
4. Set output directory: `frontend/dist`
5. Add env: `VITE_API_URL=your-backend-url`

## Features Overview

### Admin Features
- Member management (CRUD)
- Attendance tracking
- Payment processing
- Accounting (Ledger, Reports, Invoices)
- Settings management
- Real-time notifications

### Member Features
- View profile
- Check attendance history
- View payment history

### Trainer Features
- View assigned classes
- Track attendance
- View member list

## API Testing

Use Postman or curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@gym.com\",\"password\":\"admin123\"}"

# Get Members (with token)
curl http://localhost:5000/api/members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For issues:
1. Check logs in terminal
2. Verify database connection
3. Clear browser cache
4. Restart servers
