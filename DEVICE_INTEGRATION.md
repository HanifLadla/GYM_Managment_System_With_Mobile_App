# 🔌 Device Integration Guide - GYM Management System

## 📡 Supported Devices

### 1. RFID Card Readers
- ZKTeco RFID Readers
- HID Proximity Readers
- Mifare Card Readers
- Any TCP/IP or HTTP-based RFID reader

### 2. Biometric Devices
- ZKTeco Fingerprint Scanners
- Face Recognition Devices
- Palm Vein Scanners

### 3. Door Controllers
- Electric Door Locks
- Magnetic Locks
- Turnstile Gates
- Barrier Gates

---

## 🔗 Integration Methods

### Method 1: HTTP Webhook (Recommended)

**Your device sends HTTP POST request to:**
```
POST http://YOUR_SERVER_IP:5001/api/devices/webhook/card-scan
Content-Type: application/json

{
  "cardId": "GYM-1234567890",
  "deviceId": "RFID-001",
  "timestamp": "2024-02-15T10:30:00Z"
}
```

**Response from Server:**
```json
{
  "success": true,
  "gateAccess": true,
  "message": "Welcome Rafid!",
  "relay": "ON",
  "relayDuration": 5,
  "displayText": "Welcome\nRafid",
  "memberData": {
    "name": "Rafid",
    "expiryDate": "2024-03-15",
    "photo": null
  }
}
```

**If Access Denied:**
```json
{
  "success": false,
  "gateAccess": false,
  "message": "Fees Pending: $50",
  "relay": "OFF",
  "displayText": "Rafid\nFees Pending: $50"
}
```

---

### Method 2: Socket.io Real-time (For Web-based devices)

**Connect to Socket.io:**
```javascript
const socket = io('http://YOUR_SERVER_IP:5001');

// Listen for gate control
socket.on('gate:granted', (data) => {
  console.log('Access Granted:', data.member);
  // Open gate/door
  openDoor(5); // 5 seconds
});

socket.on('gate:denied', (data) => {
  console.log('Access Denied:', data.reason);
  // Show error on display
  showMessage(data.reason);
});
```

---

## 🛠️ Hardware Setup Examples

### Example 1: ZKTeco RFID Reader + Door Lock

**Hardware Connection:**
```
RFID Reader → Network Switch → Your Server
Door Lock ← Relay Module ← Arduino/ESP32 ← Network
```

**Arduino/ESP32 Code:**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://192.168.1.100:5001/api/devices/webhook/card-scan";

int relayPin = 2; // Door lock relay

void setup() {
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void onCardScanned(String cardId) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"cardId\":\"" + cardId + "\",\"deviceId\":\"RFID-001\"}";
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    String response = http.getString();
    
    // Parse JSON response
    if (response.indexOf("\"relay\":\"ON\"") > 0) {
      // Open door
      digitalWrite(relayPin, HIGH);
      delay(5000); // 5 seconds
      digitalWrite(relayPin, LOW);
    }
  }
  
  http.end();
}
```

---

### Example 2: Python Script for USB RFID Reader

```python
import requests
import serial

SERVER_URL = "http://192.168.1.100:5001/api/devices/webhook/card-scan"
SERIAL_PORT = "COM3"  # Windows
# SERIAL_PORT = "/dev/ttyUSB0"  # Linux

ser = serial.Serial(SERIAL_PORT, 9600)

while True:
    if ser.in_waiting > 0:
        card_id = ser.readline().decode('utf-8').strip()
        
        # Send to server
        response = requests.post(SERVER_URL, json={
            "cardId": card_id,
            "deviceId": "RFID-001"
        })
        
        data = response.json()
        
        if data.get('gateAccess'):
            print(f"✅ Access Granted: {data['message']}")
            # Trigger relay/door lock here
            # GPIO.output(RELAY_PIN, GPIO.HIGH)
        else:
            print(f"❌ Access Denied: {data['message']}")
```

---

### Example 3: Node.js for Network-based Devices

```javascript
const axios = require('axios');
const net = require('net');

const SERVER_URL = 'http://192.168.1.100:5001/api/devices/webhook/card-scan';

// Listen to device on TCP port
const server = net.createServer((socket) => {
  socket.on('data', async (data) => {
    const cardId = data.toString().trim();
    
    try {
      const response = await axios.post(SERVER_URL, {
        cardId: cardId,
        deviceId: 'RFID-001'
      });
      
      if (response.data.gateAccess) {
        console.log('✅ Access Granted');
        socket.write('RELAY:ON:5\n'); // Send command to device
      } else {
        console.log('❌ Access Denied:', response.data.message);
        socket.write('DISPLAY:' + response.data.displayText + '\n');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  });
});

server.listen(8080, () => {
  console.log('Device listener running on port 8080');
});
```

---

## 🔧 Configuration Steps

### Step 1: Get Your Server IP
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

### Step 2: Configure Device
1. Access device web interface (usually http://DEVICE_IP)
2. Go to Network Settings
3. Set Webhook URL: `http://YOUR_SERVER_IP:5001/api/devices/webhook/card-scan`
4. Set HTTP Method: POST
5. Set Content-Type: application/json

### Step 3: Test Connection
```bash
# Test from command line
curl -X POST http://localhost:5001/api/devices/webhook/card-scan \
  -H "Content-Type: application/json" \
  -d '{"cardId":"GYM-1234567890","deviceId":"TEST-001"}'
```

---

## 📋 API Endpoints

### 1. Card Scan Webhook
```
POST /api/devices/webhook/card-scan
```

### 2. Manual Gate Control
```
POST /api/devices/gate/control
Body: { "action": "open", "duration": 5 }
```

### 3. Device Status
```
GET /api/devices/status
```

---

## 🔐 Security Recommendations

1. **Use HTTPS** in production
2. **Add API Key authentication:**
```javascript
headers: {
  'X-API-Key': 'your-secret-key'
}
```
3. **Whitelist device IPs** in firewall
4. **Use VPN** for remote devices

---

## 🧪 Testing Without Hardware

Use Postman or curl to simulate card scans:

```bash
# Simulate successful scan
curl -X POST http://localhost:5001/api/devices/webhook/card-scan \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "GYM-1708012345-ABC123",
    "deviceId": "RFID-001"
  }'
```

---

## 📱 Mobile App Integration

For mobile-based QR scanning:

```javascript
// React Native / Flutter
const scanQRCode = async (qrCode) => {
  const response = await fetch('http://YOUR_SERVER/api/devices/webhook/card-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardId: qrCode,
      deviceId: 'MOBILE-APP'
    })
  });
  
  const data = await response.json();
  
  if (data.gateAccess) {
    showSuccess(data.message);
  } else {
    showError(data.message);
  }
};
```

---

## 🆘 Troubleshooting

**Problem:** Device not connecting
- Check network connectivity
- Verify server IP and port
- Check firewall settings

**Problem:** Gate not opening
- Verify relay wiring
- Check relay response in device logs
- Test manual gate control endpoint

**Problem:** Wrong access decisions
- Verify card is registered in system
- Check member status in database
- Review server logs for errors

---

## 📞 Support

For device-specific integration help, check:
- Device manufacturer documentation
- GMS API logs: `backend/logs/`
- Real-time monitoring: Dashboard → Reports

---

**Your GMS is now ready for hardware integration!** 🎉
