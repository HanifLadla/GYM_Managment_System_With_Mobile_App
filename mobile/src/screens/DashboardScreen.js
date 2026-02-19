import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Card, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statHeader}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={trend > 0 ? '#10b981' : '#ef4444'} 
            />
            <Text style={[styles.trendText, { color: trend > 0 ? '#10b981' : '#ef4444' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const QuickAction = ({ title, icon, onPress, color }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: stats?.charts?.weeklyAttendance?.map(d => d.attendance) || [20, 45, 28, 80, 99, 43, 50]
    }]
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Members"
            value={stats?.overview?.totalMembers || 0}
            icon="people"
            color="#3b82f6"
            trend={8.2}
          />
          <StatCard
            title="Today's Attendance"
            value={stats?.overview?.todayAttendance || 0}
            icon="checkmark-circle"
            color="#10b981"
            trend={12.5}
          />
          <StatCard
            title="Monthly Revenue"
            value={`Rs ${(stats?.overview?.thisMonthRevenue || 0).toLocaleString()}`}
            icon="card"
            color="#8b5cf6"
            trend={15.3}
          />
          <StatCard
            title="Overdue Payments"
            value={stats?.overview?.overduePayments || 0}
            icon="alert-circle"
            color="#ef4444"
            trend={-5.1}
          />
        </View>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickAction
                title="Scan QR"
                icon="qr-code"
                color="#3b82f6"
                onPress={() => navigation.navigate('QRScanner')}
              />
              <QuickAction
                title="Add Member"
                icon="person-add"
                color="#10b981"
                onPress={() => navigation.navigate('AddMember')}
              />
              <QuickAction
                title="Payments"
                icon="card"
                color="#8b5cf6"
                onPress={() => navigation.navigate('Payments')}
              />
              <QuickAction
                title="Reports"
                icon="bar-chart"
                color="#f59e0b"
                onPress={() => navigation.navigate('Reports')}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Attendance Chart */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Weekly Attendance</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {stats?.activities?.recent?.slice(0, 5).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.member} checked in</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.time).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )) || (
              <Text style={styles.noDataText}>No recent activity</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="qrcode-scan"
        style={styles.fab}
        onPress={() => navigation.navigate('QRScanner')}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    marginHorizontal: '1%',
    borderLeftWidth: 4,
  },
  statContent: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3b82f6',
  },
});

export default DashboardScreen;