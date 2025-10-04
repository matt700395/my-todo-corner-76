# 데이터베이스 설계 (ERD)

## 서비스 개요
Todo 관리 애플리케이션 - 카카오 소셜 로그인을 통해 인증하고 자신의 할 일 목록을 관리할 수 있는 서비스

---

## 1. 화면별 필요 데이터 분석

### 1.1 Auth 화면 (카카오 로그인)
**파일**: `src/pages/Auth.tsx`

**필요한 데이터**:
- 카카오 OAuth 로그인:
  - Supabase Auth를 통한 카카오 소셜 로그인
  - 로그인 성공 시 자동으로 사용자 프로필 생성
- 사용자 정보 (카카오에서 제공):
  - 이메일 (선택 항목)
  - 카카오 프로필 정보

**주요 기능**:
- 카카오 OAuth 로그인 버튼
- Supabase Auth 세션 관리
- 자동 회원가입 (첫 로그인 시)

---

### 1.2 Index 화면 (할 일 목록)
**파일**: `src/pages/Index.tsx`

**필요한 데이터**:
- 현재 로그인한 사용자 정보
  - 사용자 ID (id)
  - 사용자 이름 (name)
- 할 일 목록 (현재 사용자의 할 일만)
  - 할 일 ID (id)
  - 할 일 제목 (title)
  - 완료 여부 (completed)
  - 소유자 ID (userId)

**주요 기능**:
- 사용자별 할 일 필터링
- 할 일 추가
- 할 일 완료/미완료 토글
- 할 일 삭제

---

### 1.3 Profile 화면 (프로필 관리)
**파일**: `src/pages/Profile.tsx`

**필요한 데이터**:
- 사용자 정보
  - 사용자 ID (id)
  - 이메일 (email) - 읽기 전용
  - 이름 (name) - 수정 가능

**주요 기능**:
- 프로필 조회
- 이름 수정
- 로그아웃

---

### 1.4 AddTodoForm 컴포넌트
**파일**: `src/components/AddTodoForm.tsx`

**필요한 데이터**:
- 할 일 제목 입력 (title)

**주요 기능**:
- 새 할 일 생성

---

### 1.5 TodoItem 컴포넌트
**파일**: `src/components/TodoItem.tsx`

**필요한 데이터**:
- 할 일 ID (id)
- 할 일 제목 (title)
- 완료 여부 (completed)

**주요 기능**:
- 할 일 완료 상태 토글
- 할 일 삭제

---

## 2. 데이터베이스 테이블 설계

### 2.1 auth.users 테이블 (Supabase 관리)

**Supabase가 자동으로 관리하는 테이블** - 직접 생성할 필요 없음

카카오 OAuth 로그인 시 Supabase가 자동으로 사용자 레코드 생성

| 컬럼명 | 데이터 타입 | 설명 |
|--------|------------|------|
| id | UUID | 사용자 고유 식별자 (Supabase Auth에서 자동 생성) |
| email | VARCHAR | 카카오에서 제공한 이메일 (선택 동의 항목) |
| provider | VARCHAR | 'kakao' |
| raw_user_meta_data | JSONB | 카카오 프로필 정보 (닉네임, 프로필 이미지 등) |
| created_at | TIMESTAMP | 최초 로그인 일시 |
| last_sign_in_at | TIMESTAMP | 마지막 로그인 일시 |

**특징**:
- Supabase Auth가 완전히 관리
- 카카오 OAuth 연동 자동 처리
- 세션 관리 자동화

---

### 2.2 profiles 테이블 (사용자 프로필)

auth.users의 추가 정보를 저장하는 커스텀 테이블

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|---------|------|
| id | UUID | PRIMARY KEY, FOREIGN KEY | auth.users.id와 1:1 매핑 |
| name | VARCHAR(100) | | 사용자 이름/닉네임 (카카오에서 가져옴) |
| avatar_url | TEXT | | 프로필 이미지 URL (카카오에서 가져옴) |
| kakao_id | BIGINT | UNIQUE | 카카오 사용자 고유 ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 프로필 생성 일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 정보 수정 일시 |

**인덱스**:
- PRIMARY KEY: `id`
- UNIQUE INDEX: `kakao_id` (카카오 ID 중복 방지)

**외래키 제약조건**:
```sql
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
```
- auth.users가 삭제되면 profiles도 함께 삭제됨

---

### 2.3 todos 테이블 (할 일)

사용자의 할 일 목록을 저장하는 테이블

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|---------|------|
| id | UUID | PRIMARY KEY | 할 일 고유 식별자 |
| title | TEXT | NOT NULL | 할 일 제목/내용 |
| completed | BOOLEAN | NOT NULL, DEFAULT FALSE | 완료 여부 |
| user_id | UUID | NOT NULL, FOREIGN KEY | 소유자 (auth.users.id 참조) |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성 일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정 일시 |

