import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const TrainersScreen = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const response = await apiService.api.get('/trainers');
      setTrainers(response.data.trainers || []);
    } catch (error) {
      console.error('Failed to fetch trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const TrainerCard = ({ trainer }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name}>{trainer.name}</Text>
            <Text style={styles.specialty}>{trainer.specialty}</Text>
          </View>
          <Ionicons name="fitness" size={24} color="#3b82f6" />
        </View>
        <View style={styles.details}>
          <Text style={styles.detail}>Phone: {trainer.phone}</Text>
          <Text style={styles.detail}>Experience: {trainer.experience} years</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Trainers</Text>
        <Searchbar
          placeholder="Search trainers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      <FlatList
        data={trainers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TrainerCard trainer={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTrainers} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  searchBar: { elevation: 2 },
  list: { padding: 20 },
  card: { marginBottom: 12, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  specialty: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  details: { marginTop: 8 },
  detail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});

export default TrainersScreen;
