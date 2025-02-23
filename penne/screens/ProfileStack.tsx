import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../components/ProfileScreen';
import EditProfileScreen from '../components/EditProfileScreen';
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'

const Stack = createStackNavigator();

function ProfileStack() {
const route = useRoute()
const { session } = route.params
  return (
    <Stack.Navigator>
      <Stack.Screen name="ViewProfile" component={ProfileScreen} options={{ title: 'Profile' }} initialParams={{ session }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} initialParams={{ session }} />
    </Stack.Navigator>
  );
}

export default ProfileStack;