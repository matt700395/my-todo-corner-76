import { createClient } from '@supabase/supabase-js'

// Vite에서는 import.meta.env를 사용합니다
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vjbndxtpxqopmqvndazk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYm5keHRweHFvcG1xdm5kYXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDIwNjksImV4cCI6MjA3NTExODA2OX0.p-NqeRfwOai1mqyl3gs1sN4gtsUHQCvkeTnNnmlInxg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export interface Profile {
  id: string
  name?: string
  phone_number?: string
  school?: string
  department?: string
  student_id?: string
  national_id?: string
  // 기존 카카오 관련 필드들 (호환성 유지)
  kakao_nickname?: string
  kakao_id?: number
  is_profile_completed: boolean
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}