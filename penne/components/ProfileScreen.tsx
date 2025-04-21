import React from 'react'
import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Image, TextInput, Modal, FlatList, ActivityIndicator } from 'react-native'
import { Session } from '@supabase/supabase-js'
import Avatar from './Avatar'
import { useFocusEffect } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'
import { ProfileStackParamList } from '../screens/types'
import { StackNavigationProp } from '@react-navigation/stack'

// Define the props types using the ProfileStackParamList
type ProfileScreenRouteProp = RouteProp<ProfileStackParamList, 'ViewProfile'>
type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>

type ProfileScreenProps = {
  route: ProfileScreenRouteProp;
  navigation: ProfileScreenNavigationProp;
}

type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

// Make the component a proper functional component with Props
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { session } = route.params || {}
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
  // New state for friend search functionality
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [addingFriend, setAddingFriend] = useState<string | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  // Add new state to track friendships
  const [friendships, setFriendships] = useState<Record<string, boolean>>({})

  useFocusEffect(
    React.useCallback(() => {
      if (session) getProfile()
    }, [session])
  )

  async function getProfile() {
    try {
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error } = await supabase
        .from('profiles')
        .select(`username, full_name, avatar_url`)
        .eq('id', session.user.id)
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setFullName(data.full_name)
        if (data.avatar_url) {
          downloadImage(data.avatar_url)
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message)
      }
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
      if (error instanceof Error) {
        console.log('Error downloading image: ', error.message)
      }
    }
  }

  async function updateProfile({ avatar_url }: { avatar_url?: string }) {
    try {
      if (!session?.user) throw new Error('No user on the session!')
      
      const updates = {
        id: session.user.id,
        updated_at: new Date().toISOString(),
        ...(avatar_url && { avatar_url }),
      }
      
      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating profile:', error.message)
      }
    }
  }

  // Search for users based on username or full name
  async function searchUsers(query: string) {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      // Search for users that match the query in username or full_name
      // Exclude the current user from results
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', session?.user?.id || '')
        .limit(10)

      if (error) throw error
      
      // Set results first so UI updates
      setSearchResults(data || [])
      console.log("hi")
      // Check if any of the results are already friends
      if (data && data.length > 0 && session?.user) {
        // Immediately clear friendships to avoid stale data
        setFriendships({})
        console.log(data)
        // Then check friendships
        await checkFriendships(data.map(user => user.id))
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error searching users:', error.message)
      }
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // New function to check if users are already friends
  async function checkFriendships(userIds: string[]) {
    if (!session?.user) return

    console.log("userIds", userIds)
    console.log("session.user.id", session.user.id)
    
    try {
      // First check users that the current user follows
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('followed_user_id')
        .eq('following_user_id', session.user.id)
        .in('followed_user_id', userIds)
      
      if (followingError) throw followingError
      console.log("userIds", userIds)
      console.log("session.user.id", session.user.id)
      // Then check users that follow the current user
      const { data: followers, error: followersError } = await supabase
        .from('follows')
        .select('following_user_id')
        .eq('followed_user_id', session.user.id)
        .in('following_user_id', userIds)
      
      if (followersError) throw followersError
      
      // Create a map of user IDs to friendship status
      const newFriendships: Record<string, boolean> = {}
      
      // Initialize all to false first
      userIds.forEach(id => {
        newFriendships[id] = false
      })
      
      // Mark users as friends if current user follows them
      if (following) {
        following.forEach(friendship => {
          newFriendships[friendship.followed_user_id] = true
        })
      }
      
      // Mark users as friends if they follow the current user
      if (followers) {
        followers.forEach(friendship => {
          newFriendships[friendship.following_user_id] = true
        })
      }
      console.log("following", following)
      console.log("followers", followers)
      console.log(newFriendships)
      
      setFriendships(newFriendships)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error checking friendships:', error.message)
      }
    }
  }

  // Handle search input with debounce
  const handleSearchInput = (text: string) => {
    setSearchQuery(text)
    
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    
    // Set a new timeout to search after 500ms
    searchTimeout.current = setTimeout(() => {
      searchUsers(text)
    }, 500)
  }

  // Add modal visibility handler to reset and check friendships
  const handleOpenModal = async () => {
    // Reset search state
    setSearchQuery('')
    setSearchResults([])
    setFriendships({})
    
    // Open modal
    setSearchModalVisible(true)
  }

  // Modify the add friend function to work correctly
  async function addFriend(friendId: string) {
    if (!session?.user) return
    
    setAddingFriend(friendId)
    try {
      // Check if the friendship already exists to avoid duplicates
      const { data: existing, error: checkError } = await supabase
        .from('follows')
        .select('*')
        .eq('following_user_id', session.user.id)
        .eq('followed_user_id', friendId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        // If error isn't "no rows returned", it's a real error
        throw checkError;
      }
      
      // If friendship already exists, just update UI
      if (existing) {
        setFriendships(prev => ({
          ...prev,
          [friendId]: true
        }));
        return;
      }
      
      // Otherwise insert new friendship
      const { error } = await supabase
        .from('follows')
        .insert({
          following_user_id: session.user.id,
          followed_user_id: friendId,
        })
      
      if (error) throw error
      
      // Update local friend count
      setStats(prev => ({
        ...prev,
        friends: prev.friends + 1
      }))
      
      // Update local friendships state
      setFriendships(prev => ({
        ...prev,
        [friendId]: true
      }))
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error adding friend:', error.message)
      }
    } finally {
      setAddingFriend(null)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings', { session })}
          >
            <Ionicons name="settings-outline" size={24} color="#787b46" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* PenneCard */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerContent}>
                <Image 
                  source={require('../assets/234.png')}
                  style={styles.headerImage}
                  resizeMode="contain"
                />
                <Text style={styles.cardTitle}>PenneCard</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.profileImageContainer}>
                <Avatar
                  url={avatarUrl}
                  size={90}
                  onUpload={(path) => {
                    setAvatarUrl(path)
                    updateProfile({ avatar_url: path })
                  }}
                  upload={false}
                />
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
            <TouchableOpacity 
              style={styles.addFriendsButton}
              onPress={handleOpenModal}
            >
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

      {/* Friend Search Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={searchModalVisible}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friends</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchModalVisible(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
              >
                <Ionicons name="close" size={24} color="#78716c" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#78716c" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or name"
                value={searchQuery}
                onChangeText={handleSearchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  style={styles.clearSearch}
                >
                  <Ionicons name="close-circle" size={16} color="#78716c" />
                </TouchableOpacity>
              )}
            </View>
            
            {searching ? (
              <ActivityIndicator color="#fb923c" style={styles.loadingIndicator} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  searchQuery.length > 0 ? (
                    <Text style={styles.emptyListText}>No users found</Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <View style={styles.userResultItem}>
                    <View style={styles.userResultInfo}>
                      <Text style={styles.resultName}>{item.full_name}</Text>
                      <Text style={styles.resultUsername}>@{item.username}</Text>
                    </View>
                    {friendships[item.id] ? (
                      <View style={styles.friendedButton}>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.addUserButton,
                          addingFriend === item.id && styles.addingUserButton
                        ]}
                        onPress={() => addFriend(item.id)}
                        disabled={addingFriend === item.id}
                      >
                        {addingFriend === item.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="add" size={20} color="#fff" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
    borderRadius: 20,
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
    fontSize: 26,
    fontWeight: '500',
    color: '#78716c',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 18,
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
    left: 130,
    top: 24,
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
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: 2,
    color: '#787b46',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textTransform: 'uppercase',
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  avatarWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 20,
  },
  // Friend search modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fef8f0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#78716c',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffc',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
  },
  clearSearch: {
    padding: 4,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
    fontSize: 16,
  },
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userResultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultUsername: {
    fontSize: 14,
    color: '#6b7280',
  },
  addUserButton: {
    backgroundColor: '#fb923c',
    borderRadius: 8,
    padding: 8,
  },
  addingUserButton: {
    backgroundColor: '#fdba74',
  },
  friendedButton: {
    backgroundColor: '#fb923c',
    borderRadius: 8,
    padding: 8,
  },
})

export default ProfileScreen
