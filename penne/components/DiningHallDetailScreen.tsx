import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, Button } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RouteProp } from '@react-navigation/native';

const diningHallMenus: { [key: string]: { name: string; likes: number; dislikes: number }[] } = {
  '1920 Commons': [
    { name: 'Pizza', likes: 220, dislikes: 50 },
    { name: 'Pasta', likes: 180, dislikes: 40 },
    { name: 'Salad', likes: 150, dislikes: 30 },
  ],
  'Hill House': [
    { name: 'Burgers', likes: 250, dislikes: 60 },
    { name: 'Fries', likes: 300, dislikes: 70 },
    { name: 'Grilled Chicken', likes: 220, dislikes: 50 },
  ],
  'Quaker Kitchen': [
    { name: 'Mango-glazed chicken thigh', likes: 200, dislikes: 100 },
    { name: 'Vegan Tacos', likes: 180, dislikes: 40 },
    { name: 'Lentil Soup', likes: 160, dislikes: 30 },
    { name: 'Rice Bowls', likes: 200, dislikes: 50 },
  ],
};

const userPhotos = [
  { id: 'p1', uri: 'https://via.placeholder.com/100' },
  { id: 'p2', uri: 'https://via.placeholder.com/100' },
  { id: 'p3', uri: 'https://via.placeholder.com/100' },
  { id: 'p4', uri: 'https://via.placeholder.com/100' },
];

type RouteParams = {
  params: {
    hallName: string;
  };
};

const DiningHallDetailScreen = ({ route }: { route: RouteProp<RouteParams, 'params'> }) => {
  const { hallName } = route.params;
  const menuItems = diningHallMenus[hallName] || [];

  // 🔥 State for Survey Modal & Rating
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [rating, setRating] = useState(5); // Default rating is 5

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
        {menuItems.length > 0 ? (
          menuItems.map((dish, index) => (
            <View key={index} style={styles.menuItem}>
              <Text style={styles.menuText}>{dish.name}</Text>
              <View style={styles.reactions}>
                <TouchableOpacity>
                  <Text style={styles.like}>❤️ {dish.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.dislike}>👎 {dish.dislikes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  menuText: { fontSize: 16 },
  reactions: { flexDirection: 'row' },
  like: { marginRight: 15, color: 'black' },
  dislike: { color: 'black' },

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
});

export default DiningHallDetailScreen;
