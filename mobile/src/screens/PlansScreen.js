import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

const PlansScreen = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await apiService.api.get('/plans');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const PlanCard = ({ plan }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.price}>Rs {plan.price}</Text>
        </View>
        <Text style={styles.duration}>{plan.duration} days</Text>
        <Text style={styles.description}>{plan.description}</Text>
        <View style={styles.features}>
          {plan.features?.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Membership Plans</Text>
      </View>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PlanCard plan={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPlans} />}
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
  name: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  price: { fontSize: 20, fontWeight: 'bold', color: '#3b82f6' },
  duration: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  description: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  features: { marginTop: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureText: { fontSize: 12, color: '#1f2937', marginLeft: 8 },
});

export default PlansScreen;
