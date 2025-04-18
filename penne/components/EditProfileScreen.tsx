import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native'
import { Input } from '@rneui/themed'
import { Session } from '@supabase/supabase-js'
import { useRoute, RouteProp } from '@react-navigation/native'
import Avatar from './Avatar'
import Ionicons from 'react-native-vector-icons/Ionicons'

type EditProfileScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const route = useRoute<EditProfileScreenRouteProp>()
  const { session } = route.params
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (session) getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, full_name, avatar_url`)
        .eq('id', session?.user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setFullName(data.full_name)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session?.user.id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigation.navigate('Auth')
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#787b46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={updateProfile} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Avatar
              size={80}
              url={avatarUrl}
              onUpload={(url: string) => {
                setAvatarUrl(url)
              }}
              upload={true}
            />
            <Text style={styles.avatarLabel}>Tap to change profile photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.inputGroup}>
            <Input
              label="Email"
              value={session?.user?.email}
              disabled
              labelStyle={styles.label}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
            />
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              labelStyle={styles.label}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              labelStyle={styles.label}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
              placeholder="Enter your username"
              autoCapitalize="none"
            />
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#787b46',
  },
  saveButton: {
    color: '#fb923c',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  form: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    paddingHorizontal: 0,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginTop: 'auto',
    marginBottom: 16,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})