import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const BasicCustomDrawer = (props) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Member'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        {menuItems.map((item, index) => {
          if (item.adminOnly && !isAdmin) return null;
          
          const isActive = props.state.routeNames[props.state.index] === item.screen;
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => props.navigation.navigate(item.screen)}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? '#fff' : '#3b82f6'}
              />
              <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.appName}>GMS Mobile v1.0.0</Text>
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
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 15,
    marginLeft: 20,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  activeMenuItem: {
    backgroundColor: '#3b82f6',
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 15,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#fff',
    fontWeight: '600',
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
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 15,
    fontWeight: '500',
  },
  appName: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default BasicCustomDrawer;