import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Alert, Text, TouchableOpacity } from 'react-native'
import { Session } from '@supabase/supabase-js'
import Avatar from './Avatar'
import { useRoute } from '@react-navigation/native'

import { RouteProp } from '@react-navigation/native';

type ProfileScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>;

export default function ProfileScreen({ navigation }: { navigation: any; route: ProfileScreenRouteProp }) {
  const route = useRoute<ProfileScreenRouteProp>()
  const { session } = route.params
  const [loading, setLoading] = useState(true)
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
      console.error('Error fetching profile:', error)
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <Text style={styles.fullName}>{fullName}</Text>
      </View>
      <View style={styles.avatarContainer}>
        <Avatar size={100} url={avatarUrl} onUpload={() => {}} upload={false} />
      </View>
      <View style={styles.userInfoContainer}>
        <Text style={styles.username}>@{username}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('EditProfile', { session })}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Share Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center', // Center align items
  },
  avatarContainer: {
    marginBottom: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  username: {
    fontSize: 18,
    color: 'gray',
  },
  buttonContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 20, 
  },
  button: {
    backgroundColor: '#b0b0b0',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
})