import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState, Image } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'

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

export default function Auth() {
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

  async function signUpWithEmail() {
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    if (!session) Alert.alert('Please check your inbox for email verification!')
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: '/Users/wesleyliu/penne/penne/assets/Penne Logo_processed.png' }} // Add your image URL here
        style={styles.image} // Apply styles for the image
      />
      <View style={[styles.verticallySpaced, styles.mt20, styles.inputContainer]}>
        <Input
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
          containerStyle={styles.inputField} // Apply styles for the input field
          inputStyle={styles.inputText} // Apply styles for the text input
          placeholderTextColor="#ffffff"
          underlineColorAndroid="transparent"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.inputContainer]}>
        <Input
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
          containerStyle={styles.inputField} // Apply styles for the input field
          inputStyle={styles.inputText} // Apply styles for the text input
          placeholderTextColor="#ffffff"
          underlineColorAndroid="transparent"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title="Sign in" 
          disabled={loading} 
          onPress={() => signInWithEmail()} 
          buttonStyle={styles.button} // Apply styles for the button
          titleStyle={styles.buttonTitle} // Apply styles for the button title
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Button 
          title="Sign up" 
          disabled={loading} 
          onPress={() => signUpWithEmail()} 
          buttonStyle={styles.button} // Apply styles for the button
          titleStyle={styles.buttonTitle} // Apply styles for the button title
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Allow the container to take full height
    justifyContent: 'center', // Center items vertically
    alignItems: 'center', // Center items horizontally
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  image: {
    width: '100%', // Set width as needed
    height: 200, // Set height as needed
    resizeMode: 'cover', // Adjust the image scaling
    marginBottom: 20, // Add some space below the image
  },
  inputContainer: {
    alignItems: 'center', // Center input fields
    borderWidth: 1, // Add border
    borderColor: '#ccc', // Border color
    borderRadius: 50, // Rounded corners
    backgroundColor: '#fc8c58', // Background color
    padding: 30, // Padding inside the container
    marginBottom: 20,
  },
  inputField: {
    backgroundColor: '#fc8c58', // Background color for input fields
    borderRadius: 50, // Rounded corners
  },
  button: {
    backgroundColor: '#524134', // Change to your desired button color
    borderRadius: 25, // Rounded corners
    paddingVertical: 10, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
  },
  buttonTitle: {
    color: '#FFFFFF', // Change to your desired text color
    fontWeight: 'bold', // Optional: make the text bold
  },
  inputText: {
    color: '#ffffff', // Change to your desired text color
  },
})