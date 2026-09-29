import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/apiService';

const AttendanceScreen = ({ navigation }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTodayAttendance();
      setAttendance(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Attendance</Text>
        <TouchableOpacity onPress={() => navigation.navigate('QRScanner')}>
          <Ionicons name="qr-code" size={28} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={attendance}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAttendance} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.name}>{item.member?.name}</Text>
              <Text style={styles.time}>In: {new Date(item.checkIn).toLocaleTimeString()}</Text>
              {item.checkOut && <Text style={styles.time}>Out: {new Date(item.checkOut).toLocaleTimeString()}</Text>}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records today</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  list: { padding: 20 },
  card: { marginBottom: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  time: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 16 },
});

export default AttendanceScreen;
