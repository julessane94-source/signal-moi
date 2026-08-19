import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { COLORS } from '../config/env'
import { useAuth } from '../context/AuthContext'
import LoginScreen from '../screens/Auth/LoginScreen'
import RegisterScreen from '../screens/Auth/RegisterScreen'
import PrivacyScreen from '../screens/Auth/PrivacyScreen'
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen'
import PublicHomeScreen from '../screens/Auth/PublicHomeScreen'
import CitizenHomeScreen from '../screens/Citizen/CitizenHomeScreen'
import CreateSignalementScreen from '../screens/Citizen/CreateSignalementScreen'
import LiveCameraScreen from '../screens/Citizen/LiveCameraScreen'
import ComplaintGuideScreen from '../screens/Citizen/ComplaintGuideScreen'
import PoliceDashboardScreen from '../screens/Police/PoliceDashboardScreen'
import CollaboratorDashboardScreen from '../screens/Collaborator/CollaboratorDashboardScreen'
import CollaboratorWorkScreen from '../screens/Collaborator/CollaboratorWorkScreen'
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen'
import AdminManagementScreen from '../screens/Admin/AdminManagementScreen'
import LoadingScreen from '../screens/Shared/LoadingScreen'
import HomeScreen from '../screens/Shared/HomeScreen'
import CampaignsScreen from '../screens/Shared/CampaignsScreen'
import SupermanScreen from '../screens/Shared/SupermanScreen'
import StatisticsScreen from '../screens/Shared/StatisticsScreen'
import ProfileScreen from '../screens/Shared/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const tabStyle = {
  height: 72,
  paddingBottom: 9,
  paddingTop: 8,
  backgroundColor: '#ffffff',
  borderTopColor: '#d9e7e3',
  borderTopWidth: 1,
  elevation: 18,
  shadowColor: '#10201d',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 16
}

const iconByRoute = {
  Accueil: 'home',
  Signaler: 'megaphone',
  Campagnes: 'calendar',
  SUPERMAN: 'chatbubble-ellipses',
  Compte: 'person-circle',
  Interventions: 'shield-checkmark',
  Statistiques: 'bar-chart',
  Collaborateur: 'people',
  Travail: 'briefcase',
  Admin: 'settings',
  Gestion: 'construct'
}

function screenOptions(activeColor) {
  return ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: activeColor,
    tabBarInactiveTintColor: COLORS.muted,
    tabBarStyle: tabStyle,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '900', marginTop: 1 },
    tabBarItemStyle: { paddingHorizontal: 1 },
    tabBarIcon: ({ color, focused }) => (
      <Ionicons name={iconByRoute[route.name] || 'ellipse'} size={focused ? 23 : 21} color={color} />
    )
  })
}

function CitizenTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions(COLORS.primary)}>
      <Tab.Screen name="Accueil" component={CitizenHomeScreen} />
      <Tab.Screen name="Signaler" component={CreateSignalementScreen} />
      <Tab.Screen name="Campagnes" component={CampaignsScreen} />
      <Tab.Screen name="SUPERMAN" component={SupermanScreen} />
      <Tab.Screen name="Compte" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function PoliceTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions(COLORS.police)}>
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Interventions" component={PoliceDashboardScreen} />
      <Tab.Screen name="Statistiques" component={StatisticsScreen} />
      <Tab.Screen name="SUPERMAN" component={SupermanScreen} />
      <Tab.Screen name="Compte" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function CollaboratorTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions(COLORS.primary)}>
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Collaborateur" component={CollaboratorDashboardScreen} />
      <Tab.Screen name="Travail" component={CollaboratorWorkScreen} />
      <Tab.Screen name="Campagnes" component={CampaignsScreen} />
      <Tab.Screen name="Statistiques" component={StatisticsScreen} />
      <Tab.Screen name="Compte" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions(COLORS.primaryDark)}>
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Admin" component={AdminDashboardScreen} />
      <Tab.Screen name="Gestion" component={AdminManagementScreen} />
      <Tab.Screen name="Statistiques" component={StatisticsScreen} />
      <Tab.Screen name="Compte" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function RoleHome() {
  const { user } = useAuth()
  const role = String(user?.role || '').toLowerCase()

  if (role.includes('admin') || role.includes('administrateur')) {
    return <AdminTabs />
  }

  if (role.includes('collaborateur') || role.includes('collaborator')) {
    return <CollaboratorTabs />
  }

  if (role.includes('commissariat') || role.includes('police') || role.includes('gendarmerie') || role.includes('force')) {
    return <PoliceTabs />
  }

  return <CitizenTabs />
}

export default function AppNavigator() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="RoleHome" component={RoleHome} />
          <Stack.Screen name="LiveCamera" component={LiveCameraScreen} />
          <Stack.Screen name="ComplaintGuide" component={ComplaintGuideScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="PublicHome" component={PublicHomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OfflineReport" component={CreateSignalementScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}
