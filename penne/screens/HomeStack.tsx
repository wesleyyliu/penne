import React from 'react'
import DiningHallsScreen from '../components/DiningHallsScreen';
import DiningHallDetailScreen from '../components/DiningHallDetailScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { useRoute } from '@react-navigation/native';

const Stack = createStackNavigator();

function HomeStack() {
  const route = useRoute()
  const { session } = route.params
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dining Halls" component={DiningHallsScreen} />
      <Stack.Screen name="DiningHallDetail" component={DiningHallDetailScreen} options={{ title: 'Dining Hall Details' }} initialParams={{ session }} />
    </Stack.Navigator>
  );
}

export default HomeStack;