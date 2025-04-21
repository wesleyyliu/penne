import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Image, FlatList } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'

type SettingsScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const route = useRoute<SettingsScreenRouteProp>()
  const { session } = route.params
  
  const settingsOptions = [
    {
      id: 'account',
      title: 'Your account',
      description: 'Change password, update contact info, etc.',
      icon: 'person-outline',
      screen: 'AccountSettings'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Select which notifications you receive from us',
      icon: 'notifications-outline',
      screen: 'NotificationsSettings'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Manage the information you see and share on Penne',
      icon: 'lock-closed-outline',
      screen: 'PrivacySettings'
    },
    {
      id: 'help',
      title: 'Help',
      description: 'Read our frequently asked questions and contact support',
      icon: 'help-circle-outline',
      screen: 'HelpScreen'
    }
  ]

  const handleLogout = async () => {
    // Add supabase logout logic here
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#787b46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mainContent}>
          {/* Settings Options */}
          <View style={styles.optionsContainer}>
            {settingsOptions.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.settingItem}
                onPress={() => navigation.navigate(item.screen, { session })}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={24} color="#E28D61" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#E28D61" />
              </TouchableOpacity>
            ))}

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fef8f0',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#787b46',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textTransform: 'uppercase',
  },
  mainContent: {
    flex: 1,
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E28D61',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#787b46',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  logoutButton: {
    marginTop: 30,
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 18,
    color: '#9376e0',
    fontWeight: '500',
  }
}); 