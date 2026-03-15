import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, FAB } from 'react-native-paper';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { ROLES, hasRole } from '../utils/roles';

const PaymentsScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isMember = hasRole(user, [ROLES.MEMBER]);
  const isAdmin = hasRole(user, [ROLES.ADMIN]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      console.log('Fetching payments for user:', user);
      let data;
      if (isMember) {
        if (!user?.member?.id) {
          setPayments([]);
          return;
        }

        // For members, fetch only their own payments
        data = await apiService.getMemberPayments(user?.member?.id);
      } else {
        // For admin/trainer, fetch all payments
        data = await apiService.getPayments();
      }
      console.log('Payments data:', data);
      setPayments(data || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const PaymentCard = ({ payment }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.name}>{payment.membership?.member?.name || 'Unknown Member'}</Text>
          <Text style={styles.amount}>Rs {payment.amount}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.detail}>Method: {payment.method}</Text>
          <Text style={styles.detail}>{new Date(payment.paymentDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.extraDetails}>
          <Text style={styles.planType}>Plan: {payment.membership?.planType}</Text>
          <Text style={styles.status}>Status: {payment.membership?.paymentStatus}</Text>
        </View>
        {payment.notes && (
          <Text style={styles.notes}>Notes: {payment.notes}</Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{isMember ? 'My Payments' : 'Payments'}</Text>
      </View>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PaymentCard payment={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPayments} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payments found</Text>
          </View>
        }
      />
      {isAdmin && (
        <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('AddPayment')} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  list: { padding: 20 },
  card: { marginBottom: 12, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  details: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { fontSize: 12, color: '#6b7280' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#3b82f6' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  extraDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  planType: { fontSize: 12, color: '#3b82f6', fontWeight: '500' },
  status: { fontSize: 12, color: '#10b981', fontWeight: '500' },
  notes: { fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
});

export default PaymentsScreen;
