# TAA Archives - 기술 문서 (2/3)
## 구현 세부사항 및 코드 구조

### 1. 핵심 컴포넌트 구현

#### 1.1 메인 애플리케이션 (app.js)

**역할**: 전체 애플리케이션의 진입점 및 라우팅 관리

```javascript
// 주요 기능
- 화면 전환 관리 (라우터)
- Firebase 초기화
- 전역 상태 관리
- 이벤트 리스너 등록
- 실시간 데이터 구독
```

**핵심 메서드**:
- `initializeApp()`: Firebase 및 UI 초기화
- `showScreen()`: 화면 전환 로직
- `handleAuthStateChange()`: 인증 상태 변화 처리
- `setupEventListeners()`: 전역 이벤트 리스너 설정

#### 1.2 인증 서비스 (auth-service.js)

**역할**: 사용자 인증 및 권한 관리

```javascript
// 주요 기능
- 로그인/회원가입 처리
- 관리자 인증
- 사용자 정보 관리
- 보안등급 관리
- 세션 관리
```

**핵심 메서드**:
- `loginUser()`: 유연한 로그인 (Agent ID 또는 이메일)
- `registerUser()`: 회원가입 및 중복 확인
- `checkAdminAccess()`: 관리자 권한 확인
- `updateUserSecurityLevel()`: 보안등급 변경
- `blockUser()`: 사용자 차단

#### 1.3 파일 서비스 (file-service.js)

**역할**: 파일 업로드 및 관리

```javascript
// 주요 기능
- 이미지/문서 업로드
- 파일 메타데이터 관리
- Firebase Storage 연동
- 파일 접근 권한 제어
- 파일 삭제 및 수정
```

**핵심 메서드**:
- `uploadFile()`: 파일 업로드 및 메타데이터 저장
- `getFileUrl()`: 파일 다운로드 URL 생성
- `deleteFile()`: 파일 및 메타데이터 삭제
- `updateFileMetadata()`: 파일 정보 수정

#### 1.4 댓글 서비스 (comment-service.js)

**역할**: 실시간 댓글 시스템

```javascript
// 주요 기능
- 댓글 작성/수정/삭제
- 실시간 댓글 동기화
- 댓글 권한 관리
- 댓글 필터링
```

**핵심 메서드**:
- `addComment()`: 새 댓글 추가
- `updateComment()`: 댓글 수정
- `deleteComment()`: 댓글 삭제
- `subscribeToComments()`: 실시간 댓글 구독

### 2. UI 컴포넌트 구현

#### 2.1 부팅 시퀀스 (boot-sequence.js)

**역할**: 시스템 시작 애니메이션

```javascript
// 주요 기능
- 터미널 부팅 애니메이션
- 시스템 정보 표시
- 로딩 진행률 표시
- 부팅 완료 후 메인 화면 전환
```

**핵심 메서드**:
- `startBootSequence()`: 부팅 시퀀스 시작
- `displaySystemInfo()`: 시스템 정보 표시
- `simulateLoading()`: 로딩 시뮬레이션
- `completeBoot()`: 부팅 완료 처리

#### 2.2 터미널 효과 (terminal-effects.js)

**역할**: 터미널 시각 효과

```javascript
// 주요 기능
- CRT 모니터 효과
- 글리치 애니메이션
- 타이핑 효과
- 스캔라인 효과
```

**핵심 메서드**:
- `applyCRTEffect()`: CRT 모니터 효과 적용
- `createGlitchEffect()`: 글리치 효과 생성
- `typeWriterEffect()`: 타이핑 애니메이션
- `addScanlines()`: 스캔라인 효과

#### 2.3 위키 파서 (wiki-parser.js)

**역할**: 마크다운 콘텐츠 파싱

```javascript
// 주요 기능
- 마크다운 텍스트 파싱
- HTML 변환
- 링크 처리
- 이미지 렌더링
- 코드 블록 하이라이팅
```

**핵심 메서드**:
- `parseMarkdown()`: 마크다운 파싱
- `renderLinks()`: 링크 렌더링
- `processImages()`: 이미지 처리
- `highlightCode()`: 코드 하이라이팅

### 3. 데이터베이스 설계

#### 3.1 Firestore 컬렉션 구조

