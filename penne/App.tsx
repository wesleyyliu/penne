import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import FeedScreen from './screens/FeedScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileStack from './screens/ProfileStack';
import HomeStack from './screens/HomeStack';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

// ✅ Main App Function
export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!(session && session.user)) {
    return <Auth />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = '';

            if (route.name === 'Home') {
              iconName = 'home-outline';
            } else if (route.name === 'Feed') {
              iconName = 'list-outline';
            } else if (route.name === 'Leaderboard') {
              iconName = 'trophy-outline';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'blue',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} initialParams={{ session }}/>
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} initialParams={{ session }}/>
        <Tab.Screen 
          name="Profile" 
          component={ProfileStack}
          initialParams={{ session }}
          options={{ headerShown: false }} 
        /> 
      </Tab.Navigator>
    </NavigationContainer>
  );
}
//() => <ProfileScreen session={session}/>
