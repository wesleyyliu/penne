import React from 'react'
import DiningHallsScreen from '../components/DiningHallsScreen';
import DiningHallDetailScreen from '../components/DiningHallDetailScreen';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dining Halls" component={DiningHallsScreen} />
      <Stack.Screen name="DiningHallDetail" component={DiningHallDetailScreen} options={{ title: 'Dining Hall Details' }} />
    </Stack.Navigator>
  );
}

export default HomeStack;