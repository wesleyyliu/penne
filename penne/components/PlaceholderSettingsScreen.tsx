import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'

export default function PlaceholderSettingsScreen({ navigation, route }: { navigation: any, route: any }) {
  const screenName = route.name || "Settings Screen"
  
  // Format screen name for display
  const getFormattedTitle = () => {
    if (screenName === 'NotificationsSettings') return 'NOTIFICATIONS';
    if (screenName === 'PrivacySettings') return 'PRIVACY';
    if (screenName === 'HelpScreen') return 'HELP';
    if (screenName === 'ChangeEmail') return 'CHANGE EMAIL';
    if (screenName === 'ChangeUsername') return 'CHANGE USERNAME';
    if (screenName === 'ChangePassword') return 'CHANGE PASSWORD';
    return screenName.toUpperCase();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#787b46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getFormattedTitle()}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              This feature is coming soon!
            </Text>
            <TouchableOpacity 
              style={styles.backButtonLarge}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
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
    textAlign: 'center',
    maxWidth: '70%',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 18,
    color: '#787b46',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButtonLarge: {
    backgroundColor: '#E28D61',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  }
}); 