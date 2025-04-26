import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'
import { useFonts } from 'expo-font'
import CheckerboardBackground from './CheckerboardBackground'
import { LinearGradient } from 'expo-linear-gradient'

type SettingsScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const route = useRoute<SettingsScreenRouteProp>()
  const { session } = route.params
  const [fontsLoaded] = useFonts({
    'Kumbh-Sans': require('../assets/fonts/Kumbh-Sans.ttf'),
    'Kumbh-Sans-Bold': require('../assets/fonts/Kumbh-Sans-Bold.ttf'),
    'GalileoFLF-Bold': require('../assets/fonts/GalileoFLF-Bold.ttf'),
    'GalileoFLF-Roman': require('../assets/fonts/GalileoFLF-Roman.ttf'),
    'OPTICenturyNova': require('../assets/fonts/OPTICenturyNova.otf'),
  });
  
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
      icon: 'help',
      screen: 'HelpScreen'
    }
  ]

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
    }
  }

  return (
    <CheckerboardBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header with gradient background */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['rgba(248, 237, 228, 0.7)', 'rgba(248, 237, 228, 1.0)', '#f8ede4']}
              style={styles.headerGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#787b46" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>SETTINGS</Text>
              <View style={{ width: 28 }} />
            </View>
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            {settingsOptions.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.settingItem}
                onPress={() => navigation.navigate(item.screen, { session })}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={24} color="#EC732E" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#EC732E" />
              </TouchableOpacity>
            ))}

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </CheckerboardBackground>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    position: 'relative',
    paddingBottom: 60,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: 2,
    color: '#787b46',
    fontFamily: 'OPTICenturyNova',
    textTransform: 'uppercase',
  },
  contentCard: {
    backgroundColor: '#fef8f0',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    flex: 1,
    padding: 30,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
    borderWidth: 1.5,
    borderColor: '#EC732E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    color: '#857A5B',
    marginBottom: 4,
    fontFamily: 'Kumbh-Sans-Bold',
  },
  settingDescription: {
    fontSize: 14,
    color: '#AB9D77',
    fontFamily: 'Kumbh-Sans',
  },
  logoutButton: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingLeft: 8,
  },
  logoutText: {
    fontSize: 18,
    color: '#A683A6',
    fontWeight: '500',
    fontFamily: 'Kumbh-Sans-Bold',
  }
}); 