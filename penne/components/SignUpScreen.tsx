import React, { useState } from 'react'
import { Alert, StyleSheet, View, Image, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useFonts } from 'expo-font';

export default function SignUpScreen({ navigation }: { navigation: any }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fontsLoaded] = useFonts({
    'Kumbh-Sans': require('../assets/fonts/Kumbh-Sans.ttf'),
    'OPTICenturyNova': require('../assets/fonts/OPTICenturyNova.otf'),
  });

  async function signUpWithEmail() {
    if (!fullName || !username || !email || !password) {
      Alert.alert('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      // First check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is what we want
        throw checkError
      }
      
      if (existingUser) {
        Alert.alert('Username already exists. Please choose another username.')
        setLoading(false)
        return
      }
      
      // Sign up with Supabase Auth
      const {
        data: { session, user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          }
        }
      })

      console.log('Sign up response:', {
        user: user,
        session: session,
        userMetadata: user?.user_metadata,
        appMetadata: user?.app_metadata
      })

      if (signUpError) throw signUpError
      
      if (!session) {
        // This is expected if email confirmation is required
        Alert.alert(
          'Please check your inbox for email verification!',
          '',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        )
        // The database trigger will handle creating the profile
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#787b46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>YOUR ACCOUNT</Text>
          <View style={{ width: 28 }} />
        </View>
        
        <View style={styles.authCard}>
          <Input
            onChangeText={(text) => setUsername(text)}
            value={username}
            placeholder="Username"
            autoCapitalize={'none'}
            containerStyle={styles.inputField}
            inputStyle={{...styles.inputText, paddingLeft: 15}}
            inputContainerStyle={{ 
              borderBottomWidth: 0,
              height: 50,
              justifyContent: 'center'
            }}
            placeholderTextColor="#C0ABC0"
          />
          
          <Input
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="Email"
            autoCapitalize={'none'}
            containerStyle={styles.inputField}
            inputStyle={{...styles.inputText, paddingLeft: 15}}
            inputContainerStyle={{ 
              borderBottomWidth: 0,
              height: 50,
              justifyContent: 'center'
            }}
            placeholderTextColor="#C0ABC0"
          />
          
          <View style={styles.nameInputRow}>
            <Input
              onChangeText={(text) => setFullName(text)}
              value={fullName}
              placeholder="Name"
              containerStyle={styles.inputField}
              inputStyle={{...styles.inputText, paddingLeft: 15}}
              inputContainerStyle={{ 
                borderBottomWidth: 0,
                height: 50,
                justifyContent: 'center'
              }}
              placeholderTextColor="#C0ABC0"
            />
          </View>
          
          <Input
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="Password"
            autoCapitalize={'none'}
            containerStyle={styles.inputField}
            inputStyle={{...styles.inputText, paddingLeft: 15}}
            inputContainerStyle={{ 
              borderBottomWidth: 0,
              height: 50,
              justifyContent: 'center'
            }}
            placeholderTextColor="#C0ABC0"
          />
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={() => signUpWithEmail()}
            disabled={loading}
          >
            <Ionicons name="chevron-forward" size={28} color="#787b46" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fef8f0',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#787b46',
    fontFamily: 'OPTICenturyNova',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  backButton: {
    padding: 2,
  },
  authCard: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#C0ABC0', 
    borderRadius: 50,
    marginVertical: 10,
    paddingHorizontal: 10,
    height: 50,
  },
  nameInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputText: {
    color: '#C0ABC0',
    fontSize: 16,
  },
  submitButton: {
    padding: 2,
    marginTop: 20,
    alignSelf: 'flex-end',
  },
})