**인덱스**:
- PRIMARY KEY: `id`
- INDEX: `user_id` (특정 사용자의 할 일 조회 성능 향상)
- COMPOSITE INDEX: `user_id, created_at DESC` (사용자별 최신순 정렬 조회)

**외래키 제약조건**:
```sql
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
```
- 사용자가 삭제되면 해당 사용자의 모든 할 일도 함께 삭제됨

---

## 3. 테이블 간 관계 (Entity Relationship)

### 3.1 auth.users ↔ profiles (1:1 관계)

```
auth.users (1) ───── (1) profiles
```

**관계 설명**:
- auth.users와 profiles는 1:1 관계
- profiles.id가 auth.users.id를 참조
- 카카오 로그인 시 auth.users가 먼저 생성되고, 트리거를 통해 profiles가 자동 생성됨

### 3.2 auth.users ↔ todos (1:N 관계)

```
auth.users (1) ─────< (N) todos
```

**관계 설명**:
- 한 명의 사용자(auth.users)는 **여러 개의 할 일(todos)**을 작성할 수 있습니다
- 각 할 일(todo)은 **반드시 한 명의 사용자**에게 소유됩니다
- `todos.user_id`가 `auth.users.id`를 참조하는 외래키

**비즈니스 규칙**:
1. 사용자는 자신이 소유한 할 일만 조회/수정/삭제할 수 있음 (RLS로 강제)
2. 사용자 삭제 시 해당 사용자의 모든 할 일이 함께 삭제됨 (CASCADE)
3. 할 일은 반드시 소유자가 있어야 함 (NOT NULL)

---

## 4. ERD 다이어그램

```
┌─────────────────────────────┐
│      auth.users             │  (Supabase 관리)
├─────────────────────────────┤
│ id (PK)            UUID     │
│ email              VARCHAR  │
│ provider           VARCHAR  │  = 'kakao'
│ raw_user_meta_data JSONB    │
│ created_at         TIMESTAMP│
│ last_sign_in_at    TIMESTAMP│
└─────────────────────────────┘
            │
            │ 1:1
            │
            ▼
┌─────────────────────────────┐
│       profiles              │  (커스텀 테이블)
├─────────────────────────────┤
│ id (PK,FK)         UUID     │──┐
│ name               VARCHAR  │  │ references
│ avatar_url         TEXT     │  │ auth.users.id
│ kakao_id           BIGINT   │  │ ON DELETE CASCADE
│ created_at         TIMESTAMP│  │
│ updated_at         TIMESTAMP│  │
└─────────────────────────────┘  │
            │                    │
            │                    │
            │ 1                  │
            │                    │
            │ has many           │
            │                    │
            │ N                  │
            ▼                    │
┌─────────────────────────────┐  │
│        todos                │  │
├─────────────────────────────┤  │
│ id (PK)            UUID     │  │
│ title              TEXT     │  │
│ completed          BOOLEAN  │  │
│ user_id (FK)       UUID     │──┘
│ created_at         TIMESTAMP│
│ updated_at         TIMESTAMP│
└─────────────────────────────┘

참고: profiles는 선택적이며, 
todos.user_id는 auth.users.id를 직접 참조할 수도 있음
```

---

## 5. Supabase + 카카오 로그인 구현

### 5.1 카카오 OAuth 설정

**Supabase 대시보드 설정**:
1. Authentication → Providers → Kakao 활성화
2. 카카오 개발자 센터에서 앱 생성
3. REST API 키와 Redirect URI 설정
   - Redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
4. Supabase에 카카오 Client ID와 Secret 입력

**카카오 개발자 센터 설정**:
- 내 애플리케이션 → 앱 설정 → 플랫폼
- Web 플랫폼 추가, 사이트 도메인 등록
- 제품 설정 → 카카오 로그인 활성화
- Redirect URI 등록
- 동의 항목 설정 (프로필 정보, 카카오계정 이메일)

---

### 5.2 Row Level Security (RLS) 정책

**profiles 테이블**:
```sql
-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**todos 테이블**:
```sql
-- 사용자는 자신의 할 일만 조회 가능
CREATE POLICY "Users can view own todos"
ON todos FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 생성 가능
CREATE POLICY "Users can create own todos"
ON todos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 수정 가능
CREATE POLICY "Users can update own todos"
ON todos FOR UPDATE
USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 삭제 가능
CREATE POLICY "Users can delete own todos"
ON todos FOR DELETE
USING (auth.uid() = user_id);
```

### 5.3 자동 프로필 생성 트리거

카카오 로그인 시 profiles 테이블에 자동으로 레코드 생성:

```sql
-- 새 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, kakao_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'nickname', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.raw_user_meta_data->>'provider_id')::BIGINT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. SQL 생성 예시 (Supabase)

### 6.1 profiles 테이블 생성

