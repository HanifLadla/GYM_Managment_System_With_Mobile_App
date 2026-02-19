import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { apiService } from '../services/apiService';

const screenWidth = Dimensions.get('window').width;

const ReportsScreen = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiService.api.get('/reports/summary');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: reports?.monthlyRevenue || [50000, 60000, 55000, 70000, 65000, 80000] }]
  };

  const StatCard = ({ title, value, color }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Card.Content>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReports} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard title="Total Revenue" value={`Rs ${(reports?.totalRevenue || 0).toLocaleString()}`} color="#3b82f6" />
          <StatCard title="Total Members" value={reports?.totalMembers || 0} color="#10b981" />
          <StatCard title="Active Members" value={reports?.activeMembers || 0} color="#8b5cf6" />
          <StatCard title="Avg Attendance" value={`${reports?.avgAttendance || 0}%`} color="#f59e0b" />
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Monthly Revenue</Text>
            <BarChart
              data={revenueData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              }}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 20 },
  statCard: { width: '48%', marginBottom: 12, marginHorizontal: '1%', borderLeftWidth: 4, elevation: 2 },
  statTitle: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  card: { marginHorizontal: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  chart: { marginVertical: 8, borderRadius: 16 },
});

export default ReportsScreen;
