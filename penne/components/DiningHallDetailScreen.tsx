import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, Button, ActivityIndicator, StatusBar, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../screens/types';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';

// Define types for menu data
interface MenuItem {
  id: number;
  dish: string;
  dish_upvote: number;
  dish_downvote: number;
  meal_type: string;
  station: string;
}

// Use the RootStackParamList for the route props
type DiningHallDetailRouteProp = RouteProp<RootStackParamList, 'DiningHallDetail'>;
type DiningHallDetailNavigationProp = StackNavigationProp<RootStackParamList>;

// Make the component a proper functional component with Props
type DiningHallDetailProps = {
  route: DiningHallDetailRouteProp;
};

const DiningHallDetailScreen: React.FC<DiningHallDetailProps> = ({ route }) => {
  const { hallName, session } = route.params;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Add state to track user votes
  const [userVotes, setUserVotes] = useState<Record<number, {upvoted: boolean, downvoted: boolean}>>({});

  // State for Survey Modal & Rating
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [rating, setRating] = useState(5); // Default rating is 5

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const navigation = useNavigation<DiningHallDetailNavigationProp>();

  // Helper function to get the appropriate image based on dining hall name
  const getHeaderImage = () => {
    switch (hallName) {
      case '1920 Commons':
        return require('../assets/commons.jpg');
      case 'Hill House':
        return require('../assets/hill.jpg');
      case 'Falk Dining Pavilion':
        return require('../assets/hillel.jpg');
      case 'Falk Dining Commons':
        return require('../assets/hillel.jpg');
      case 'Lauder College House':
        return require('../assets/launder.jpg');
      case 'Kings Court English House':
        return require('../assets/kchech .jpg');
      case 'Quaker Kitchen':
      default:
        return require('../assets/quaker_kitchen.jpg');
    }
  };

  // Fetch menu data from Supabase
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);

        const today = new Date().toISOString().split('T')[0];

        // Query with server-side sorting for better performance
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('dining_hall_name', hallName)
          .eq('created_at', today)
          .order('meal_type', { ascending: true })
          .order('station', { ascending: true })
          .order('dish', { ascending: true });
        
        if (error) throw error;
        setMenuItems(data || []);
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [hallName]);

  // Function to handle upvoting a dish
  const handleUpvote = async (itemId: number) => {
    try {
      if (!session?.user) return; // Make sure user is logged in
      
      // Check if user already voted on this item
      const currentVote = userVotes[itemId] || { upvoted: false, downvoted: false };
      
      // If already upvoted, remove upvote
      if (currentVote.upvoted) {
        // Update local state
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? {...item, dish_upvote: item.dish_upvote - 1} 
              : item
          )
        );
        
        // Update vote tracking
        setUserVotes(prev => ({
          ...prev,
          [itemId]: { ...currentVote, upvoted: false }
        }));
        
        // Update in database
        await supabase.rpc('decrement_dish_upvote', { dish_id: itemId });
        
        // Update dish_ratings table - set upvote to false
        await supabase
          .from('dish_ratings')
          .upsert({
            dish_id: itemId,
            user_id: session.user.id,
            upvote: false,
            downvote: currentVote.downvoted
          });
      } else {
        // Create local state updates first
        let updatedItem;
        setMenuItems(prevItems => {
          const newItems = prevItems.map(item => {
            if (item.id === itemId) {
              // Apply all changes to the item at once
              updatedItem = {
                ...item,
                dish_upvote: item.dish_upvote + 1,
                // If previously downvoted, remove the downvote
                dish_downvote: currentVote.downvoted ? item.dish_downvote - 1 : item.dish_downvote
              };
              return updatedItem;
            }
            return item;
          });
          return newItems;
        });
        
        // Update vote tracking
        setUserVotes(prev => ({
          ...prev,
          [itemId]: { upvoted: true, downvoted: false }
        }));
        
        // Then update the database (these can happen in parallel)
        const promises = [];
        promises.push(supabase.rpc('increment_dish_upvote', { dish_id: itemId }));
        
        if (currentVote.downvoted) {
          promises.push(supabase.rpc('decrement_dish_downvote', { dish_id: itemId }));
        }
        
        // Add/update entry in dish_ratings table
        promises.push(
          supabase
            .from('dish_ratings')
            .upsert({
              dish_id: itemId,
              user_id: session.user.id,
              upvote: true,
              downvote: false
            })
        );
        
        // Wait for all database updates to complete
        await Promise.all(promises);
      }
    } catch (err) {
      console.error('Error handling upvote:', err);
      // Revert optimistic update on error
    }
  };

  // Function to handle downvoting a dish
  const handleDownvote = async (itemId: number) => {
    try {
      if (!session?.user) return; // Make sure user is logged in
      
      // Check if user already voted on this item
      const currentVote = userVotes[itemId] || { upvoted: false, downvoted: false };
      
      // If already downvoted, remove downvote
      if (currentVote.downvoted) {
        // Update local state
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? {...item, dish_downvote: item.dish_downvote - 1} 
              : item
          )
        );
        
        // Update vote tracking
        setUserVotes(prev => ({
          ...prev,
          [itemId]: { ...currentVote, downvoted: false }
        }));
        
        // Update in database
        await supabase.rpc('decrement_dish_downvote', { dish_id: itemId });
        
        // Update dish_ratings table - set downvote to false
        await supabase
          .from('dish_ratings')
          .upsert({
            dish_id: itemId,
            user_id: session.user.id,
            upvote: currentVote.upvoted,
            downvote: false
          });
      } else {
        // Create local state updates first
        let updatedItem;
        setMenuItems(prevItems => {
          const newItems = prevItems.map(item => {
            if (item.id === itemId) {
              // Apply all changes to the item at once
              updatedItem = {
                ...item,
                dish_downvote: item.dish_downvote + 1,
                // If previously upvoted, remove the upvote
                dish_upvote: currentVote.upvoted ? item.dish_upvote - 1 : item.dish_upvote
              };
              return updatedItem;
            }
            return item;
          });
          return newItems;
        });
        
        // Update vote tracking
        setUserVotes(prev => ({
          ...prev,
          [itemId]: { upvoted: false, downvoted: true }
        }));
        
        // Then update the database (these can happen in parallel)
        const promises = [];
        promises.push(supabase.rpc('increment_dish_downvote', { dish_id: itemId }));
        
        if (currentVote.upvoted) {
          promises.push(supabase.rpc('decrement_dish_upvote', { dish_id: itemId }));
        }
        
        // Add/update entry in dish_ratings table
        promises.push(
          supabase
            .from('dish_ratings')
            .upsert({
              dish_id: itemId,
              user_id: session.user.id,
              upvote: false,
              downvote: true
            })
        );
        
        // Wait for all database updates to complete
        await Promise.all(promises);
      }
    } catch (err) {
      console.error('Error handling downvote:', err);
      // Revert optimistic update on error
    }
  };

  // Load user's previous votes when component mounts
  useEffect(() => {
    const loadUserVotes = async () => {
      if (!session?.user) return;
      
      try {
        const { data, error } = await supabase
          .from('dish_ratings')
          .select('dish_id, upvote, downvote')
          .eq('user_id', session.user.id);
          
        if (error) throw error;
        
        if (data) {
          // Convert array to object format for our userVotes state
          const votesMap: Record<number, {upvoted: boolean, downvoted: boolean}> = {};
          data.forEach(vote => {
            votesMap[vote.dish_id] = {
              upvoted: vote.upvote,
              downvoted: vote.downvote
            };
          });
          setUserVotes(votesMap);
        }
      } catch (err) {
        console.error('Error loading user votes:', err);
      }
    };
    
    loadUserVotes();
  }, [session]);

  // Function to handle rating submission
  const handleRating = async () => {
    try {
      if (!session?.user) return; // Make sure user is logged in
      await supabase.from('dining_hall_ratings').upsert({
        dining_hall_name: hallName,
        user_id: session.user.id,
        score: rating
      });
    } catch (err) {
      console.error('Error handling rating:', err);
    }
  };

  // Function to pick an image from camera roll
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Function to handle comment submission
  const submitComment = async () => {
    if (!commentText.trim() && !selectedImage) return;
    if (!session?.user) return;
    
    try {
      setSubmitting(true);
      
      // Upload image if selected
      let imageUrl = null;
      if (selectedImage) {
        // Here you would implement image upload to storage
        // For now, we'll just pretend we have the URL
        imageUrl = selectedImage;
      }
      
      // Submit comment to database
      const { error } = await supabase
        .from('dining_comments')
        .insert({
          user_id: session.user.id,
          dining_hall_name: hallName,
          content: commentText.trim(),
          image_url: imageUrl
        });
      
      if (error) {
        console.error('Error submitting comment:', error);
        return;
      }
      
      // Reset state and close modal
      setCommentText('');
      setSelectedImage(null);
      setCommentModalVisible(false);
      
      // Navigate to feed to see the posted comment
      navigation.navigate('Feed', { diningHallName: hallName, session });
      
    } catch (err) {
      console.error('Error in submitComment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Sample food images for the photos section
  const foodImages = [
    getHeaderImage(),
    getHeaderImage(),
    getHeaderImage(),
    getHeaderImage(),
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Image */}
      <Image
        source={getHeaderImage()}
        style={styles.headerImage}
        onError={() => setImageError(true)}
      />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </TouchableOpacity>
      
      {/* Action Buttons Group */}
      <View style={styles.actionButtonsGroup}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={pickImage}
        >
          <Ionicons name="camera-outline" size={20} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setCommentModalVisible(true)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Feed', { diningHallName: hallName })}
        >
          <Ionicons name="add-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Hall Name and Rank */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{hallName}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#1</Text>
            </View>
          </View>

          {/* Photos Section */}
          <Text style={styles.sectionTitle}>Photos from Penne members</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.photoScroll}
            contentContainerStyle={styles.photoScrollContent}
          >
            {foodImages.map((photo, index) => (
              <Image key={index} source={photo} style={styles.foodPhoto} />
            ))}
          </ScrollView>

          {/* Menu Section */}
          <Text style={styles.sectionTitle}>Menu</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#FF8C29" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : menuItems.length > 0 ? (
            <View style={styles.menuContainer}>
              {menuItems.map((dish, index) => (
                <View key={index} style={styles.menuItem}>
                  <View style={styles.menuItemDetails}>
                    <Text style={styles.menuText}>{dish.dish || "Mango-glazed chicken thigh"}</Text>
                  </View>
                  <View style={styles.reactions}>
                    <View style={styles.reactionContainer}>
                      <TouchableOpacity 
                        style={styles.reactionButton}
                        onPress={() => handleUpvote(dish.id)}
                      >
                        <Ionicons 
                          name={userVotes[dish.id]?.upvoted ? "heart" : "heart-outline"} 
                          size={18} 
                          color="#555" 
                        />
                        <Text style={styles.reactionCount}>{dish.dish_upvote}</Text>
                      </TouchableOpacity>
                      <View style={styles.divider} />
                      <TouchableOpacity 
                        style={styles.reactionButton}
                        onPress={() => handleDownvote(dish.id)}
                      >
                        <Ionicons 
                          name={userVotes[dish.id]?.downvoted ? "thumbs-down" : "thumbs-down-outline"} 
                          size={18} 
                          color="#555" 
                        />
                        <Text style={styles.reactionCount}>{dish.dish_downvote}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              
              {/* If no menu items, show sample items to match screenshot */}
              {menuItems.length === 0 && Array(8).fill(0).map((_, index) => (
                <View key={index} style={styles.menuItem}>
                  <View style={styles.menuItemDetails}>
                    <Text style={styles.menuText}>Mango-glazed chicken thigh</Text>
                  </View>
                  <View style={styles.reactions}>
                    <View style={styles.reactionContainer}>
                      <TouchableOpacity style={styles.reactionButton}>
                        <Ionicons name="heart-outline" size={18} color="#555" />
                        <Text style={styles.reactionCount}>200</Text>
                      </TouchableOpacity>
                      <View style={styles.divider} />
                      <TouchableOpacity style={styles.reactionButton}>
                        <Ionicons name="thumbs-down-outline" size={18} color="#555" />
                        <Text style={styles.reactionCount}>100</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noMenu}>No menu available</Text>
          )}
        </ScrollView>
      </View>

      {/* Rating Modal */}
      <Modal visible={surveyVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate {hallName}</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setSurveyVisible(false)} color="red" />
              <Button
                title="Submit"
                onPress={() => {
                  handleRating();
                  setSurveyVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.commentModalContent}>
            <Text style={styles.modalTitle}>Add Comment for {hallName}</Text>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Write your comment here..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={200}
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
            
            <View style={styles.commentActions}>
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={24} color="#FF8C29" />
                <Text style={styles.imagePickerText}>Add Photo</Text>
              </TouchableOpacity>
              
              <View style={styles.commentButtons}>
                <Button 
                  title="Cancel" 
                  onPress={() => {
                    setCommentModalVisible(false);
                    setCommentText('');
                    setSelectedImage(null);
                  }} 
                  color="red" 
                />
                <Button
                  title={submitting ? "Posting..." : "Post"}
                  onPress={submitComment}
                  disabled={(!commentText.trim() && !selectedImage) || submitting}
                  color="#FF8C29"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000',
  },
  headerImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
    borderRadius: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsGroup: {
    position: 'absolute',
    top: 245,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  contentArea: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    paddingTop: 25,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'serif',
    color: '#566D55',
    fontWeight: '500',
  },
  rankBadge: {
    backgroundColor: '#F9D7B2',
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C29',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FF8C29',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  photoScroll: {
    marginBottom: 15,
  },
  photoScrollContent: {
    paddingHorizontal: 15,
  },
  foodPhoto: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  // Menu styling
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemDetails: {
    flex: 1,
    paddingRight: 10,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  reactions: {
    flexDirection: 'row',
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6EED8',
    borderRadius: 20,
    overflow: 'hidden',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reactionCount: {
    marginLeft: 5,
    fontWeight: '500',
    color: '#555',
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E0D8C0',
  },
  loader: {
    marginVertical: 30,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  noMenu: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 30,
    color: '#999',
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
  },
  commentModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#566D55',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 15,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  commentActions: {
    marginTop: 10,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePickerText: {
    marginLeft: 10,
    color: '#FF8C29',
    fontWeight: '500',
  },
  commentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default DiningHallDetailScreen;