```sql
-- profiles 테이블 생성
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  avatar_url TEXT,
  kakao_id BIGINT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE UNIQUE INDEX profiles_kakao_id_idx ON public.profiles(kakao_id);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 새 사용자 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, kakao_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'nickname', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.raw_user_meta_data->>'provider_id')::BIGINT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

### 6.2 todos 테이블 생성

```sql
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_id 인덱스 (사용자별 할 일 조회 성능 향상)
CREATE INDEX todos_user_id_idx ON public.todos(user_id);

-- 사용자별 최신순 정렬을 위한 복합 인덱스
CREATE INDEX todos_user_id_created_at_idx ON public.todos(user_id, created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 6.3 RLS 활성화 및 정책 생성

```sql
-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- profiles 테이블 정책
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- todos 테이블 정책
CREATE POLICY "Users can view own todos"
ON public.todos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own todos"
ON public.todos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
ON public.todos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
ON public.todos FOR DELETE
USING (auth.uid() = user_id);
```

---

## 7. 카카오 로그인 플로우

### 프론트엔드 흐름

```
1. 사용자가 "카카오로 로그인" 버튼 클릭
   ↓
2. supabase.auth.signInWithOAuth({ provider: 'kakao' }) 호출
   ↓
3. 카카오 로그인 페이지로 리다이렉트
   ↓
4. 사용자가 카카오 계정으로 로그인 및 동의
   ↓
5. Supabase Redirect URI로 콜백
   ↓
6. Supabase가 auth.users에 사용자 생성 (최초 로그인 시)
   ↓
7. 트리거가 자동으로 profiles 레코드 생성
   ↓
8. 프론트엔드 앱으로 리다이렉트
   ↓
9. 세션 확인 후 메인 페이지 표시
```

### 백엔드 (Supabase) 자동 처리

- **auth.users**: 카카오 OAuth 정보 저장
- **profiles**: 트리거로 자동 생성
- **세션 관리**: JWT 토큰 자동 발급
- **RLS**: user_id 기반 접근 제어

---

## 8. 향후 확장 가능성

현재 설계는 기본적인 Todo 앱의 요구사항을 충족하지만, 다음과 같은 기능 추가를 고려할 수 있습니다:

### 7.1 할 일 카테고리/태그
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- todos 테이블에 category_id 추가
ALTER TABLE todos ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
```

### 7.2 할 일 우선순위
```sql
-- todos 테이블에 priority 추가
ALTER TABLE todos ADD COLUMN priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 3);
-- 0: 없음, 1: 낮음, 2: 보통, 3: 높음
```

### 7.3 할 일 마감일
```sql
-- todos 테이블에 due_date 추가
ALTER TABLE todos ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
```

### 7.4 할 일 메모/설명
```sql
-- todos 테이블에 description 추가
ALTER TABLE todos ADD COLUMN description TEXT;
```

### 7.5 할 일 공유 (협업)
```sql
CREATE TABLE todo_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(todo_id, shared_with_user_id)
);
```

---

## 9. 마이그레이션 권장사항

현재 프론트엔드는 `localStorage`를 사용하고 있으므로, Supabase + 카카오 OAuth로 마이그레이션 시:

1. **카카오 OAuth 설정**
   - 카카오 개발자 센터에서 앱 등록
   - Supabase에서 카카오 프로바이더 활성화
   - 추가 소셜 로그인 고려 (Google, GitHub 등)

2. **테이블 생성**
   - `profiles` 테이블 생성 (auth.users와 1:1)
   - `todos` 테이블 생성 (auth.users 참조)
   - RLS 정책 설정
   - 트리거 함수 설정 (자동 프로필 생성)

3. **프론트엔드 수정**
   - `localStorage` 호출을 Supabase 클라이언트 호출로 변경
   - 인증 상태 관리를 Supabase Auth로 변경
   - 카카오 로그인 버튼 구현
   - 실시간 구독 기능 추가 고려 (Realtime)

4. **데이터 보안**
   - RLS로 사용자별 데이터 격리
   - 프론트엔드 입력 검증
   - 세션 관리 자동화

---

## 10. 요약

### 핵심 테이블
1. **auth.users** - Supabase가 관리하는 사용자 인증 테이블 (카카오 OAuth)
2. **profiles** - 추가 사용자 정보 (auth.users와 1:1)
3. **todos** - 할 일 목록

### 핵심 관계
- `auth.users (1) ──── (1) profiles` : 사용자와 프로필 1:1 관계
- `auth.users (1) ─────< (N) todos` : 한 사용자는 여러 할 일을 가짐

### 주요 특징
- 카카오 소셜 로그인 (Supabase OAuth)
- 자동 프로필 생성 (트리거)
- 사용자별 데이터 격리 (RLS)
- 할 일의 소유권 명확화 (user_id)
- 데이터 무결성 보장 (외래키, CASCADE)
- 확장 가능한 설계

