import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const ClassesScreen = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await apiService.api.get('/classes');
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const ClassCard = ({ classItem }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.name}>{classItem.name}</Text>
          <View style={[styles.badge, { backgroundColor: classItem.status === 'active' ? '#10b981' : '#6b7280' }]}>
            <Text style={styles.badgeText}>{classItem.status}</Text>
          </View>
        </View>
        <Text style={styles.description}>{classItem.description}</Text>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{classItem.schedule}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{classItem.trainer?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{classItem.capacity} max</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Classes</Text>
      </View>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ClassCard classItem={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchClasses} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  list: { padding: 20 },
  card: { marginBottom: 12, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  details: { flexDirection: 'row', justifyContent: 'space-between' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
});

export default ClassesScreen;
