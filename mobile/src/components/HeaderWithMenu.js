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
import { ROLES, hasRole } from '../utils/roles';

const HeaderWithMenu = ({ title, navigation }) => {
  const [visible, setVisible] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Profile', icon: 'person', screen: 'Profile', roles: [ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER] },
    { name: 'My Payments', icon: 'card', screen: 'Payments', roles: [ROLES.MEMBER] },
    { name: 'Trainers', icon: 'fitness', screen: 'Trainers', roles: [ROLES.ADMIN, ROLES.TRAINER] },
    { name: 'Classes', icon: 'calendar', screen: 'Classes', roles: [ROLES.ADMIN, ROLES.TRAINER] },
    { name: 'Equipment', icon: 'barbell', screen: 'Equipment', roles: [ROLES.ADMIN] },
    { name: 'Plans', icon: 'pricetag', screen: 'Plans', roles: [ROLES.ADMIN, ROLES.TRAINER] },
    { name: 'Reports', icon: 'bar-chart', screen: 'Reports', roles: [ROLES.ADMIN, ROLES.TRAINER] },
    { name: 'Settings', icon: 'settings', screen: 'Settings', roles: [ROLES.ADMIN] },
  ];

  const handleNavigate = (screen) => {
    setVisible(false);
    navigation.navigate(screen);
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setVisible(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
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
                if (!hasRole(user, item.roles)) return null;
                
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
    </>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 24,
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

export default HeaderWithMenu;
