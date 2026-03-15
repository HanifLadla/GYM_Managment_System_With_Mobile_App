import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MembersScreen from './src/screens/MembersScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import TrainersScreen from './src/screens/TrainersScreen';
import ClassesScreen from './src/screens/ClassesScreen';
import EquipmentScreen from './src/screens/EquipmentScreen';
import PlansScreen from './src/screens/PlansScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddMemberScreen from './src/screens/AddMemberScreen';
import AddPaymentScreen from './src/screens/AddPaymentScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import AboutScreen from './src/screens/AboutScreen';

// Components
import HeaderWithMenu from './src/components/HeaderWithMenu';
import SimpleSplash from './src/components/SimpleSplash';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ROLES, hasRole } from './src/utils/roles';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { user } = useAuth();
  const isAdmin = hasRole(user, [ROLES.ADMIN]);
  const isTrainer = hasRole(user, [ROLES.TRAINER]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Members':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Attendance':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              break;
            case 'Payments':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        header: ({ navigation, route }) => (
          <HeaderWithMenu title={route.name} navigation={navigation} />
        ),
      })}
    >
      {(isAdmin || isTrainer) && (
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
      )}
      {(isAdmin || isTrainer) && (
        <Tab.Screen name="Members" component={MembersScreen} />
      )}
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const isAdmin = hasRole(user, [ROLES.ADMIN]);
  const isTrainer = hasRole(user, [ROLES.TRAINER]);

  if (loading) {
    return <SimpleSplash />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Group>
            <Stack.Screen name="Main" component={TabNavigator} />
            {(isAdmin || isTrainer) && (
              <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            )}
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={({ navigation }) => ({
                headerShown: true,
                title: 'My Profile',
                header: () => <HeaderWithMenu title="My Profile" navigation={navigation} />
              })} 
            />
            {(isAdmin || isTrainer) && (
              <Stack.Screen 
                name="Trainers" 
                component={TrainersScreen} 
                options={({ navigation }) => ({
                  headerShown: true,
                  title: 'Trainers',
                  header: () => <HeaderWithMenu title="Trainers" navigation={navigation} />
                })} 
              />
            )}
            {(isAdmin || isTrainer) && (
              <Stack.Screen 
                name="Classes" 
                component={ClassesScreen} 
                options={({ navigation }) => ({
                  headerShown: true,
                  title: 'Classes',
                  header: () => <HeaderWithMenu title="Classes" navigation={navigation} />
                })} 
              />
            )}
            {isAdmin && (
              <Stack.Screen 
                name="Equipment" 
                component={EquipmentScreen} 
                options={({ navigation }) => ({
                  headerShown: true,
                  title: 'Equipment',
                  header: () => <HeaderWithMenu title="Equipment" navigation={navigation} />
                })} 
              />
            )}
            {(isAdmin || isTrainer) && (
              <Stack.Screen 
                name="Plans" 
                component={PlansScreen} 
                options={({ navigation }) => ({
                  headerShown: true,
                  title: 'Plans',
                  header: () => <HeaderWithMenu title="Plans" navigation={navigation} />
                })} 
              />
            )}
            {(isAdmin || isTrainer) && (
              <Stack.Screen 
                name="Reports" 
                component={ReportsScreen} 
                options={({ navigation }) => ({
                  headerShown: true,
                  title: 'Reports',
                  header: () => <HeaderWithMenu title="Reports" navigation={navigation} />
                })} 
              />
            )}
            {isAdmin && (
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen} 
                options={({ navigation }) => ({
                  headerShown: true,
                  title: 'Settings',
                  header: () => <HeaderWithMenu title="Settings" navigation={navigation} />
                })} 
              />
            )}
            {isAdmin && (
              <Stack.Screen 
                name="AddMember" 
                component={AddMemberScreen} 
                options={{ headerShown: true, title: 'Add Member' }} 
              />
            )}
            {isAdmin && (
              <Stack.Screen 
                name="AddPayment" 
                component={AddPaymentScreen} 
                options={{ headerShown: true, title: 'Add Payment' }} 
              />
            )}
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications' }} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: true, title: 'Help & Support' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'About' }} />
          </Stack.Group>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </PaperProvider>
  );
}
