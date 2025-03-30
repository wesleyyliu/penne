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
        
        // Query the menus table for items matching the dining hall name
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('dining_hall_name', hallName);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setMenuItems(data);
        }
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
        
        // Update vote tracking (do this immediately)
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
        
        // Wait for all database updates to complete
        await Promise.all(promises);
      }
    } catch (err) {
      console.error('Error handling upvote:', err);
      // Revert optimistic update on error
      // Consider refreshing data from server here
    }
  };

  // Function to handle downvoting a dish
  const handleDownvote = async (itemId: number) => {
    try {
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
        
        // Update vote tracking (do this immediately)
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
        
        // Wait for all database updates to complete
        await Promise.all(promises);
      }
    } catch (err) {
      console.error('Error handling downvote:', err);
      // Revert optimistic update on error
    }
  };

  // // Optional: Load user's previous votes when component mounts
  // useEffect(() => {
  //   const loadUserVotes = async () => {
  //     if (!session?.user) return;
      
  //     try {
  //       const { data, error } = await supabase
  //         .from('user_votes')
  //         .select('dish_id, vote_type')
  //         .eq('user_id', session.user.id);
          
  //       if (error) throw error;
        
  //       if (data) {
  //         // Convert array to object format for our userVotes state
  //         const votesMap: Record<number, {upvoted: boolean, downvoted: boolean}> = {};
  //         data.forEach(vote => {
  //           votesMap[vote.dish_id] = {
  //             upvoted: vote.vote_type === 'upvote',
  //             downvoted: vote.vote_type === 'downvote'
  //           };
  //         });
  //         setUserVotes(votesMap);
  //       }
  //     } catch (err) {
  //       console.error('Error loading user votes:', err);
  //     }
  //   };
    
  //   loadUserVotes();
  // }, [session]);

  return (
    <ScrollView style={styles.container}>
      {/* Header with Image */}
      <View style={styles.headerContainer}>
        <Image source={{ uri: 'https://via.placeholder.com/500x250' }} style={styles.headerImage} />

        {/* Floating Icons */}
        <View style={styles.floatingIcons}>
          <TouchableOpacity>
            <Ionicons name="camera-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={24} color="black" />
          </TouchableOpacity>
          {/* 🔥 Open Survey Popup when clicking the Plus Icon */}
          <TouchableOpacity onPress={() => setSurveyVisible(true)}>
            <Ionicons name="add-circle-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dining Hall Title */}
      <View style={styles.contentContainer}>
        <Text style={styles.header}>{hallName}</Text>

        {/* User Photos Section */}
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
        />

        {/* Menu Section */}
        <Text style={styles.sectionTitle}>Menu</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : menuItems.length > 0 ? (
          <View>
            {menuItems.map((dish, index) => (
              <View key={index} style={styles.menuItem}>
                <View style={styles.menuItemDetails}>
                  <Text style={styles.menuText}>{dish.dish}</Text>
                  <Text style={styles.menuSubtext}>{dish.meal_type} • {dish.station}</Text>
                </View>
                <View style={styles.reactions}>
                  <TouchableOpacity onPress={() => handleUpvote(dish.id)}>
                    <Text style={[
                      styles.like, 
                      userVotes[dish.id]?.upvoted ? styles.activeVote : null
                    ]}>
                      ❤️ {dish.dish_upvote}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDownvote(dish.id)}>
                    <Text style={[
                      styles.dislike,
                      userVotes[dish.id]?.downvoted ? styles.activeVote : null
                    ]}>
                      👎 {dish.dish_downvote}
                    </Text>
                  </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#fff' },

  // Header Styles
  headerContainer: { position: 'relative' },
  headerImage: { width: '100%', height: 200 },
  floatingIcons: {
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 15,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
  },

  // Content Styles
  contentContainer: { padding: 16, marginTop: 20 },
  header: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 8, textAlign: 'center' },

  // Photos Section
  photoWrapper: { marginRight: 10 },
  photo: { width: 80, height: 80, borderRadius: 10 },

  // Menu Section
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  menuItemDetails: {
    flex: 1,
  },
  menuText: { fontSize: 16 },
  menuSubtext: {
    fontSize: 12, 
    color: 'gray',
    marginTop: 2,
  },
  reactions: { flexDirection: 'row' },
  like: { marginRight: 15, color: 'black' },
  dislike: { color: 'black' },
  activeVote: { fontWeight: 'bold', color: '#0066cc' },

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
