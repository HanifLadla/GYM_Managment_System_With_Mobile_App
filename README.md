# Gym Management System (GMS)

Advanced full-stack Gym Management System with complete Accounting module, built with React, Node.js, Express, PostgreSQL, and Prisma.

## Features

### Core Modules
- **Authentication & Authorization**: JWT-based auth with role-based access (Admin, Trainer, Member)
- **Member Management**: Complete CRUD, admission, card generation with QR codes
- **Attendance System**: Card-based check-in/check-out with real-time Socket.io updates
- **Trainer & Classes**: Manage trainers, schedules, and class enrollments
- **Equipment & Inventory**: Track equipment with low-stock alerts
- **Payments & Billing**: Payment processing with auto-reminders
- **HR Module**: Complete staff management, attendance, leave, and payroll system

### Accounting Module (Complete)
- **Ledger System**: Full double-entry bookkeeping
- **Transactions**: Income/Expense tracking with categories
- **Reports**: Balance Sheet, Profit & Loss, Trial Balance
- **Invoices**: PDF generation and tracking
- **Integration**: Auto-posting from payments/fees

### HR Module (Complete)
- **Staff Management**: Complete employee records with CNIC, photo, department, designation
- **Staff Attendance**: Daily check-in/check-out tracking with status (Present, Absent, Half Day, Late)
- **Leave Management**: Leave application, approval workflow (Sick, Casual, Annual, Unpaid)
- **Payroll System**: Monthly payroll with allowances, deductions, commission, auto-calculation

### UI Components
- **AlertCard**: Reusable notification component with animations (success, error, warning, info)
- **DataTable**: Paginated tables with search and sort
- **AnimatedModal**: Smooth modal dialogs
- **Charts**: Recharts for analytics visualization

## Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL + Prisma ORM
- JWT Authentication
- Socket.io for real-time updates
- Node-cron for scheduled tasks
- Nodemailer (email) + Twilio (SMS)
- QRCode generation
- PDFMake for invoices

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- React Router v6
- Axios
- Recharts
- Socket.io Client

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Install

```bash
cd GMS
npm run install-all
```

### 2. Database Setup

Create PostgreSQL database:
```sql
CREATE DATABASE gms_db;
```

Configure backend/.env:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gms_db?schema=public"
JWT_SECRET="your-secret-key"
PORT=5000
```

### 3. Run Migrations and Seed

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

Default admin credentials:
- Email: admin@gym.com
- Password: admin123

### 4. Start Development Servers

From root directory:
```bash
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Backend: http://localhost:5000
Frontend: http://localhost:5173

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login
- POST `/api/auth/forgot-password` - Password reset
- GET `/api/auth/me` - Get current user

### Members
- GET `/api/members` - List members (paginated)
- POST `/api/members` - Create member
- GET `/api/members/:id` - Get member details
- PUT `/api/members/:id` - Update member
- DELETE `/api/members/:id` - Delete member
- POST `/api/members/:id/card` - Generate QR card

### Attendance
- POST `/api/attendance/checkin/:cardId` - Check-in
- POST `/api/attendance/checkout/:attendanceId` - Check-out
- GET `/api/attendance/member/:memberId` - Member attendance history
- GET `/api/attendance/today` - Today's attendance

### Accounting
- GET `/api/accounting/accounts` - List accounts
- POST `/api/accounting/accounts` - Create account
- GET `/api/accounting/transactions` - List transactions (filtered)
- POST `/api/accounting/transactions` - Create transaction
- GET `/api/accounting/balance-sheet` - Balance sheet report
- GET `/api/accounting/profit-loss` - P&L report
- POST `/api/accounting/invoices` - Generate invoice
- GET `/api/accounting/invoices/:id` - Get invoice

### HR
- POST `/api/hr/staff` - Create staff
- GET `/api/hr/staff` - List staff
- PUT `/api/hr/staff/:id` - Update staff
- DELETE `/api/hr/staff/:id` - Deactivate staff
- POST `/api/hr/attendance` - Mark attendance
- GET `/api/hr/attendance` - Get attendance records
- POST `/api/hr/leaves` - Apply leave
- GET `/api/hr/leaves` - Get leave records
- PUT `/api/hr/leaves/:id` - Approve/Reject leave
- POST `/api/hr/payroll` - Generate payroll
- GET `/api/hr/payroll` - Get payroll records
- GET `/api/hr/stats` - HR dashboard stats

### Payments
- POST `/api/payments` - Record payment
- GET `/api/payments/member/:memberId` - Member payment history

### Settings
- GET `/api/settings` - Get settings
- PUT `/api/settings` - Update settings (Admin only)

## Project Structure

```
GMS/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   │   ├── auth.js
│   │   ├── members.js
│   │   ├── attendance.js
│   │   ├── accounting.js
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── cardGenerator.js
│   │   ├── email.js
│   │   ├── pdfGenerator.js
│   │   └── cronJobs.js
│   ├── scripts/
│   │   └── seed.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertCard.jsx (NEW)
│   │   │   ├── DataTable.jsx
│   │   │   ├── AnimatedModal.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Members.jsx
│   │   │   └── Accounting.jsx (NEW)
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useAlert.js (NEW)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Key Features Explained

### AlertCard Component
Reusable notification system with:
- 4 variants: success, error, warning, info
- Auto-dismiss after 5 seconds (configurable)
- Slide-in animation with Framer Motion
- Global usage via useAlert hook
- Real-time Socket.io integration

Usage:
```jsx
const { alerts, addAlert, removeAlert } = useAlert();
addAlert('Payment successful!', 'success');
<AlertContainer alerts={alerts} removeAlert={removeAlert} />
```

### Accounting Module
Complete double-entry system:
- Accounts (Asset, Liability, Equity, Income, Expense)
- Transactions with categories
- Auto-balance calculations
- Financial reports with charts
- Invoice generation (PDF)
- Audit trail

### Real-time Updates
Socket.io events:
- `attendance:checkin` - Live attendance notifications
- `attendance:checkout` - Check-out notifications
- `alert` - System-wide alerts (overdue fees, etc.)

## Deployment

### Backend (Heroku/Render)
1. Set environment variables
2. Connect PostgreSQL database
3. Run migrations: `npx prisma migrate deploy`
4. Deploy

### Frontend (Vercel)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Set environment variable: `VITE_API_URL`

## Security Features
- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Helmet.js security headers
- Role-based access control
- Input validation (Joi)

## Cron Jobs
- Daily overdue fee checks (9 AM)
- Email/SMS reminders
- Monthly accounting close (optional)

## Testing
```bash
cd backend
npm test
```

## License
MIT

## Support
For issues and questions, create an issue in the repository.
