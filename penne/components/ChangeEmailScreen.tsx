import React, { useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, TextInput, Alert } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'

type ChangeEmailScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

export default function ChangeEmailScreen({ navigation }: { navigation: any }) {
  const route = useRoute<ChangeEmailScreenRouteProp>()
  const { session } = route.params
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangeEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }
    
    try {
      setLoading(true)
      
      // This is a simplified example. In a real app, you should:
      // 1. Validate email format
      // 2. Send verification email
      // 3. Update email only after verification
      const { error } = await supabase.auth.updateUser({ email })
      
      if (error) throw error
      
      Alert.alert(
        'Success', 
        'Check your new email for a confirmation link.',
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
          <Text style={styles.headerTitle}>CHANGE EMAIL</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>New Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter new email address"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleChangeEmail}
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
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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