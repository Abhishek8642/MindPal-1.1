import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          phone?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          phone?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          completed: boolean;
          priority: 'low' | 'medium' | 'high';
          category: string;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          category?: string;
          due_date?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          category?: string;
          due_date?: string | null;
        };
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          mood: number;
          emoji: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mood: number;
          emoji: string;
          notes?: string | null;
        };
        Update: {
          mood?: number;
          emoji?: string;
          notes?: string | null;
        };
      };
      voice_sessions: {
        Row: {
          id: string;
          user_id: string;
          transcript: string;
          ai_response: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          transcript: string;
          ai_response: string;
        };
        Update: {
          transcript?: string;
          ai_response?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark' | 'auto';
          language: string;
          voice_speed: 'slow' | 'normal' | 'fast';
          ai_personality: 'supportive' | 'professional' | 'friendly' | 'motivational';
          task_reminders: boolean;
          mood_reminders: boolean;
          daily_summary: boolean;
          email_notifications: boolean;
          data_sharing: boolean;
          analytics: boolean;
          voice_recordings: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: 'light' | 'dark' | 'auto';
          language?: string;
          voice_speed?: 'slow' | 'normal' | 'fast';
          ai_personality?: 'supportive' | 'professional' | 'friendly' | 'motivational';
          task_reminders?: boolean;
          mood_reminders?: boolean;
          daily_summary?: boolean;
          email_notifications?: boolean;
          data_sharing?: boolean;
          analytics?: boolean;
          voice_recordings?: boolean;
        };
        Update: {
          theme?: 'light' | 'dark' | 'auto';
          language?: string;
          voice_speed?: 'slow' | 'normal' | 'fast';
          ai_personality?: 'supportive' | 'professional' | 'friendly' | 'motivational';
          task_reminders?: boolean;
          mood_reminders?: boolean;
          daily_summary?: boolean;
          email_notifications?: boolean;
          data_sharing?: boolean;
          analytics?: boolean;
          voice_recordings?: boolean;
        };
      };
    };
  };
};