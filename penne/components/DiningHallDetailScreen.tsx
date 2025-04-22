import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, Button, ActivityIndicator, StatusBar, TextInput, Alert, Platform, Animated, PanResponder, Dimensions, LayoutChangeEvent } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../screens/types';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define types for menu data
interface MenuItem {
  id: number;
  dish: string;
  dish_upvote: number;
  dish_downvote: number;
  meal_type: string;
  station: string;
}

interface DiningHallPhoto {
  id: string;
  uri: string;
  isLocal?: boolean; // Flag to indicate if this is a locally added photo
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
  
  // Store slider track width
  const [sliderTrackWidth, setSliderTrackWidth] = useState(270);
  
  // Fixed slider constants - these will be updated based on layout
  const SLIDER_MIN = 25; // Left edge position of slider track
  const SLIDER_MAX = sliderTrackWidth - 25; // Right edge position based on measured width
  const SLIDER_RANGE = SLIDER_MAX - SLIDER_MIN;
  const INITIAL_POSITION = SLIDER_MIN + (SLIDER_RANGE * 0.2); // Start at 20% of the track (for "FOOD POISONING")

  // Update default rating to 2 (food poisoning) to match screenshot
  const [rating, setRating] = useState(2); // Default rating is 2 (food poisoning)

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Add state to track user votes
  const [userVotes, setUserVotes] = useState<Record<number, {upvoted: boolean, downvoted: boolean}>>({});

  // State for Survey Modal & Rating
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(INITIAL_POSITION); // Initial position in the middle of slider
  const [ratingDescription, setRatingDescription] = useState('Tastes like...');
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Image capture/selection related state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [diningHallPhotos, setDiningHallPhotos] = useState<DiningHallPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Create Animated values for tomato position and scale
  const tomatoPosition = useRef(new Animated.Value(INITIAL_POSITION)).current;
  const tomatoScale = useRef(new Animated.Value(1)).current; // Add scale animation

  // Create PanResponder for the tomato slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // When the user starts dragging, make the tomato larger
        Animated.spring(tomatoScale, {
          toValue: 1.2, // Scale up by 20%
          friction: 3,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position directly
        const position = INITIAL_POSITION + gestureState.dx;
        // Constrain to slider bounds
        const boundedPosition = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, position));
        
        // Update animated value directly
        tomatoPosition.setValue(boundedPosition);
        
        // Update state variables
        setSliderPosition(boundedPosition);
        
        // Calculate rating based on position
        const normalizedPosition = (boundedPosition - SLIDER_MIN) / SLIDER_RANGE;
        const calculatedRating = Math.max(1, Math.min(10, Math.round(normalizedPosition * 9) + 1));
        
