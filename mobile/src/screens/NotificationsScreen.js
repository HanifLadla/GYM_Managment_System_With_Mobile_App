import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Switch, List } from 'react-native-paper';

const NotificationsScreen = () => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [membershipAlerts, setMembershipAlerts] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <List.Item
            title="Push Notifications"
            description="Receive notifications on your device"
            right={() => (
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
            )}
          />
          
          <List.Item
            title="Email Notifications"
            description="Receive notifications via email"
            right={() => (
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
              />
            )}
          />
          
          <List.Item
            title="Membership Alerts"
            description="Alerts about membership status"
            right={() => (
              <Switch
                value={membershipAlerts}
                onValueChange={setMembershipAlerts}
              />
            )}
          />
          
          <List.Item
            title="Payment Reminders"
            description="Reminders for upcoming payments"
            right={() => (
              <Switch
                value={paymentReminders}
                onValueChange={setPaymentReminders}
              />
            )}
          />
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default NotificationsScreen;