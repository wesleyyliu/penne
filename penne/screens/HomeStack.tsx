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
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // removes the page name on top across all screens in this stack
      }}
    >
      <Stack.Screen name="Dining Halls" component={DiningHallsScreen} initialParams={{ session }} />
      <Stack.Screen name="DiningHallDetail" component={DiningHallDetailScreen} initialParams={{ session }} />
    </Stack.Navigator>
  );
}

export default HomeStack;