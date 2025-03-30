import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../screens/types'; 

type DiningHallsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DiningHallsScreen'
>;

const diningHalls = [
  { id: '1', name: '1920 Commons' },
  { id: '2', name: 'Hill House' },
  { id: '3', name: 'Kings Court English House' },
  { id: '4', name: 'Falk Dining Commons' },
  { id: '5', name: 'Lauder College House' },
  { id: '6', name: 'Quaker Kitchen' },
];

const DiningHallsScreen = () => {
  const navigation = useNavigation<DiningHallsScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dining Halls</Text>
      <FlatList
        data={diningHalls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('DiningHallDetail', { hallName: item.name })}
          >
            <Text style={styles.text}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  item: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    borderRadius: 8,
  },
  text: { fontSize: 18 },
});

export default DiningHallsScreen;
