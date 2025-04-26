import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useFonts } from 'expo-font'

type AccountSettingsScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

export default function AccountSettingsScreen({ navigation }: { navigation: any }) {
  const route = useRoute<AccountSettingsScreenRouteProp>()
  const { session } = route.params
  const [avatarUrl, setAvatarUrl] = useState('')
  const [username, setUsername] = useState('[Username]')
  const [fontsLoaded] = useFonts({
    'Kumbh-Sans': require('../assets/fonts/Kumbh-Sans.ttf'),
    'Kumbh-Sans-Bold': require('../assets/fonts/Kumbh-Sans-Bold.ttf'),
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
        .select('avatar_url, username')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      
      if (data) {
        if (data.avatar_url) {
          downloadImage(data.avatar_url)
        }
        if (data.username) {
          setUsername(data.username)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path)

      if (error) {
        throw error
      }

      const fr = new FileReader()
      fr.readAsDataURL(data)
      fr.onload = () => {
        setAvatarUrl(fr.result as string)
      }
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const accountOptions = [
    {
      id: 'photo',
      title: 'Change profile photo',
      component: (
        <View style={styles.photoPreview}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#9ca3af" />
            </View>
          )}
        </View>
      ),
      screen: 'ChangePhoto'
    },
    {
      id: 'email',
      title: 'Change email',
      value: 'example@gmail.com',
      screen: 'ChangeEmail'
    },
    {
      id: 'username',
      title: 'Change username',
      value: username,
      screen: 'ChangeUsername'
    },
    {
      id: 'password',
      title: 'Change password',
      value: '',
      screen: 'ChangePassword'
    },
    {
      id: 'privacy',
      title: 'Privacy settings',
      value: '',
      screen: 'PrivacySettings'
    }
  ]

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#787b46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>YOUR ACCOUNT</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mainContent}>
          {/* Account Options */}
          <View style={styles.optionsContainer}>
            {accountOptions.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.accountItem}
                onPress={() => navigation.navigate(item.screen, { session })}
              >
                <View style={styles.accountInfo}>
                  <Text style={styles.accountTitle}>{item.title}</Text>
                  {item.value ? <Text style={styles.accountValue}>{item.value}</Text> : null}
                  {item.component}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#EC732E" />
              </TouchableOpacity>
            ))}
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
  },
  mainContent: {
    flex: 1,
  },
  optionsContainer: {
    marginTop: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 18,
    color: '#857A5B',
    marginBottom: 4,
    fontFamily: 'Kumbh-Sans-Bold',
  },
  accountValue: {
    fontSize: 14,
    color: '#AB9D77',
    fontFamily: 'Kumbh-Sans',
  },
  photoPreview: {
    marginTop: 8,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 