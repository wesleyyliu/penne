import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Alert, Image, Button, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

// Simple cache for avatar URLs to avoid repeated downloads
const imageCache = new Map<string, string>();

interface Props {
  size: number
  url: string | null
  onUpload: (filePath: string) => void
  upload: boolean
  isCircle?: boolean
}

export default function Avatar({ url, size = 150, onUpload, upload, isCircle = false }: Props) {
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarSize = { height: size, width: size }

  const borderRadius = isCircle ? size / 2 : 20

  useEffect(() => {
    if (url) {
      // Check if the image is already in cache
      if (imageCache.has(url)) {
        setAvatarUrl(imageCache.get(url) || null);
      } else {
        downloadImage(url);
      }
    }
  }, [url])

  async function downloadImage(path: string) {
    try {
      setLoading(true);
      
      // If the url already contains base64 data, use it directly
      if (path.startsWith('data:')) {
        setAvatarUrl(path);
        imageCache.set(path, path);
        return;
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .download(path)

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
      if (error instanceof Error) {
        console.log('Error downloading image: ', error.message)
      }
    } finally {
      setLoading(false);
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

      onUpload(data.path)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      } else {
        throw error
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <View>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          accessibilityLabel="Avatar"
          style={[avatarSize, styles.image, { borderRadius }]}
        />
      ) : (
        <View style={[avatarSize, styles.avatar, styles.noImage, { borderRadius }]}>
          {loading && <ActivityIndicator color="#fff" size="small" />}
        </View>
      )}
      {upload && (
        <View>
          <Button
            title={uploading ? 'Uploading ...' : 'Upload'}
            onPress={uploadAvatar}
            disabled={uploading || loading}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
    maxWidth: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    objectFit: 'cover',
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(200, 200, 200)',
  },
})