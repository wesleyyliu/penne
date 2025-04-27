import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, TextInput, Alert } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useFonts } from 'expo-font';

type ChangeUsernameScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

export default function ChangeUsernameScreen({ navigation }: { navigation: any }) {
  const route = useRoute<ChangeUsernameScreenRouteProp>()
  const { session } = route.params
  
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUsername, setCurrentUsername] = useState('')
  const [fontsLoaded] = useFonts({
    'Kumbh-Sans': require('../assets/fonts/Kumbh-Sans.ttf'),
    'OPTICenturyNova': require('../assets/fonts/OPTICenturyNova.otf'),
  });

  useEffect(() => {
    if (session) {
      getProfile()
    }
  }, [session])

  async function getProfile() {
    try {
      if (!session?.user) return
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single()
        
      if (error) throw error
      
      if (data) {
        setCurrentUsername(data.username || '')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleChangeUsername = async () => {
    if (!username) {
      Alert.alert('Error', 'Please enter a username')
      return
    }
    
    try {
      setLoading(true)
      
      if (!session?.user) throw new Error('No user logged in')
      
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', session.user.id)
      
      if (error) throw error
      
      Alert.alert(
        'Success', 
        'Username updated successfully',
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
          <Text style={styles.headerTitle}>CHANGE USERNAME</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Current Username</Text>
            <View style={styles.currentValueContainer}>
              <Text style={styles.currentValue}>
                {currentUsername || '[Username]'}
              </Text>
            </View>
            
            <Text style={styles.label}>New Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter new username"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleChangeUsername}
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
    fontFamily: 'OPTICenturyNova',
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
  currentValueContainer: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  currentValue: {
    fontSize: 16,
    color: '#9ca3af',
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