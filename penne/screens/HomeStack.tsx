import React from 'react'
import DiningHallsScreen from '../components/DiningHallsScreen';
import DiningHallDetailScreen from '../components/DiningHallDetailScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

// Define the route type for the initial screen
type HomeRouteProps = RouteProp<{ params: { session?: Session } }, 'params'>;

function HomeStack() {
  const route = useRoute<HomeRouteProps>();
  const session = route.params?.session;
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // removes the page name on top across all screens in this stack
      }}
    >
      <Stack.Screen 
        name="DiningHallsScreen" 
        component={DiningHallsScreen} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="DiningHallDetail" 
        component={DiningHallDetailScreen} 
        initialParams={{ session: undefined }} 
      />
    </Stack.Navigator>
  );
}

export default HomeStack;