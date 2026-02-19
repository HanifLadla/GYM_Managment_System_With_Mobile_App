# GMS Mobile App

Comprehensive mobile application for Gym Management System with React Native and Expo.

## Features

### Core Screens
- **Dashboard** - Real-time stats, charts, quick actions
- **Members** - View and search members
- **Attendance** - Today's attendance tracking
- **Payments** - Payment history and processing
- **QR Scanner** - Check-in/check-out via QR code

### Additional Screens
- **Trainers** - View trainer profiles and specialties
- **Classes** - Browse gym classes and schedules
- **Equipment** - Equipment inventory and status
- **Plans** - Membership plans and pricing
- **Reports** - Revenue and analytics reports
- **Settings** - App and gym settings
- **Profile** - User profile and logout

## Tech Stack
- React Native + Expo
- React Navigation (Stack, Tab, Drawer)
- React Native Paper (Material Design)
- Expo Camera (QR scanning)
- React Native Chart Kit
- Axios

## Installation

```bash
cd mobile
npm install
```

## Configuration

Update API URL in `src/services/apiService.js`:
```javascript
const BASE_URL = 'http://YOUR_IP:5000/api';
```

## Run

```bash
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Scan QR with Expo Go app

## Default Login
- Email: admin@gym.com
- Password: admin123

## Navigation
- **Bottom Tabs**: Dashboard, Members, Attendance, Payments, More
- **Drawer Menu**: Profile, Trainers, Classes, Equipment, Plans, Reports, Settings

## API Integration
All screens connect to GMS backend API endpoints.