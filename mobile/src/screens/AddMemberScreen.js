import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/apiService';

const AddMemberScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    address: '',
    gender: 'male',
    dateOfBirth: '',
    planId: '',
    planType: 'BASIC',
    admissionFee: '',
    monthlyFee: '',
    password: '',
  });

  useEffect(() => {
    fetchPlans();
    if (route.params?.member) {
      setForm(route.params.member);
    }
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiService.getPlans();
      setPlans(response || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.planId || !form.password) {
      Alert.alert('Error', 'Please fill required fields (Name, Email, Phone, Plan, Password)');
      return;
    }

    if (!form.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const submitData = {
      ...form,
      dob: form.dateOfBirth || null,
      monthlyFee: parseFloat(form.monthlyFee) || 0
    };
    delete submitData.dateOfBirth;
    delete submitData.admissionFee;

    setLoading(true);
    try {
      if (route.params?.member) {
        await apiService.api.put(`/members/${route.params.member.id}`, submitData);
        Alert.alert('Success', 'Member updated successfully');
      } else {
        await apiService.api.post('/members', submitData);
        Alert.alert('Success', 'Member added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{route.params?.member ? 'Edit' : 'Add'} Member</Text>
          
          <TextInput label="Name *" value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} mode="outlined" style={styles.input} />
          <TextInput label="Email *" value={form.email} onChangeText={(text) => setForm({ ...form, email: text })} mode="outlined" keyboardType="email-address" style={styles.input} />
          <TextInput label="Phone *" value={form.phone} onChangeText={(text) => setForm({ ...form, phone: text })} mode="outlined" keyboardType="phone-pad" style={styles.input} />
          <TextInput label="CNIC" value={form.cnic} onChangeText={(text) => setForm({ ...form, cnic: text })} mode="outlined" style={styles.input} />
          <TextInput label="Address" value={form.address} onChangeText={(text) => setForm({ ...form, address: text })} mode="outlined" multiline style={styles.input} />
          <TextInput label="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={(text) => setForm({ ...form, dateOfBirth: text })} mode="outlined" style={styles.input} />
          
          <Text style={styles.label}>Gender</Text>
          <Picker selectedValue={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })} style={styles.picker}>
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
          </Picker>

          <Text style={styles.label}>Plan Type *</Text>
          <Picker selectedValue={form.planType} onValueChange={(value) => setForm({ ...form, planType: value })} style={styles.picker}>
            <Picker.Item label="Basic" value="BASIC" />
            <Picker.Item label="Premium" value="PREMIUM" />
          </Picker>

          <Text style={styles.label}>Plan *</Text>
          <Picker 
            selectedValue={form.planId} 
            onValueChange={(value) => {
              const selectedPlan = plans.find(plan => plan.id === value);
              setForm({ 
                ...form, 
                planId: value,
                monthlyFee: selectedPlan ? selectedPlan.price.toString() : ''
              });
            }} 
            style={styles.picker}
          >
            <Picker.Item label="Select Plan" value="" />
            {plans.map(plan => <Picker.Item key={plan.id} label={`${plan.name} - Rs ${plan.price}`} value={plan.id} />)}
          </Picker>

          <TextInput label="Admission Fee" value={form.admissionFee} onChangeText={(text) => setForm({ ...form, admissionFee: text })} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Monthly Fee" value={form.monthlyFee} onChangeText={(text) => setForm({ ...form, monthlyFee: text })} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Password *" value={form.password} onChangeText={(text) => setForm({ ...form, password: text })} mode="outlined" secureTextEntry style={styles.input} />

          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button}>
            {route.params?.member ? 'Update' : 'Add'} Member
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

export default AddMemberScreen;
