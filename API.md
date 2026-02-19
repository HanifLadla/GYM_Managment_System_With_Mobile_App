# GMS API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

### POST /auth/register
Register new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "ADMIN|TRAINER|MEMBER"
}
```

### POST /auth/login
Login user
```json
{
  "email": "admin@gym.com",
  "password": "admin123"
}
```
Response: `{ user, token }`

### GET /auth/me
Get current user (Protected)

## Members

### GET /members?page=1&limit=10&search=
List members with pagination

### POST /members (Admin only)
Create member
```json
{
  "email": "member@example.com",
  "password": "pass123",
  "name": "John Doe",
  "phone": "1234567890",
  "monthlyFee": 50,
  "planType": "BASIC|PREMIUM"
}
```

### GET /members/:id
Get member details

### PUT /members/:id (Admin only)
Update member

### DELETE /members/:id (Admin only)
Delete member

### POST /members/:id/card (Admin only)
Generate QR card for member

## Attendance

### POST /attendance/checkin/:cardId
Check-in member with card ID

### POST /attendance/checkout/:attendanceId
Check-out member

### GET /attendance/member/:memberId?startDate=&endDate=
Get member attendance history

### GET /attendance/today
Get today's attendance

## Payments

### POST /payments (Admin only)
Record payment
```json
{
  "membershipId": "uuid",
  "amount": 50,
  "method": "CASH|CARD|UPI",
  "receiptUrl": "optional"
}
```

### GET /payments/member/:memberId
Get member payment history

## Accounting

### GET /accounting/accounts (Admin only)
List all accounts

### POST /accounting/accounts (Admin only)
Create account
```json
{
  "accountName": "Equipment Fund",
  "type": "ASSET|LIABILITY|EQUITY|INCOME|EXPENSE",
  "description": "Optional"
}
```

### GET /accounting/transactions?category=&date_from=&date_to=&page=1 (Admin only)
List transactions with filters

### POST /accounting/transactions (Admin only)
Create transaction
```json
{
  "accountId": "uuid",
  "amount": 100,
  "type": "DEBIT|CREDIT",
  "description": "Payment received",
  "category": "MEMBER_FEE|SALARY|EQUIPMENT|UTILITY|OTHER",
  "referenceId": "optional-payment-id"
}
```

### GET /accounting/balance-sheet (Admin only)
Get balance sheet report

### GET /accounting/profit-loss?period=MONTHLY&year=2024&month=1 (Admin only)
Get profit & loss report

### POST /accounting/invoices (Admin only)
Generate invoice
```json
{
  "memberId": "uuid",
  "transactionId": "uuid",
  "totalAmount": 50,
  "dueDate": "2024-12-31"
}
```

### GET /accounting/invoices/:id
Get invoice details

### GET /accounting/invoices (Admin only)
List all invoices

## Trainers

### POST /trainers (Admin only)
Create trainer
```json
{
  "email": "trainer@example.com",
  "password": "pass123",
  "name": "Jane Smith",
  "specialization": "Yoga",
  "phone": "1234567890",
  "availability": [{"day": "Monday", "time": "09:00-17:00"}]
}
```

### GET /trainers
List all trainers

### PUT /trainers/:id (Admin only)
Update trainer

## Classes

### POST /classes (Admin only)
Create class
```json
{
  "name": "Morning Yoga",
  "trainerId": "uuid",
  "schedule": {"day": "Monday", "time": "06:00", "duration": 60},
  "maxCapacity": 20
}
```

### GET /classes
List all classes

## Equipment

### POST /equipment (Admin only)
Add equipment
```json
{
  "name": "Treadmill",
  "type": "Cardio",
  "quantityAvailable": 5
}
```

### GET /equipment
List all equipment

### GET /equipment/low-stock?threshold=5 (Admin only)
Get low stock equipment

## Settings

### GET /settings
Get gym settings

### PUT /settings (Admin only)
Update settings
```json
{
  "gymName": "My Gym",
  "monthlyFeeDefault": 50,
  "lateFee": 10,
  "workingHours": {"open": "06:00", "close": "22:00"}
}
```

## WebSocket Events

Connect to: `http://localhost:5000`

### Events to Listen:
- `attendance:checkin` - Member checked in
- `attendance:checkout` - Member checked out
- `alert` - System alerts (overdue fees, etc.)

## Error Responses

```json
{
  "error": "Error message"
}
```

Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
