import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const CustomDrawer = (props) => {
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

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Member'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => {
          if (item.adminOnly && !isAdmin) return null;
          
          const isActive = props.state.routeNames[props.state.index] === item.screen;
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => props.navigation.navigate(item.screen)}
            >
              <View style={styles.menuItemContent}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isActive ? '#3b82f6' : '#64748b'}
                />
                <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                  {item.name}
                </Text>
              </View>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Section */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <View style={styles.appInfo}>
          <Text style={styles.appName}>GMS Mobile</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 12,
  },
  activeMenuItem: {
    backgroundColor: '#f1f5f9',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 15,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 15,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  version: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
});

export default CustomDrawer;