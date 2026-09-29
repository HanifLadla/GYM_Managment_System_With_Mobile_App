import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { apiService } from '../services/apiService';

const QRScannerScreen = ({ navigation }) => {
  const [scanned, setScanned] = useState(false);

  const handleBarCodeRead = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const result = await apiService.checkIn(data);
      Alert.alert('Success', result.message || 'Check-in successful', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Check-in failed', [
        { text: 'Retry', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.camera}
        onBarCodeRead={handleBarCodeRead}
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        captureAudio={false}
      >
        <View style={styles.overlay}>
          <View style={styles.scanBox} />
          <Text style={styles.hint}>Point camera at member QR code</Text>
        </View>
      </RNCamera>
      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 250, height: 250, borderWidth: 2, borderColor: '#3b82f6', borderRadius: 12 },
  hint: { color: '#fff', marginTop: 20, fontSize: 14 },
  cancelBtn: { backgroundColor: '#ef4444', padding: 16, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default QRScannerScreen;
