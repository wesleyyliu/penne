import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import Auth from '../components/Auth'
import SignUpScreen from '../components/SignUpScreen'

const AuthStack = createStackNavigator()

export default function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={Auth} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  )
}