import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, Image, Alert, ActivityIndicator } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { RouteProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import * as ImagePicker from 'expo-image-picker'

type ChangePhotoScreenRouteProp = RouteProp<{ params: { session: Session } }, 'params'>

// Import the imageCache if it's not exported from Avatar.tsx
const imageCache = new Map<string, string>();

export default function ChangePhotoScreen({ navigation }: { navigation: any }) {
  const route = useRoute<ChangePhotoScreenRouteProp>()
  const { session } = route.params
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      getProfile()
    }
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      
      if (data?.avatar_url) {
        await downloadImage(data.avatar_url)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      Alert.alert('Error', 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  async function downloadImage(path: string) {
    try {
      // Check if the image is already in cache
      if (imageCache.has(path)) {
        setAvatarUrl(imageCache.get(path) || '');
        return;
      }
      
      // If the url already contains base64 data, use it directly
      if (path.startsWith('data:')) {
        setAvatarUrl(path);
        imageCache.set(path, path);
        return;
      }

      const { data, error } = await supabase.storage.from('avatars').download(path)

      if (error) {
        throw error
      }

      const fr = new FileReader()
      fr.readAsDataURL(data)
      fr.onload = () => {
        const dataUrl = fr.result as string;
        setAvatarUrl(dataUrl);
        // Cache the image URL to avoid downloading again
        imageCache.set(path, dataUrl);
      }
    } catch (error) {
      console.error('Error downloading image:', error)
      throw error
    }
  }

  async function uploadAvatar() {
    try {
      setUploading(true)

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 0.4, // More aggressive compression
        maxWidth: 500, // Limit dimensions
        maxHeight: 500,
        aspect: [1, 1],
        exif: false,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.')
        return
      }

      const image = result.assets[0]
      console.log('Got image', image)

      if (!image.uri) {
        throw new Error('No image uri!')
      }

      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer())

      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg'
      const path = `${Date.now()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        })

      if (uploadError) {
        throw uploadError
      }

      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.path })
        .eq('id', session?.user.id)

      if (updateError) {
        throw updateError
      }

      // Download and set the new avatar
      await downloadImage(data.path)
      Alert.alert('Success', 'Profile photo updated successfully!')
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message)
      } else {
        throw error
      }
    } finally {
      setUploading(false)
    }
  }

  async function removeAvatar() {
    try {
      setUploading(true)
      
      if (!session?.user) return

      // Update the user's profile to clear the avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', session.user.id)

      if (error) throw error

      setAvatarUrl('')
      Alert.alert('Success', 'Profile photo removed successfully!')
    } catch (error) {
      console.error('Error removing profile photo:', error)
      Alert.alert('Error', 'Failed to remove profile photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#787b46" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROFILE PHOTO</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mainContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#787b46" />
            </View>
          ) : (
            <>
              <View style={styles.photoContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={60} color="#9ca3af" />
                  </View>
                )}
              </View>

              <Text style={styles.helpText}>
                Your profile photo will be visible on your PenneCard and profile page.
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={uploadAvatar}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {avatarUrl && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={removeAvatar}
                    disabled={uploading}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E28D61" style={styles.buttonIcon} />
                    <Text style={styles.removeButtonText}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fef8f0',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#787b46',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textTransform: 'uppercase',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    marginBottom: 30,
  },
  avatarImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  helpText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 30,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E28D61',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '80%',
    marginBottom: 16,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E28D61',
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '80%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E28D61',
  },
  buttonIcon: {
    marginRight: 8,
  },
}); 