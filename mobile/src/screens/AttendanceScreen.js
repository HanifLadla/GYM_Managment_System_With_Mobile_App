import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const AttendanceScreen = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTodayAttendance();
      console.log('Attendance data:', data);
      // Group by member to show unique members only
      const uniqueMembers = {};
      data.forEach(record => {
        const memberId = record.member?.id || record.memberId;
        if (!uniqueMembers[memberId] || new Date(record.checkInTime) > new Date(uniqueMembers[memberId].checkInTime)) {
          uniqueMembers[memberId] = record;
        }
      });
      setAttendance(Object.values(uniqueMembers));
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const AttendanceCard = ({ item }) => {
    const checkInTime = new Date(item.checkInTime);
    const checkOutTime = item.checkOutTime ? new Date(item.checkOutTime) : null;
    const duration = checkOutTime ? 
      Math.round((checkOutTime - checkInTime) / (1000 * 60)) : // minutes
      Math.round((new Date() - checkInTime) / (1000 * 60)); // current duration
    
    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
      <Card style={styles.attendanceCard}>
        <Card.Content>
          <View style={styles.attendanceHeader}>
            <View style={styles.attendanceInfo}>
              <Text style={styles.memberName}>{item.member?.name}</Text>
              <Text style={styles.checkInTime}>
                Check-in: {checkInTime.toLocaleTimeString()}
              </Text>
              {checkOutTime && (
                <Text style={styles.checkOutTime}>
                  Check-out: {checkOutTime.toLocaleTimeString()}
                </Text>
              )}
            </View>
            <View style={styles.statusContainer}>
              <Ionicons 
                name={checkOutTime ? "checkmark-circle" : "time"} 
                size={24} 
                color={checkOutTime ? "#10b981" : "#f59e0b"} 
              />
              <Text style={[styles.statusText, {
                color: checkOutTime ? "#10b981" : "#f59e0b"
              }]}>
                {checkOutTime ? "Present" : "Active"}
              </Text>
            </View>
          </View>
          <View style={styles.durationContainer}>
            <View style={styles.durationInfo}>
              <Ionicons name="timer" size={16} color="#6b7280" />
              <Text style={styles.durationText}>
                Duration: {formatDuration(duration)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {checkOutTime ? 'COMPLETED' : 'IN PROGRESS'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Attendance</Text>
        <Text style={styles.headerSubtitle}>
          {attendance.length} members checked in
        </Text>
      </View>

      <FlatList
        data={attendance}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AttendanceCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTodayAttendance} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
  },
  attendanceCard: {
    marginBottom: 12,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  attendanceInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  checkInTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  checkOutTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
});

export default AttendanceScreen;