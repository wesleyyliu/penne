import React, { useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, TextInput, Alert } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'

type ChangePasswordScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

export default function ChangePasswordScreen({ navigation }: { navigation: any }) {
  const route = useRoute<ChangePasswordScreenRouteProp>()
  const { session } = route.params
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hideCurrentPassword, setHideCurrentPassword] = useState(true)
  const [hideNewPassword, setHideNewPassword] = useState(true)
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }
    
    try {
      setLoading(true)
      
      // Note: Supabase doesn't have a built-in way to verify the current password
      // before changing to a new one. This is a simplified example.
      // In a real app, you'd want additional security measures.
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) throw error
      
      Alert.alert(
        'Success', 
        'Password updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#787b46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CHANGE PASSWORD</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={hideCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setHideCurrentPassword(!hideCurrentPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={hideCurrentPassword ? "eye-outline" : "eye-off-outline"} 
                  size={24} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={hideNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setHideNewPassword(!hideNewPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={hideNewPassword ? "eye-outline" : "eye-off-outline"} 
                  size={24} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={hideConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={hideConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={24} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
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
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: '#787b46',
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  saveButton: {
    backgroundColor: '#E28D61',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
}); 