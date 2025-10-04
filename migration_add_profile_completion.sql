-- Migration: Add phone_number and profile completion tracking
-- Created: 2025-10-04

-- 1. profiles 테이블에 새 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS kakao_nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;

-- 2. avatar_url 컬럼 제거 (더 이상 사용하지 않음)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;

-- 3. 기존 데이터를 profile_completed = true로 업데이트 (이미 이름이 있는 경우)
UPDATE public.profiles 
SET is_profile_completed = TRUE 
WHERE name IS NOT NULL AND name != '';

-- 4. 새 사용자 프로필 자동 생성 함수 업데이트
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, kakao_nickname, kakao_id, is_profile_completed)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nickname',
    CASE 
      WHEN NEW.raw_user_meta_data->>'provider_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'provider_id')::BIGINT
      ELSE NULL
    END,
    FALSE  -- 추가 정보 입력 필요
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