```javascript
// 사용자 컬렉션 (users)
{
  uid: "string",                    // Firebase Auth UID
  agentId: "string",               // Agent ID
  email: "string",                 // 이메일
  displayName: "string",           // 표시 이름
  securityLevel: "number",         // 보안등급 (1-5)
  isBlocked: "boolean",            // 차단 여부
  isAdmin: "boolean",              // 관리자 여부
  createdAt: "timestamp",          // 생성 시간
  lastLogin: "timestamp"           // 마지막 로그인
}

// 위키 페이지 컬렉션 (wiki_pages)
{
  id: "string",                    // 페이지 ID
  title: "string",                 // 제목
  content: "string",               // 마크다운 콘텐츠
  authorId: "string",              // 작성자 UID
  authorName: "string",            // 작성자 이름
  createdAt: "timestamp",          // 생성 시간
  updatedAt: "timestamp",          // 수정 시간
  securityLevel: "number",         // 접근 보안등급
  tags: ["array"],                 // 태그 배열
  viewCount: "number"              // 조회수
}

// 댓글 컬렉션 (comments)
{
  id: "string",                    // 댓글 ID
  pageId: "string",                // 페이지 ID
  content: "string",               // 댓글 내용
  authorId: "string",              // 작성자 UID
  authorName: "string",            // 작성자 이름
  createdAt: "timestamp",          // 작성 시간
  updatedAt: "timestamp",          // 수정 시간
  isEdited: "boolean"              // 수정 여부
}

// 파일 메타데이터 컬렉션 (files)
{
  id: "string",                    // 파일 ID
  fileName: "string",              // 파일명
  originalName: "string",          // 원본 파일명
  fileType: "string",              // 파일 타입
  fileSize: "number",              // 파일 크기
  uploaderId: "string",            // 업로더 UID
  uploaderName: "string",          // 업로더 이름
  uploadedAt: "timestamp",         // 업로드 시간
  pageId: "string",                // 연결된 페이지 ID
  downloadUrl: "string"            // 다운로드 URL
}
```

#### 3.2 보안 규칙 (Firestore Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서 규칙
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // 위키 페이지 규칙
    match /wiki_pages/{pageId} {
      allow read: if request.auth != null && 
        resource.data.securityLevel <= 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.securityLevel;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isBlocked != true;
    }
    
    // 댓글 규칙
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isBlocked != true;
      allow update, delete: if request.auth != null && 
        (resource.data.authorId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
  }
}
```

### 4. API 설계

#### 4.1 인증 API

```javascript
// 로그인
POST /auth/login
{
  "identifier": "string",  // Agent ID 또는 이메일
  "password": "string"
}

// 회원가입
POST /auth/register
{
  "agentId": "string",
  "email": "string",
  "password": "string",
  "displayName": "string"
}

// 관리자 로그인
POST /auth/admin/login
{
  "adminId": "string",
  "password": "string"
}
```

#### 4.2 위키 API

```javascript
// 페이지 목록 조회
GET /wiki/pages?securityLevel={level}&page={page}&limit={limit}

// 페이지 상세 조회
GET /wiki/pages/{pageId}

// 페이지 생성
POST /wiki/pages
{
  "title": "string",
  "content": "string",
  "securityLevel": "number",
  "tags": ["array"]
}

// 페이지 수정
PUT /wiki/pages/{pageId}
{
  "title": "string",
  "content": "string",
  "securityLevel": "number",
  "tags": ["array"]
}
```

#### 4.3 파일 API

```javascript
// 파일 업로드
POST /files/upload
Content-Type: multipart/form-data
{
  "file": "File",
  "pageId": "string"
}

// 파일 목록 조회
GET /files?pageId={pageId}

// 파일 삭제
DELETE /files/{fileId}
```

### 5. 상태 관리

#### 5.1 전역 상태 구조

```javascript
const globalState = {
  // 인증 상태
  auth: {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: false
  },
  
  // UI 상태
  ui: {
    currentScreen: 'login',
    isLoading: false,
    error: null,
    bootSequence: false
  },
  
  // 위키 상태
  wiki: {
    pages: [],
    currentPage: null,
    comments: [],
    files: []
  },
  
  // 관리자 상태
  admin: {
    users: [],
    activities: [],
    statistics: {}
  }
};
```

#### 5.2 상태 업데이트 패턴

```javascript
// 상태 업데이트 함수
function updateState(path, value) {
  const keys = path.split('.');
  let current = globalState;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  notifyStateChange(path);
}

// 상태 변화 구독
function subscribeToState(path, callback) {
  // 상태 변화 시 콜백 실행
}
```

### 6. 에러 처리

#### 6.1 에러 타입 정의

```javascript
const ErrorTypes = {
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  FIREBASE: 'FIREBASE',
  UNKNOWN: 'UNKNOWN'
};

class AppError extends Error {
  constructor(type, message, details = {}) {
    super(message);
    this.type = type;
    this.details = details;
    this.timestamp = new Date();
  }
}
```

#### 6.2 에러 처리 미들웨어

```javascript
function handleError(error) {
  console.error('Error occurred:', error);
  
  switch (error.type) {
    case ErrorTypes.AUTHENTICATION:
      showLoginScreen();
      break;
    case ErrorTypes.AUTHORIZATION:
      showAccessDenied();
      break;
    case ErrorTypes.NETWORK:
      showNetworkError();
      break;
    default:
      showGenericError();
  }
}
```

---

**이전 문서**: [TAA Archives - 기술 문서 (1/3) - 프로젝트 개요](./TAA_ARCHIVES_TECH_1_3.md)  
**다음 문서**: [TAA Archives - 기술 문서 (3/3) - 배포 및 운영](./TAA_ARCHIVES_TECH.md) 