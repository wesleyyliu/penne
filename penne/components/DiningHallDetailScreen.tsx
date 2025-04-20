import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, Button, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

// Define types for menu data
interface MenuItem {
  id: number;
  dish: string;
  dish_upvote: number;
  dish_downvote: number;
  meal_type: string;
  station: string;
}

const userPhotos = [
  { id: 'p1', uri: 'https://via.placeholder.com/100' },
  { id: 'p2', uri: 'https://via.placeholder.com/100' },
  { id: 'p3', uri: 'https://via.placeholder.com/100' },
  { id: 'p4', uri: 'https://via.placeholder.com/100' },
];

type RouteParams = {
  params: {
    hallName: string;
    session: any;
  };
};

const DiningHallDetailScreen = ({ route }: { route: RouteProp<RouteParams, 'params'> }) => {
  const { hallName, session } = route.params;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state to track user votes
  const [userVotes, setUserVotes] = useState<Record<number, {upvoted: boolean, downvoted: boolean}>>({});

  // 🔥 State for Survey Modal & Rating
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [rating, setRating] = useState(5); // Default rating is 5

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

    // Function to handle downvoting a dish
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

  return (
    <ScrollView style={styles.container}>
      {/* Header with Image */}
      <View style={styles.headerContainer}>
        <Image source={require('../assets/quaker_kitchen.jpg')} style={styles.headerImage} />

        {/* Floating Icons */}
        <View style={styles.floatingIcons}>
          <TouchableOpacity>
            <Ionicons name="camera-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={24} color="white" />
          </TouchableOpacity>
          {/* 🔥 Open Survey Popup when clicking the Plus Icon */}
          <TouchableOpacity onPress={() => setSurveyVisible(true)}>
            <Ionicons name="add-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dining Hall Title */}
      <View style={styles.contentContainer}>
        <Text style={styles.header}>{hallName}</Text>

        {/* User Photos Section
        <Text style={styles.sectionTitle}>Photos from Penne members</Text>
        <FlatList
          horizontal
          data={userPhotos}
          keyExtractor={(photo) => photo.id}
          renderItem={({ item }) => (
            <View style={styles.photoWrapper}>
              <Image source={{ uri: item.uri }} style={styles.photo} />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        /> */}

        {/* Menu Section */}
        <Text style={styles.sectionTitle}>Menu</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : menuItems.length > 0 ? (
          <View style={styles.menuContainer}>
            {menuItems.map((dish, index) => (
              <View key={index} style={styles.menuItem}>
                <View style={styles.menuItemDetails}>
                  <Text style={styles.menuText}>{dish.dish}</Text>
                  <Text style={styles.menuSubtext}>{dish.meal_type} • {dish.station}</Text>
                </View>
                <View style={styles.reactions}>
                  <View style={styles.reactionContainer}>
                    <TouchableOpacity 
                      onPress={() => handleUpvote(dish.id)}
                      style={styles.reactionButtonLeft}
                    >
                      <Ionicons 
                        name={userVotes[dish.id]?.upvoted ? "heart" : "heart-outline"} 
                        size={18} 
                        color={userVotes[dish.id]?.upvoted ? "#E28D61" : '#8c9657'} 
                      />
                      <Text style={[
                        styles.like, 
                        userVotes[dish.id]?.upvoted ? styles.activeVote : null
                      ]}>
                        {dish.dish_upvote}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.divider} />
                    
                    <TouchableOpacity 
                      onPress={() => handleDownvote(dish.id)}
                      style={styles.reactionButtonRight}
                    >
                      <Ionicons 
                        name={userVotes[dish.id]?.downvoted ? "thumbs-down" : "thumbs-down-outline"} 
                        size={18} 
                        color={userVotes[dish.id]?.downvoted ? "#E28D61" : '#8c9657'} 
                      />
                      <Text style={[
                        styles.dislike,
                        userVotes[dish.id]?.downvoted ? styles.activeVote : null
                      ]}>
                        {dish.dish_downvote}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noMenu}>No menu available</Text>
        )}
      </View>

      {/* SURVEY POPUP WITH SLIDER */}
      <Modal visible={surveyVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate {hallName}</Text>

            {/* Custom Slider */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${(rating / 10) * 100}%` }, // Dynamically move thumb
                  ]}
                />
              </View>

              {/* Rating number display */}
              <Text style={styles.ratingText}>{rating}/10</Text>

              {/* Slider Interaction (Touchable) */}
              <View style={styles.sliderTouchArea}>
                {[...Array(11)].map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.sliderTouch}
                    onPress={() => setRating(i)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setSurveyVisible(false)} color="red" />
              <Button
                title="Submit"
                onPress={() => {
                  console.log(`Submitted rating: ${rating}/10`);
                  handleRating();
                  setSurveyVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef8f0' },

  // Header Styles
  headerContainer: { 
    position: 'relative',
    marginBottom: 10, // Add margin to ensure space for corners to be visible
  },
  headerImage: { 
    width: '100%', 
    height: 250,
  },
  floatingIcons: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 15,
    backgroundColor: '#ba9cba',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
    elevation: 5,
  },

  // Content Styles
  contentContainer: { 
    padding: 16, 
    backgroundColor: '#fef8f0',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40, // Pull up slightly to create overlap
    paddingTop: 35, // Increase padding to accommodate icons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // For Android
  },
  header: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 8, textAlign: 'left', marginLeft: 16 },

  // Photos Section
  photoWrapper: { marginRight: 10 },
  photo: { width: 80, height: 80, borderRadius: 10 },

  // Menu Section
  menuContainer: {
    paddingBottom: 50, // Add padding at the bottom of the menu
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  menuItemDetails: {
    flex: 1,
  },
  menuText: { 
    fontSize: 16,
    fontWeight: '500',
    color: '#55574B',
  },
  menuSubtext: {
    fontSize: 12, 
    color: 'gray',
    marginTop: 2,
  },
  reactions: { 
    flexDirection: 'row',
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebdeb0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  reactionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reactionButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: '#c8b56f',
  },
  like: { 
    marginLeft: 5,
    fontWeight: '500',
    color: '#8c9657',
  },
  dislike: { 
    marginLeft: 5,
    fontWeight: '500',
    color: '#8c9657',
  },
  activeVote: { 
    fontWeight: 'bold', 
    color: '#E28D61'
  },

  // No Menu Text Style
  noMenu: { fontSize: 16, textAlign: 'center', marginVertical: 10, color: 'gray' },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },

  // Slider Styles
  sliderContainer: { alignItems: 'center', marginBottom: 20 },
  sliderTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 3,
    position: 'relative',
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'blue',
    position: 'absolute',
    top: -7,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    color: 'blue',
  },
  sliderTouchArea: { flexDirection: 'row', width: '100%', height: 30, position: 'absolute' },
  sliderTouch: { flex: 1 },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },

  // New or updated styles
  loader: {
    marginVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default DiningHallDetailScreen;
