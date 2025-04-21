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

interface Comment {
  id: string;
  user_id: string;
  dining_hall_name: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

type FeedScreenRouteProp = RouteProp<{ params: { diningHallName?: string } }, 'params'>;

const FeedScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<FeedScreenRouteProp>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activeHallName, setActiveHallName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  // Effect to handle incoming navigation params
  useEffect(() => {
    if (route.params?.diningHallName) {
      setActiveHallName(route.params.diningHallName);
      setCommentModalVisible(true);
      
      // Clear the param after using it to prevent reopening on navigation
      navigation.setParams({ diningHallName: undefined });
    }
  }, [route.params?.diningHallName]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // First fetch comments
      const { data: commentData, error: commentError } = await supabase
        .from('dining_comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (commentError) {
        console.error('Error fetching comments:', commentError);
        return;
      }
      
      if (!commentData || commentData.length === 0) {
        setComments([]);
        return;
      }
      
      // Then fetch profiles for those comments
      const userIds = commentData.map(comment => comment.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
        
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }
      
      // Create a map of user ids to profiles
      const profileMap = (profileData || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {});
      
      // Combine the data
      const commentsWithProfiles = commentData.map(comment => ({
        ...comment,
        profiles: profileMap[comment.user_id] || { 
          username: 'unknown', 
          full_name: 'Unknown User',
          avatar_url: null
        }
      }));
      
      setComments(commentsWithProfiles);
    } catch (err) {
      console.error('Error in fetchComments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComments();
  };

  const handleCommentPress = (hallName: string) => {
    setActiveHallName(hallName);
    setCommentModalVisible(true);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activeHallName) return;
    
    try {
      setSubmitting(true);
      
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (!userId) {
        console.error('No user ID found');
        return;
      }
      
      const { error } = await supabase
        .from('dining_comments')
        .insert({
          user_id: userId,
          dining_hall_name: activeHallName,
          content: newComment.trim()
        });
      
      if (error) {
        console.error('Error submitting comment:', error);
        return;
      }
      
      // Clear the input and close modal
      setNewComment('');
      setCommentModalVisible(false);
      
      // Refresh comments
      fetchComments();
    } catch (err) {
      console.error('Error in submitComment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return commentTime.toLocaleDateString(undefined, options);
  };

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      {/* User Info */}
      <View style={styles.commentHeader}>
        <View style={styles.userContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarFallback}>U</Text>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.profiles.full_name || 'User'}</Text>
            <Text style={styles.userHandle}>@{item.profiles.username || 'username'} · {item.dining_hall_name} Commons</Text>
          </View>
        </View>
        
        <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      
      {/* Comment Content */}
      <Text style={styles.commentContent}>{item.content}</Text>
      
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
          
          {/* Comments List */}
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#E28D61" style={styles.loader} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderCommentItem}
              contentContainerStyle={styles.listContent}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet</Text>
                  <Text style={styles.emptySubText}>Be the first to comment on a dining hall!</Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
      
      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Comment</Text>
              <TouchableOpacity 
                onPress={() => setCommentModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#78716c" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.hallNameText}>{activeHallName} Commons</Text>
            
            <TextInput
              style={styles.commentInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#a8a29e"
              multiline
              value={newComment}
              onChangeText={setNewComment}
              maxLength={280}
            />
            
            <View style={styles.modalFooter}>
              <Text style={styles.charCount}>{newComment.length}/280</Text>
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  (!newComment.trim() || submitting) && styles.disabledButton
                ]}
                onPress={submitComment}
                disabled={!newComment.trim() || submitting}
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
  commentCard: {
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
  commentHeader: {
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
  commentContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#44403c',
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
  commentInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#44403c',
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  charCount: {
    fontSize: 14,
    color: '#a8a29e',
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