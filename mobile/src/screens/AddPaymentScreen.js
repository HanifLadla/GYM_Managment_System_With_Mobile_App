import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/apiService';

const AddPaymentScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    memberId: '',
    amount: '',
    paymentMethod: 'cash',
    description: '',
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await apiService.getMembers();
      setMembers(response.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.memberId || !form.amount) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.createPayment(form);
      Alert.alert('Success', 'Payment recorded successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Record Payment</Text>
          
          <Text style={styles.label}>Member *</Text>
          <Picker selectedValue={form.memberId} onValueChange={(value) => setForm({ ...form, memberId: value })} style={styles.picker}>
            <Picker.Item label="Select Member" value="" />
            {members.map(member => <Picker.Item key={member.id} label={member.name} value={member.id} />)}
          </Picker>

          <TextInput label="Amount *" value={form.amount} onChangeText={(text) => setForm({ ...form, amount: text })} mode="outlined" keyboardType="numeric" style={styles.input} />
          
          <Text style={styles.label}>Payment Method</Text>
          <Picker selectedValue={form.paymentMethod} onValueChange={(value) => setForm({ ...form, paymentMethod: value })} style={styles.picker}>
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="Card" value="card" />
            <Picker.Item label="Bank Transfer" value="bank_transfer" />
          </Picker>

          <TextInput label="Description" value={form.description} onChangeText={(text) => setForm({ ...form, description: text })} mode="outlined" multiline style={styles.input} />

          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button}>
            Record Payment
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { margin: 20, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { marginBottom: 12 },
  label: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 4 },
  picker: { backgroundColor: '#fff', marginBottom: 12 },
  button: { marginTop: 20 },
});

export default AddPaymentScreen;
