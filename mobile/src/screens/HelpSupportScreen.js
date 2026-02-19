import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Card, Button, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const HelpSupportScreen = () => {
  const handleCall = () => {
    Linking.openURL('tel:+923423672974');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:hanifnoor59@gmail.com');
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <Button
            mode="outlined"
            onPress={handleCall}
            icon="call"
            style={styles.contactButton}
          >
            Call Support: +1 (92) 342372974
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleEmail}
            icon="email"
            style={styles.contactButton}
          >
            Email: hanifnoor59@gmail.com
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <List.Accordion title="How do I reset my password?">
            <List.Item
              title="Go to login screen and tap 'Forgot Password'"
              titleNumberOfLines={3}
            />
          </List.Accordion>
          
          <List.Accordion title="How do I update my membership?">
            <List.Item
              title="Contact the gym staff or use the Plans section"
              titleNumberOfLines={3}
            />
          </List.Accordion>
          
          <List.Accordion title="How do I check my attendance?">
            <List.Item
              title="Use the Attendance tab to view your check-in history"
              titleNumberOfLines={3}
            />
          </List.Accordion>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactButton: {
    marginBottom: 12,
  },
});

export default HelpSupportScreen;