        // Only update rating if it changed
        if (calculatedRating !== rating) {
          setRating(calculatedRating);
          
          // Update feedback text
          if (calculatedRating <= 3) {
            setRatingFeedback('FOOD POISONING.');
          } else if (calculatedRating <= 5) {
            setRatingFeedback('Edible, I guess.');
          } else if (calculatedRating <= 7) {
            setRatingFeedback('Pretty decent!');
          } else if (calculatedRating <= 9) {
            setRatingFeedback('Delicious!');
          } else {
            setRatingFeedback('MICHELIN STAR!');
          }
        }
      },
      onPanResponderRelease: () => {
        // Scale the tomato back to normal size
        Animated.spring(tomatoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

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
      case 'Houston Market':
        return require('../assets/houston.jpg');
      case '1920 Gourmet Grocer':
        return require('../assets/grocer.jpg');
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
          .select('id, dish, dish_upvote, dish_downvote, meal_type, station')
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
    fetchDiningHallPhotos();
  }, [hallName]);

  // Function to fetch dining hall photos from Supabase
  const fetchDiningHallPhotos = async () => {
    try {
      setLoadingPhotos(true);
      
      try {
        const { data, error } = await supabase
          .from('dining_hall_photos')
          .select('id, image_url')
          .eq('dining_hall_name', hallName)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          // If the table doesn't exist, we'll use default images instead
          if (error.code === '42P01') {
            console.log('dining_hall_photos table does not exist, using default images');
            // Set empty photos array to use default images
            setDiningHallPhotos([]);
            return;
          }
          throw error;
        }
        
        // Map the data to our local format
        const photos = data?.map(photo => ({
          id: photo.id,
          uri: photo.image_url
        })) || [];
        
        setDiningHallPhotos(photos);
      } catch (error: any) {
        // For development/testing, fallback to empty array which will show default images
        console.error('Error fetching dining hall photos:', error);
        
        // If we're in development, just use default images
        if (__DEV__) {
          console.log('Development mode: using default images');
          setDiningHallPhotos([]);
        }
      }
    } finally {
      setLoadingPhotos(false);
    }
  };

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
      
      // Show success message
      Alert.alert('Thank you!', `You rated ${hallName} ${rating}/10`, [
        { text: 'OK', onPress: () => setSurveyVisible(false) }
      ]);
    } catch (err) {
      console.error('Error handling rating:', err);
      Alert.alert('Error', 'There was a problem submitting your rating. Please try again.');
    }
  };

  // Use useEffect to set initial position of tomato
  useEffect(() => {
    // Set the initial position when the survey becomes visible
    if (surveyVisible) {
      const initialRating = 2; // Middle rating (2 out of 10)
      
      // Calculate the position for rating 2
      const initialPosition = SLIDER_MIN + ((initialRating - 1) / 9) * SLIDER_RANGE;
      
      // Set the animated value and state
      tomatoPosition.setValue(initialPosition);
      setSliderPosition(initialPosition);
      setRating(initialRating);
      setRatingFeedback('FOOD POISONING.');
    }
  }, [surveyVisible]);

  // Function to pick an image from camera roll
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleNewPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to access the photo library. Please try again.');
    }
  };

  // Function to take a photo with the camera
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'We need camera permission to take photos.');
        return;
      }
      
      // Check if we're running in a simulator
      const isSimulator = Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 13 && !Platform.isPad && !Platform.isTV;
      
      if (isSimulator) {
        Alert.alert(
          'Simulator Detected', 
          'Camera is not available in the simulator. Please use the photo library instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use Photo Library', onPress: pickImage }
          ]
        );
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleNewPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        'Camera Error', 
        'Could not access the camera. Would you like to choose a photo from your library instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Photo Library', onPress: pickImage }
        ]
      );
    } finally {
      setPhotoModalVisible(false);
    }
  };

  // Function to handle a new photo (taken or selected)
  const handleNewPhoto = async (uri: string) => {
    if (!session?.user) {
      Alert.alert('Login Required', 'You need to be logged in to upload photos.');
      return;
    }
    
    try {
      setUploadingPhoto(true);
      
      // First add it locally for immediate feedback
      const newPhotoId = Date.now().toString();
      const newPhoto: DiningHallPhoto = {
        id: newPhotoId,
        uri: uri,
        isLocal: true
      };
      
      // Add to the beginning of the array
      setDiningHallPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
      
      // Try to upload to the database
      try {
        // 1. Upload the image to Supabase storage
        const fileName = `${session.user.id}_${newPhotoId}.jpg`;
        const filePath = `dining-hall-photos/${fileName}`;
        
        // In a real implementation, you would need to convert the URI to a blob/file
        
        // 2. Try to insert into posts table since we know it exists
        console.log('Attempting to save photo to posts table...');
        const { error } = await supabase
          .from('posts')
          .insert({
            user_id: session.user.id,
            body: `Posted a photo from ${hallName}`,
            dining_hall: hallName,
            image_url: uri
          });
        
        if (error) {
          console.log('Error saving to posts:', error);
        } else {
          console.log('Photo saved successfully to posts table');
        }
      } catch (storageError) {
        console.log('Using local storage mode for development');
        // In development, we'll keep the local photo without trying to sync with the server
      }
      
      // No need to refresh photos from server since we're displaying locally
      // The photo is already in the state
      
    } catch (err) {
      console.error('Error uploading photo:', err);
      // For development, don't show the error alert because we're expecting storage upload to fail in simulator
      if (__DEV__) {
        console.log('Development mode: keeping local photo despite upload error');
      } else {
        Alert.alert('Upload Failed', 'There was an error uploading your photo. Please try again.');
        
        // Remove the local photo if the upload failed (in production only)
        setDiningHallPhotos(prevPhotos => 
          prevPhotos.filter(photo => !(photo.isLocal && photo.uri === uri))
        );
      }
    } finally {
      setUploadingPhoto(false);
      setPhotoModalVisible(false);
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
        // For now, we'll just use the selected image URI
        imageUrl = selectedImage;
      }
      
      // Check if dining_comments table exists, if not fall back to posts
      try {
        console.log('Attempting to submit comment to database...');
        
        // Try the posts table which we know exists
        const { error } = await supabase
          .from('posts')
          .insert({
            user_id: session.user.id,
            body: commentText.trim(),
            dining_hall: hallName,
            image_url: imageUrl
          });
        
        if (error) {
          console.error('Error submitting post:', error);
          return;
        }
        
        console.log('Comment submitted successfully to posts table');
      } catch (err) {
        console.error('Error submitting to database:', err);
        return;
      }
      
      // Reset state and close modal
      setCommentText('');
      setSelectedImage(null);
      setCommentModalVisible(false);
      
      // Navigate to feed to see the posted comment
      navigation.navigate('Feed', { session });
      
    } catch (err) {
      console.error('Error in submitComment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Update tomato position when slider width changes
  useEffect(() => {
    // Recalculate the position when track width changes
    const newPosition = SLIDER_MIN + ((rating - 1) / 9) * SLIDER_RANGE;
    tomatoPosition.setValue(newPosition);
    setSliderPosition(newPosition);
  }, [sliderTrackWidth]);
  
  // Function to handle slider track layout
  const handleSliderLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    console.log("Slider width:", width);
    setSliderTrackWidth(width);
  };

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
          onPress={() => setPhotoModalVisible(true)}
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
          onPress={() => setSurveyVisible(true)}
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
          {loadingPhotos ? (
            <ActivityIndicator color="#FF8C29" style={styles.loader} />
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.photoScroll}
              contentContainerStyle={styles.photoScrollContent}
            >
              {diningHallPhotos.length > 0 ? (
                diningHallPhotos.map((photo) => (
                  <Image 
                    key={photo.id} 
                    source={{ uri: photo.uri }} 
                    style={[
                      styles.foodPhoto,
                      photo.isLocal && styles.localPhoto
                    ]} 
                  />
                ))
              ) : (
                // Show default images if no user photos
                Array(4).fill(0).map((_, index) => (
                  <Image key={index} source={getHeaderImage()} style={styles.foodPhoto} />
                ))
              )}
              
              {/* Add Photo button at the end */}
              <TouchableOpacity 
                style={styles.addPhotoButton}
                onPress={() => setPhotoModalVisible(true)}
              >
                <Ionicons name="add-circle" size={30} color="#FF8C29" />
                <Text style={styles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

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

      {/* Survey Rating Modal */}
      <Modal visible={surveyVisible} transparent animationType="fade">
        <View style={styles.surveyModalOverlay}>
          <View style={styles.surveyModalContent}>
            <TouchableOpacity 
              style={styles.surveyCloseButton}
              onPress={() => setSurveyVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.surveyHeader}>
              <Text style={styles.surveyHallName}>{hallName}</Text>
            </View>
            
            <View style={styles.surveyBody}>
              <Text style={styles.surveyLabel}>{ratingDescription}</Text>
              
              <View style={styles.sliderContainer}>
                <TouchableOpacity 
                  activeOpacity={1} 
                  style={styles.sliderTouchable}
                  onLayout={handleSliderLayout}
                  onPress={(event) => {
                    // Get touch position relative to the slider
                    const { locationX } = event.nativeEvent;
                    
                    // Calculate new position constrained to slider
                    const newPosition = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, locationX));
                    
                    // Animate to the new position
                    Animated.spring(tomatoPosition, {
                      toValue: newPosition,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: false,
                    }).start();
                    
                    // Update state
                    setSliderPosition(newPosition);
                    
                    // Calculate and update rating
                    const normalizedPosition = (newPosition - SLIDER_MIN) / SLIDER_RANGE;
                    const calculatedRating = Math.max(1, Math.min(10, Math.round(normalizedPosition * 9) + 1));
                    setRating(calculatedRating);
                    
                    // Update feedback text
                    if (calculatedRating <= 3) {
                      setRatingFeedback('FOOD POISONING.');
                    } else if (calculatedRating <= 5) {
                      setRatingFeedback('Edible, I guess.');
                    } else if (calculatedRating <= 7) {
                      setRatingFeedback('Pretty decent!');
                    } else if (calculatedRating <= 9) {
                      setRatingFeedback('Delicious!');
                    } else {
                      setRatingFeedback('MICHELIN STAR!');
                    }
                  }}
                >
                  <View style={styles.sliderTrack} />
                  
                  <Animated.View
                    style={[
                      styles.tomatoContainer,
                      { 
                        left: tomatoPosition,
                        transform: [{ scale: tomatoScale }],
                      }
                    ]}
                    hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                    {...panResponder.panHandlers}
                  >
                    <Image 
                      source={require('../assets/tomato1.png')} 
                      style={styles.tomatoImage} 
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.ratingFeedback}>{ratingFeedback}</Text>
              
              <TouchableOpacity 
                style={styles.submitRatingButton}
                onPress={handleRating}
              >
                <Text style={styles.submitRatingText}>SUBMIT</Text>
              </TouchableOpacity>
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
      
      {/* Photo Select/Capture Modal */}
      <Modal visible={photoModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.photoModalContent}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            
            <View style={styles.photoOptions}>
              <TouchableOpacity 
                style={styles.photoOptionButton}
                onPress={takePhoto}
                disabled={uploadingPhoto}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="camera" size={32} color="#FF8C29" />
                </View>
                <Text style={styles.photoOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoOptionButton}
                onPress={pickImage}
                disabled={uploadingPhoto}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="images" size={32} color="#FF8C29" />
                </View>
                <Text style={styles.photoOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
            
            {uploadingPhoto && (
              <ActivityIndicator size="large" color="#FF8C29" style={styles.uploadingIndicator} />
            )}
            
            <Button 
              title="Cancel" 
              onPress={() => setPhotoModalVisible(false)} 
              color="red"
              disabled={uploadingPhoto}
            />
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
  localPhoto: {
    borderWidth: 2,
    borderColor: '#FF8C29',
  },
  addPhotoButton: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 140, 41, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FF8C29',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    color: '#FF8C29',
    marginTop: 5,
    fontWeight: '500',
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
  photoModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
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
  photoOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  photoOptionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  photoOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoOptionText: {
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
  },
  uploadingIndicator: {
    marginVertical: 15,
  },
  // Survey Modal Styles
  surveyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveyModalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FAF9F6',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
  },
  surveyCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveyHeader: {
    width: '100%',
    backgroundColor: '#9B9C68',
    padding: 30,
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surveyHallName: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '500',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  surveyBody: {
    width: '100%',
    padding: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  surveyLabel: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FF8C29',
    marginBottom: 50,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    marginBottom: 60,
    position: 'relative',
    alignSelf: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 12,
    backgroundColor: '#DBD0E8',
    borderRadius: 6,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sliderTouchable: {
    flex: 1,
    width: '100%',
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 25,
  },
  tomatoContainer: {
    position: 'absolute',
    top: -22,
    width: 50,
    height: 50,
    marginLeft: -25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tomatoImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  ratingFeedback: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 60,
    textAlign: 'center',
    color: '#EF8354',
  },
  submitRatingButton: {
    backgroundColor: '#FF8C29',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 20,
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default DiningHallDetailScreen;
