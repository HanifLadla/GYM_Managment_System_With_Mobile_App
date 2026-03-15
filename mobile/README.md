# GMS Mobile App

A comprehensive and modern mobile application for the Gym Management System built with React Native and Expo.

## Features

### 🏠 Dashboard
- Real-time gym statistics and KPIs
- Weekly attendance charts
- Quick action buttons
- Recent activity feed
- Revenue and member insights

### 👥 Member Management
- View all gym members
- Search and filter functionality
- Member status tracking
- Membership details and expiry dates

### 📱 QR Code Scanner
- Fast QR code scanning for check-in/check-out
- Camera permissions handling
- Flash toggle support
- Real-time attendance processing

### 📊 Attendance Tracking
- Today's attendance overview
- Member check-in/check-out status
- Real-time updates
- Activity timeline

### 👤 User Profile
- User information display
- Settings and preferences
- Logout functionality
- App version info

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design components
- **Axios** - HTTP client for API calls
- **AsyncStorage** - Local data persistence
- **Expo Camera & Barcode Scanner** - QR code functionality
- **React Native Chart Kit** - Data visualization

## Prerequisites

- Node.js 16+ 
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone and navigate to mobile directory:**
   ```bash
   cd GMS/mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API endpoint:**
   - Open `src/services/apiService.js`
   - Update `BASE_URL` with your backend server IP:
   ```javascript
   const BASE_URL = 'http://YOUR_BACKEND_IP:5000/api';
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

## Running on Devices

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Web (for testing)
```bash
npm run web
```

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS App Store
```bash
expo build:ios
```

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/            # React Context providers
│   ├── screens/            # App screens/pages
│   ├── services/           # API and external services
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, etc.
├── App.js                  # Main app component
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## Key Features Implementation

### Authentication Flow
- JWT token-based authentication
- Secure token storage with AsyncStorage
- Auto-login on app restart
- Protected routes

### QR Code Scanning
- Camera permission handling
- Real-time barcode detection
- Member check-in/check-out processing
- Error handling and user feedback

### Real-time Data
- Dashboard statistics
- Member information
- Attendance tracking
- Payment status

### Offline Support
- Token persistence
- Cached user data
- Graceful error handling

## API Integration

The mobile app integrates with the GMS backend API:

- **Authentication:** `/api/auth/*`
- **Dashboard:** `/api/dashboard/stats`
- **Members:** `/api/members/*`
- **Attendance:** `/api/attendance/*`
- **Payments:** `/api/payments/*`

## Permissions

### Android
- Camera access for QR scanning
- Internet access for API calls

### iOS
- Camera usage description
- Network access

## Development Tips

1. **Testing on Physical Device:**
   - Install Expo Go app
   - Scan QR code from terminal
   - Ensure device and computer are on same network

2. **API Configuration:**
   - Use your computer's IP address, not localhost
   - Ensure backend server is accessible from mobile device

3. **Debugging:**
   - Use React Native Debugger
   - Enable remote debugging in Expo
   - Check network requests in browser dev tools

## Future Enhancements

- [ ] Push notifications for important updates
- [ ] Offline data synchronization
- [ ] Biometric authentication
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Member self-service features

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   expo start --clear
   ```

2. **Network connectivity:**
   - Check firewall settings
   - Ensure backend server is running
   - Verify IP address configuration

3. **Camera permissions:**
   - Grant camera permissions in device settings
   - Restart app after permission changes

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Expo documentation
3. Check React Native community resources