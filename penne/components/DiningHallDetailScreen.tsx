import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const diningHallMenus: { [key: string]: string[] } = {
  '1920 Commons': ['Pizza', 'Pasta', 'Salad'],
  'Hill House': ['Burgers', 'Fries', 'Grilled Chicken'],
  'English House': ['Fish & Chips', 'Soup', 'Veggie Stir-fry'],
  'Falk Kosher Dining': ['Kosher Steak', 'Falafel', 'Matzo Ball Soup'],
  'Lauder College House': ['BBQ Chicken', 'Mac & Cheese', 'Cornbread'],
  'Quaker Kitchen': ['Vegan Tacos', 'Lentil Soup', 'Rice Bowls'],
};

import { RouteProp } from '@react-navigation/native';

type RouteParams = {
  params: {
    hallName: string;
  };
};

const DiningHallDetailScreen = ({ route }: { route: RouteProp<RouteParams, 'params'> }) => {
  const { hallName } = route.params;
  const menuItems = diningHallMenus[hallName] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{hallName}</Text>
      <Text style={styles.subHeader}>Menu</Text>
      <FlatList
        data={menuItems}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.menuItem}>{item}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: 'gray' },
  menuItem: { fontSize: 18, padding: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' },
});

export default DiningHallDetailScreen;
