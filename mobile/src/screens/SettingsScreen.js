import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Card, TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    gymName: '',
    email: '',
    phone: '',
    address: '',
    notifications: true,
    autoReminders: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiService.api.get('/settings');
      setSettings({ ...settings, ...response.data });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiService.api.put('/settings', settings);
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const SettingRow = ({ icon, title, value, onPress }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#3b82f6" />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {typeof value === 'boolean' ? (
        <Switch value={value} onValueChange={onPress} />
      ) : (
        <Ionicons name="chevron-forward" size={24} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Gym Information</Text>
          <TextInput
            label="Gym Name"
            value={settings.gymName}
            onChangeText={(text) => setSettings({ ...settings, gymName: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={settings.email}
            onChangeText={(text) => setSettings({ ...settings, email: text })}
            mode="outlined"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            label="Phone"
            value={settings.phone}
            onChangeText={(text) => setSettings({ ...settings, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            label="Address"
            value={settings.address}
            onChangeText={(text) => setSettings({ ...settings, address: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingRow
            icon="notifications"
            title="Push Notifications"
            value={settings.notifications}
            onPress={() => setSettings({ ...settings, notifications: !settings.notifications })}
          />
          <SettingRow
            icon="alarm"
            title="Auto Reminders"
            value={settings.autoReminders}
            onPress={() => setSettings({ ...settings, autoReminders: !settings.autoReminders })}
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
      >
        Save Settings
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  card: { marginHorizontal: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  input: { marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingTitle: { fontSize: 16, color: '#1f2937', marginLeft: 12 },
  saveButton: { marginHorizontal: 20, marginBottom: 40 },
});

export default SettingsScreen;
