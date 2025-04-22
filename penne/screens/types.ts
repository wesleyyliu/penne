import { Session } from '@supabase/supabase-js';

// Main navigation stack params
export type RootStackParamList = {
    DiningHallsScreen: { session?: Session };
    DiningHallDetail: { hallName: string; rank: number; session?: Session };
    Feed: { diningHallName?: string; session?: Session };
  };

// Profile stack params
export type ProfileStackParamList = {
  ViewProfile: { session?: Session };
  EditProfile: { session?: Session };
  Settings: { session?: Session };
  AccountSettings: { session?: Session };
  ChangeEmail: { session?: Session };
  ChangeUsername: { session?: Session };
  ChangePassword: { session?: Session };
  ChangePhoto: { session?: Session };
  PrivacySettings: { session?: Session };
  NotificationsSettings: { session?: Session };
  HelpScreen: { session?: Session };
};
  