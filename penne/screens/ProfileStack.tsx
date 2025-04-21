import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../components/ProfileScreen';
import EditProfileScreen from '../components/EditProfileScreen';
import SettingsScreen from '../components/SettingsScreen';
import AccountSettingsScreen from '../components/AccountSettingsScreen';
import PlaceholderSettingsScreen from '../components/PlaceholderSettingsScreen';
import ChangeEmailScreen from '../components/ChangeEmailScreen';
import ChangeUsernameScreen from '../components/ChangeUsernameScreen';
import ChangePasswordScreen from '../components/ChangePasswordScreen';
import ChangePhotoScreen from '../components/ChangePhotoScreen';
import { useRoute, RouteProp } from '@react-navigation/native'
import { Session } from '@supabase/supabase-js'
import { ProfileStackParamList } from './types';

// Define the route type for the initial screen
type ProfileRouteProps = RouteProp<{ params: { session?: Session } }, 'params'>;

const Stack = createStackNavigator<ProfileStackParamList>();

function ProfileStack() {
  const route = useRoute<ProfileRouteProps>();
  const session = route.params?.session;
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ViewProfile" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: 'Edit Profile' }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="AccountSettings" 
        component={AccountSettingsScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      
      {/* Account settings screens */}
      <Stack.Screen 
        name="ChangeEmail" 
        component={ChangeEmailScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="ChangeUsername" 
        component={ChangeUsernameScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="ChangePhoto" 
        component={ChangePhotoScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      
      {/* Placeholder screens for other settings features */}
      <Stack.Screen 
        name="PrivacySettings" 
        component={PlaceholderSettingsScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="NotificationsSettings" 
        component={PlaceholderSettingsScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
      <Stack.Screen 
        name="HelpScreen" 
        component={PlaceholderSettingsScreen} 
        options={{ headerShown: false }} 
        initialParams={{ session }} 
      />
    </Stack.Navigator>
  );
}

export default ProfileStack;