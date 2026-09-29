import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={80} color="#3b82f6" />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </Card.Content>
      </Card>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  card: { margin: 20, elevation: 2 },
  avatar: { alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
  email: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  role: { fontSize: 14, color: '#3b82f6', textAlign: 'center', marginTop: 4, textTransform: 'capitalize' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', margin: 20, padding: 14, borderRadius: 10, gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ProfileScreen;
