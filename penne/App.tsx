import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedScreen from './screens/FeedScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileStack from './screens/ProfileStack';
import HomeStack from './screens/HomeStack';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AuthStackScreen from './screens/AuthStack';

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
    return (
      <NavigationContainer>
        <AuthStackScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
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

            return (
              <View style={{
                backgroundColor: focused ? '#fed7aa' : 'transparent',
                borderRadius: 12,
                padding: 5,
                width: size + 10,
                height: size + 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name={iconName} size={size - 2} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: '#E28D61', // Orange color to match the app theme
          tabBarInactiveTintColor: '#8c8c8c',
          tabBarShowLabel: false, // This removes the text labels from the footer tabs
          headerShown: false, // This removes headers from all tab screens
          tabBarStyle: {
            backgroundColor: '#fef8f0',
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            width: '100%',
            borderRadius: 20,
            marginBottom: 0,
            position: 'absolute',
            shadowColor: '#000',
            shadowOffset: { 
              width: 0, 
              height: 2 
            },
            shadowOpacity: 0.8,
            shadowRadius: 5,
          },
          tabBarItemStyle: {
            marginTop: 5,
            padding: 5,
          }
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} initialParams={{ session }} />
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} initialParams={{ session }} />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStack}
          initialParams={{ session }}
          options={{ title: "" }}
        /> 
      </Tab.Navigator>
    </NavigationContainer>
  );
}
//() => <ProfileScreen session={session}/>
