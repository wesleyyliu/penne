import React from 'react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native'
import { Session } from '@supabase/supabase-js'
import Avatar from './Avatar'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { RouteProp } from '@react-navigation/native';


type ProfileScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>;

export default function ProfileScreen({ navigation }: { navigation: any; route: ProfileScreenRouteProp }) {
  const route = useRoute<ProfileScreenRouteProp>()
  const { session } = route.params
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [memberSince, setMemberSince] = useState('01/15/2025')
  const [stats, setStats] = useState({
    friends: 35,
    likes: 50,
    dislikes: 80
  })

  useFocusEffect(
    React.useCallback(() => {
      if (session) getProfile()
    }, [session])
  )

  async function getProfile() {
    try {
      setLoading(false)
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
        console.error('Error:', error.message)
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { session })}>
            <Ionicons name="settings-outline" size={24} color="#787b46" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* PenneCard */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerContent}>
                <Image 
                  source={require('../assets/kei.png')}
                  style={styles.headerImage}
                  resizeMode="contain"
                />
                <Text style={styles.cardTitle}>PenneCard</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.profileImageContainer}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Image
                    source={require('../assets/kei.png')}
                    style={styles.profileImage}
                  />
                )}
              </View>

              <View style={styles.patternContainer}>
                <View style={styles.patternRow}>
                  {[...Array(5)].map((_, i) => (
                    <Image
                      key={`pattern-top-${i}`}
                      source={require('../assets/123.png')}
                      style={styles.patternImage}
                      resizeMode="contain"
                    />
                  ))}
                </View>
                <View style={styles.patternRow}>
                  {[...Array(5)].map((_, i) => (
                    <Image
                      key={`pattern-bottom-${i}`}
                      source={require('../assets/123.png')}
                      style={styles.patternImage}
                      resizeMode="contain"
                    />
                  ))}
                </View>
              </View>
              
              <View style={styles.userInfo}>
                <View>
                  <Text style={styles.userName}>{fullName || 'First LastName'}</Text>
                  <Text style={styles.userHandle}>@{username || 'username'}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberLabel}>Member since:</Text>
                  <Text style={styles.memberDate}>{memberSince}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={24} color="#fb923c" />
              <Text style={styles.statLabel}>Friends</Text>
              <Text style={styles.statValue}>{stats.friends}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={24} color="#fb923c" />
              <Text style={styles.statLabel}>Likes</Text>
              <Text style={styles.statValue}>{stats.likes}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="thumbs-down-outline" size={24} color="#fb923c" />
              <Text style={styles.statLabel}>Dislikes</Text>
              <Text style={styles.statValue}>{stats.dislikes}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.addFriendsButton}>
              <View style={styles.addIcon}>
                <Ionicons name="add" size={16} color="#fff" />
              </View>
              <Text style={styles.addFriendsText}>Add Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#fb923c" />
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#787b46',
  },
  mainContent: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#78716c',
    padding: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerImage: {
    width: 32,
    height: 32,
    tintColor: '#fff',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  cardBody: {
    padding: 24,
    backgroundColor: '#F3E8FF',
    position: 'relative',
    minHeight: 160,
  },
  profileImageContainer: {
    position: 'absolute',
    left: 24,
    top: 24,
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    zIndex: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
    marginTop: 100,
  },
  userName: {
    fontSize: 32,
    fontWeight: '500',
    color: '#78716c',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 20,
    color: '#78716c',
  },
  memberInfo: {
    alignItems: 'flex-end',
  },
  memberLabel: {
    fontSize: 16,
    color: '#78716c',
    marginBottom: 4,
  },
  memberDate: {
    fontSize: 16,
    color: '#78716c',
    fontWeight: '500',
  },
  patternContainer: {
    position: 'absolute',
    right: 24,
    top: '50%',
    transform: [{ translateY: -80 }],
    zIndex: 0,
  },
  patternRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  patternImage: {
    width: 32,
    height: 32,
    opacity: 0.15,
    tintColor: '#78716c',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFriendsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fb923c',
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 12,
  },
  addIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 4,
    marginRight: 8,
  },
  addFriendsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navItem: {
    padding: 8,
  },
  activeNavItem: {
    backgroundColor: '#fed7aa',
    borderRadius: 8,
  }
})