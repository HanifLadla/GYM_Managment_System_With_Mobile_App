import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleSplash = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GMS Mobile</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default SimpleSplash;