import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import CheckerboardBackground from '../components/CheckerboardBackground';
import { Session } from '@supabase/supabase-js';

// Post interface based on the schema from DiningHallDetailScreen
interface Post {
  id: string;
  user_id: string;
  body: string;
  dining_hall: string;
  created_at: string;
  image_url?: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

type FeedScreenRouteProp = RouteProp<{ 
  params: { 
    diningHallName?: string;
    session?: Session;
    openModal?: boolean;
  } 
}, 'params'>;

const FeedScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<FeedScreenRouteProp>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [activeHallName, setActiveHallName] = useState('');
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { session } = route.params || {};

  useEffect(() => {
    fetchPosts();
  }, []);

  // Effect to handle incoming navigation params
  useEffect(() => {
    if (route.params?.diningHallName) {
      setActiveHallName(route.params.diningHallName);
      // Only set modal visible if we're navigating directly to create a post
      if (route.params?.openModal === true) {
        setPostModalVisible(true);
      }
      
      // Clear the param after using it to prevent reopening on navigation
      navigation.setParams({ 
        diningHallName: undefined,
        openModal: undefined 
      });
    }
  }, [route.params?.diningHallName, route.params?.openModal]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postError) {
        console.error('Error fetching posts:', postError);
        return;
      }
      
      if (!postData || postData.length === 0) {
        setPosts([]);
        return;
      }
      
      // Then fetch profiles for the posts
      const userIds = postData.map(post => post.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
        
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }
      
      // Create a map of user ids to profiles
      const profileMap = (profileData || []).reduce((map: any, profile) => {
        map[profile.id] = profile;
        return map;
      }, {});
      
      // Combine the data
      const postsWithProfiles = postData.map(post => ({
        ...post,
        profiles: profileMap[post.user_id] || { 
          username: 'username', 
          full_name: 'Name',
          avatar_url: null
        }
      }));
      
      setPosts(postsWithProfiles);
    } catch (err) {
      console.error('Error in fetchPosts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const submitPost = async () => {
    if (!newPost.trim() && !selectedImage) return;
    if (!session?.user) return;
    
    try {
      setSubmitting(true);
      
      // Create post in the database using the required schema
      const { error } = await supabase
        .from('posts')
        .insert({
          body: newPost.trim(),
          user_id: session.user.id,
          dining_hall: activeHallName,
          image_url: selectedImage || null
        });
      
      if (error) {
        console.error('Error submitting post:', error);
        return;
      }
      
      // Clear the input and close modal
      setNewPost('');
      setSelectedImage(null);
      setPostModalVisible(false);
      
      // Refresh posts
      fetchPosts();
    } catch (err) {
      console.error('Error in submitPost:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return postTime.toLocaleDateString(undefined, options);
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      {/* User Info */}
      <View style={styles.postHeader}>
        <View style={styles.userContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarFallback}>U</Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.profiles?.full_name || 'Name'}</Text>
            <Text style={styles.userHandle}>@{item.profiles?.username || 'username'} · {item.dining_hall}</Text>
          </View>
        </View>
        
        <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      
      {/* Post Content */}
      <Text style={styles.postContent}>{item.body}</Text>
      
      {/* Post Image (if available) */}
      {item.image_url && (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={22} color="#a8a29e" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#a8a29e" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo-outline" size={22} color="#a8a29e" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <CheckerboardBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>YOUR FEED</Text>
          </View>
          
          {/* Posts List */}
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#E28D61" style={styles.loader} />
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={renderPostItem}
              contentContainerStyle={styles.listContent}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No posts yet</Text>
                  <Text style={styles.emptySubText}>Be the first to post about a dining hall!</Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
      
      {/* Post Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity 
                onPress={() => {
                  setPostModalVisible(false);
                  setNewPost('');
                  setSelectedImage(null);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#78716c" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.hallNameText}>{activeHallName}</Text>
            
            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#a8a29e"
              multiline
              value={newPost}
              onChangeText={setNewPost}
              maxLength={280}
            />
            
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF8C29" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.modalFooter}>
              <View style={styles.mediaButtons}>
                <TouchableOpacity style={styles.mediaButton}>
                  <Ionicons name="image-outline" size={24} color="#FF8C29" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  (!newPost.trim() && !selectedImage || submitting) && styles.disabledButton
                ]}
                onPress={submitPost}
                disabled={(!newPost.trim() && !selectedImage) || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CheckerboardBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: 2,
    color: '#787b46',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 80,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarFallback: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#44403c',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: '#78716c',
  },
  timeAgo: {
    fontSize: 14,
    color: '#a8a29e',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#44403c',
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    marginRight: 20,
    padding: 4,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#78716c',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#a8a29e',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#44403c',
  },
  closeButton: {
    padding: 4,
  },
  hallNameText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fb923c',
    marginBottom: 16,
  },
  postInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#44403c',
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 12,
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    padding: 8,
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#fb923c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#fcd9bb',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedScreen;