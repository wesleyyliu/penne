import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState, Image, Text, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'
import CheckerboardBackground from './CheckerboardBackground'

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  function navigateToSignUp() {
    navigation.navigate('SignUp')
  }

  return (
    <CheckerboardBackground>
      <View style={styles.container}>
        <View style={styles.authCard}>
          <Image 
            source={require('../assets/penne_logo.png')}
            style={styles.logo}
          />
          
          <Input
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="Username"
            autoCapitalize={'none'}
            containerStyle={styles.inputField}
            inputStyle={styles.inputText}
            placeholderTextColor="#B8B8B8"
          />
          
          <Input
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="Password"
            autoCapitalize={'none'}
            containerStyle={styles.inputField}
            inputStyle={styles.inputText}
            placeholderTextColor="#B8B8B8"
          />
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
          
          <Button 
            title="Log In" 
            disabled={loading} 
            onPress={() => signInWithEmail()} 
            buttonStyle={styles.loginButton}
            titleStyle={styles.buttonTitle}
            containerStyle={styles.buttonContainer}
          />
          
          <View style={styles.signupContainer}>
            <Text style={styles.noAccountText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigateToSignUp()}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </CheckerboardBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    height: '70%',
    backgroundColor: '#fef8f0',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 275,
    height: 150,
    resizeMode: 'contain',
    marginTop: 30,
    marginBottom: 10,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 50,
    marginVertical: 10,
    paddingHorizontal: 10,
    height: 50,
  },
  inputText: {
    color: '#333',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#f8ab7f', 
    fontSize: 14,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#f8ab7f', 
    borderRadius: 30,
    paddingVertical: 15,
  },
  buttonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  noAccountText: {
    color: '#666',
    marginRight: 5,
  },
  signupText: {
    color: '#f8ab7f',
    fontWeight: 'bold',
  },
})