import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../components/ProfileScreen';
import EditProfileScreen from '../components/EditProfileScreen';
import { Session } from '@supabase/supabase-js'

const Stack = createStackNavigator();

function ProfileStack({ session }: { session: Session }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} initialParams={{ session }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} initialParams={{ session }} />
    </Stack.Navigator>
  );
}

export default ProfileStack;