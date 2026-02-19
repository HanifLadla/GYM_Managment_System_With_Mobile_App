import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { apiService } from '../services/apiService';

const QRScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ type: '', message: '', isCheckIn: false });
  const scaleAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const showAlert = (type, message, isCheckIn = false) => {
    setAlertData({ type, message, isCheckIn });
    setAlertVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideAlert = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setAlertVisible(false);
      Speech.stop();
      setScanned(false);
      setProcessing(false);
      navigation.goBack();
    });
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (processing) return;
    
    setScanned(true);
    setProcessing(true);
    
    try {
      const result = await apiService.checkIn(data);
      console.log('QR Scan result:', result);
      const memberName = result.memberName || result.attendance?.member?.name || 'Member';
      const isCheckIn = result.action === 'checkin';
      
      let message = result.message || result.announcement || '';
      if (!message) {
        if (isCheckIn) {
          message = `Welcome ${memberName}! Have a great workout session.`;
        } else {
          message = `Thank you ${memberName}! Great job today. See you next time!`;
        }
      }
      
      console.log('Message:', message, 'IsCheckIn:', isCheckIn);
      speak(message);
      showAlert('success', message, isCheckIn);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to process scan';
      speak('Error processing scan. Please try again.');
      showAlert('error', errorMsg);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFlashOn(!flashOn)}
          >
            <Ionicons 
              name={flashOn ? "flash" : "flash-off"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>
        </View>

        <View style={styles.footer}>
          {scanned && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        transparent
        visible={alertVisible}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.alertCard,
              alertData.type === 'success' ? styles.successCard : styles.errorCard,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.alertIcon}>
              <Ionicons
                name={alertData.type === 'success' ? (alertData.isCheckIn ? 'enter' : 'exit') : 'alert-circle'}
                size={60}
                color="white"
              />
            </View>
            <Text style={styles.alertTitle}>
              {alertData.type === 'success' ? (alertData.isCheckIn ? 'Check-In' : 'Check-Out') : 'Error'}
            </Text>
            <Text style={styles.alertMessage}>{alertData.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={hideAlert}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3b82f6',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 40,
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    width: '85%',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successCard: {
    backgroundColor: '#10b981',
  },
  errorCard: {
    backgroundColor: '#ef4444',
  },
  alertIcon: {
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  alertMessage: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 26,
  },
  alertButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});

export default QRScannerScreen;