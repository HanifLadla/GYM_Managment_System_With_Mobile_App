# HR Module Documentation

## Overview
Complete HR Management System integrated into GMS with staff management, attendance tracking, leave management, and payroll processing.

## Features

### 1. Staff Management
- Add/Edit/Delete staff members
- Track personal details (name, email, phone, CNIC, photo, address, DOB, gender)
- Department and designation management
- Salary and commission tracking
- Bank account details
- Emergency contact information
- Status management (active/inactive)

### 2. Staff Attendance
- Daily attendance tracking
- Check-in/Check-out times
- Attendance status (Present, Absent, Half Day, Late)
- Date-wise attendance reports
- Staff-wise attendance history

### 3. Leave Management
- Leave application system
- Leave types: Sick, Casual, Annual, Unpaid
- Leave approval workflow (Pending, Approved, Rejected)
- Date range selection
- Reason tracking
- Approval tracking (who approved and when)

### 4. Payroll Management
- Monthly payroll generation
- Basic salary calculation
- Allowances and deductions
- Commission tracking
- Net salary calculation
- Payment status tracking (pending/paid)
- Payment date recording

## Database Schema

### Staff Table
```prisma
model Staff {
  id          String             @id @default(uuid())
  name        String
  email       String             @unique
  phone       String
  cnic        String?            @unique
  photo       String?
  address     String?
  dob         DateTime?
  gender      String?
  department  String
  designation String
  joinDate    DateTime           @default(now())
  salary      Decimal
  commission  Decimal            @default(0)
  bankAccount String?
  emergencyContact Json?
  status      String             @default("active")
  createdAt   DateTime           @default(now())
  attendance  StaffAttendance[]
  leaves      Leave[]
  payroll     Payroll[]
}
```

### StaffAttendance Table
```prisma
model StaffAttendance {
  id        String           @id @default(uuid())
  staffId   String
  staff     Staff            @relation(fields: [staffId], references: [id])
  date      DateTime         @default(now())
  checkIn   DateTime?
  checkOut  DateTime?
  status    AttendanceStatus @default(PRESENT)
  notes     String?
}
```

### Leave Table
```prisma
model Leave {
  id          String      @id @default(uuid())
  staffId     String
  staff       Staff       @relation(fields: [staffId], references: [id])
  type        LeaveType
  startDate   DateTime
  endDate     DateTime
  reason      String
  status      LeaveStatus @default(PENDING)
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime    @default(now())
}
```

### Payroll Table
```prisma
model Payroll {
  id           String   @id @default(uuid())
  staffId      String
  staff        Staff    @relation(fields: [staffId], references: [id])
  month        Int
  year         Int
  basicSalary  Decimal
  allowances   Decimal  @default(0)
  deductions   Decimal  @default(0)
  commission   Decimal  @default(0)
  netSalary    Decimal
  paidDate     DateTime?
  status       String   @default("pending")
  createdAt    DateTime @default(now())
}
```

## API Endpoints

### Staff Management
- `POST /api/hr/staff` - Create staff
- `GET /api/hr/staff` - List all active staff
- `GET /api/hr/staff/:id` - Get staff details
- `PUT /api/hr/staff/:id` - Update staff
- `DELETE /api/hr/staff/:id` - Deactivate staff

### Attendance Management
- `POST /api/hr/attendance` - Mark attendance
- `GET /api/hr/attendance` - Get attendance records (with filters)
- `PUT /api/hr/attendance/:id` - Update attendance

### Leave Management
- `POST /api/hr/leaves` - Apply for leave
- `GET /api/hr/leaves` - Get leave records (with filters)
- `PUT /api/hr/leaves/:id` - Approve/Reject leave

### Payroll Management
- `POST /api/hr/payroll` - Generate payroll
- `GET /api/hr/payroll` - Get payroll records (with filters)
- `PUT /api/hr/payroll/:id` - Update payroll status

### Dashboard Stats
- `GET /api/hr/stats` - Get HR dashboard statistics

## Frontend Components

### HR Page (`/hr`)
- Tabbed interface with 4 sections:
  1. Staff - List and manage staff members
  2. Attendance - Track daily attendance
  3. Leaves - Manage leave applications
  4. Payroll - Process monthly payroll

### Dashboard Stats Cards
- Total Staff Count
- Today's Attendance Count
- Pending Leaves Count
- Pending Payroll Count

### Features
- Add/Edit modals for each section
- Data tables with pagination and search
- Action buttons (Edit, Delete, Approve, Reject, Mark Paid)
- Real-time alerts for all operations
- Responsive design with dark mode support

## Usage

### Adding Staff
1. Navigate to HR > Staff tab
2. Click "Add Staff" button
3. Fill in required details (name, email, phone, department, designation, salary)
4. Optional: Add CNIC, commission, and other details
5. Submit to create staff record

### Marking Attendance
1. Navigate to HR > Attendance tab
2. Click "Add Attendance" button
3. Select staff member
4. Set check-in/check-out times
5. Select status (Present/Absent/Half Day/Late)
6. Submit to record attendance

### Managing Leaves
1. Navigate to HR > Leaves tab
2. Click "Add Leave" button
3. Select staff member and leave type
4. Set start and end dates
5. Enter reason
6. Submit to apply for leave
7. Admin can approve/reject from the list

### Processing Payroll
1. Navigate to HR > Payroll tab
2. Click "Add Payroll" button
3. Select staff member
4. Enter month and year
5. Add allowances and deductions (optional)
6. System auto-calculates net salary (Basic + Commission + Allowances - Deductions)
7. Submit to generate payroll
8. Mark as paid when payment is completed

## Integration Notes

- Old `/api/staff` routes replaced with `/api/hr/*` routes
- Staff functionality moved from standalone page to HR module
- All staff-related operations now under HR management
- Maintains backward compatibility with existing staff data

## Security
- All HR endpoints require authentication
- Only ADMIN role can access HR module
- Role-based access control enforced on all routes
- Audit trail for all HR operations

## Future Enhancements
- Biometric integration for attendance
- Automated payroll calculation based on attendance
- Leave balance tracking
- Performance review system
- Document management for staff
- Shift management
- Overtime tracking
