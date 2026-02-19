import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.centerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={60} color="#3b82f6" />
          </View>
          <Text style={styles.appName}>GMS Mobile</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            Gym Management System - Your complete fitness companion
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.feature}>• Member Management</Text>
          <Text style={styles.feature}>• Attendance Tracking</Text>
          <Text style={styles.feature}>• Payment Processing</Text>
          <Text style={styles.feature}>• Class Scheduling</Text>
          <Text style={styles.feature}>• Equipment Management</Text>
          <Text style={styles.feature}>• Reports & Analytics</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Developer Information</Text>
          <Text style={styles.info}>Developed by: Muhammad Hanif Noor</Text>
          <Text style={styles.info}>Contact: hanifnoor59@gmail.com</Text>
          <Text style={styles.info}>Website: www.gms.com</Text>
          <Text style={styles.copyright}>© 2024 GMS. All rights reserved.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    elevation: 2,
    marginBottom: 16,
  },
  centerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  feature: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  info: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AboutScreen;