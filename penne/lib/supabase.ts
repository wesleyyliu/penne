import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ipauncndlsorzwoiizqu.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwYXVuY25kbHNvcnp3b2lpenF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NzE1OTQsImV4cCI6MjA1NTE0NzU5NH0.XVKoC1Rdz5r7U_Hln_u49tZfR8n0b3H32aP8O0Mm5JA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})