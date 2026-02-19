import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const CustomDrawerEnhanced = (props) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { name: 'Profile', icon: 'person', screen: 'Profile', adminOnly: false, color: '#8b5cf6' },
    { name: 'Trainers', icon: 'fitness', screen: 'Trainers', adminOnly: true, color: '#f59e0b' },
    { name: 'Classes', icon: 'calendar', screen: 'Classes', adminOnly: false, color: '#10b981' },
    { name: 'Equipment', icon: 'barbell', screen: 'Equipment', adminOnly: true, color: '#ef4444' },
    { name: 'Plans', icon: 'pricetag', screen: 'Plans', adminOnly: false, color: '#06b6d4' },
    { name: 'Reports', icon: 'bar-chart', screen: 'Reports', adminOnly: true, color: '#84cc16' },
    { name: 'Settings', icon: 'settings', screen: 'Settings', adminOnly: true, color: '#6b7280' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8', '#1e40af']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animatable.View animation=\"fadeInUp\" duration={800} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.avatarGradient}
            >
              <Ionicons name=\"person\" size={35} color=\"#fff\" />
            </LinearGradient>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <View style={styles.roleContainer}>
              <View style={styles.roleBadge}>
                <Text style={styles.userRole}>{user?.role || 'Member'}</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </Animatable.View>
        
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          {menuItems.map((item, index) => {
            if (item.adminOnly && !isAdmin) return null;
            
            const isActive = props.state.routeNames[props.state.index] === item.screen;
            
            return (
              <Animatable.View
                key={index}
                animation=\"fadeInRight\"
                delay={index * 100}
                duration={600}
              >
                <TouchableOpacity
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={() => props.navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isActive ? '#fff' : item.color}
                    />
                  </View>
                  <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                    {item.name}
                  </Text>
                  {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />
                  )}
                </TouchableOpacity>
              </Animatable.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Section */}
      <Animatable.View animation=\"fadeInUp\" delay={500} style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.logoutIconContainer}>
            <Ionicons name=\"log-out-outline\" size={22} color=\"#ef4444\" />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <View style={styles.appInfo}>
          <Text style={styles.appName}>🏋️ GMS Mobile</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </Animatable.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatarGradient: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleContainer: {
    marginBottom: 5,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userRole: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuSection: {
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 15,
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 3,
    borderRadius: 15,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeMenuItem: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  activeMenuText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 25,
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 15,
  },
  appInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  version: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default CustomDrawerEnhanced;