import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const SimpleMenu = ({ navigation }) => {
  const [visible, setVisible] = useState(false);
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { name: 'Profile', icon: 'person', screen: 'Profile', adminOnly: false },
    { name: 'Trainers', icon: 'fitness', screen: 'Trainers', adminOnly: true },
    { name: 'Classes', icon: 'calendar', screen: 'Classes', adminOnly: false },
    { name: 'Equipment', icon: 'barbell', screen: 'Equipment', adminOnly: true },
    { name: 'Plans', icon: 'pricetag', screen: 'Plans', adminOnly: false },
    { name: 'Reports', icon: 'bar-chart', screen: 'Reports', adminOnly: true },
    { name: 'Settings', icon: 'settings', screen: 'Settings', adminOnly: true },
  ];

  const handleNavigate = (screen) => {
    setVisible(false);
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <TouchableOpacity onPress={() => setVisible(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setVisible(true)}>
          <Ionicons name="menu" size={30} color="#3b82f6" />
          <Text style={styles.menuButtonText}>Open Menu</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuList}>
              {menuItems.map((item, index) => {
                if (item.adminOnly && !isAdmin) return null;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => handleNavigate(item.screen)}
                  >
                    <Ionicons name={item.icon} size={24} color="#3b82f6" />
                    <Text style={styles.menuItemText}>{item.name}</Text>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity style={styles.logoutItem} onPress={logout}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 30,
    color: '#333',
  },
  menuButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
  },
  menuButtonText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3b82f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuList: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#ef4444',
  },
});

export default SimpleMenu;