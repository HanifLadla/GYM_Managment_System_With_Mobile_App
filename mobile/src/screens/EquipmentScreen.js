import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const EquipmentScreen = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await apiService.api.get('/equipment');
      setEquipment(response.data.equipment || []);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const EquipmentCard = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.name}>{item.name}</Text>
          <Chip 
            style={[styles.chip, { backgroundColor: item.status === 'working' ? '#10b981' : '#ef4444' }]}
            textStyle={styles.chipText}
          >
            {item.status}
          </Chip>
        </View>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="cube" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Qty: {item.quantity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Equipment</Text>
      </View>
      <FlatList
        data={equipment}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EquipmentCard item={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEquipment} />}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  chip: { height: 28 },
  chipText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  details: { flexDirection: 'row', justifyContent: 'space-between' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
});

export default EquipmentScreen;
