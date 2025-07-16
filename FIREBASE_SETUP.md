# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `taa-archives` (또는 원하는 이름)
4. Google Analytics 활성화 (선택사항)
5. "프로젝트 만들기" 클릭

## 2. Authentication 설정

1. 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 클릭
3. "로그인 방법" 탭에서 "이메일/비밀번호" 활성화
4. "사용자 등록" 활성화
5. "저장" 클릭

## 3. Firestore Database 설정

1. 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. "테스트 모드에서 시작" 선택 (개발용)
4. 위치 선택 (가까운 지역)
5. "완료" 클릭

## 4. 웹 앱 등록

1. 프로젝트 개요 페이지에서 웹 아이콘(</>) 클릭
2. 앱 닉네임: `taa-archives-web`
3. "Firebase Hosting 설정" 체크 해제
4. "앱 등록" 클릭

## 5. 설정 정보 복사

등록 후 표시되는 설정 정보를 복사하여 `js/config/firebase-config.js` 파일에 붙여넣기:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

## 6. 보안 규칙 설정

Firestore Database > 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.securityClearance >= 3;
    }
    
    // 파일
    match /files/{fileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.author == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.securityClearance >= 3);
    }
    
    // 댓글
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // 감사 로그
    match /audit_logs/{logId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.securityClearance >= 3;
    }
  }
}
```

## 7. 테스트

1. 로컬 서버 실행: `python -m http.server 8000`
2. 브라우저에서 `http://localhost:8000` 접속
3. 회원가입 후 로그인 테스트

## 8. 문제 해결

### 인증 오류
- Firebase Console에서 Authentication > 사용자 탭에서 사용자 확인
- 보안 규칙이 올바르게 설정되었는지 확인

### 데이터베이스 오류
- Firestore Database > 데이터 탭에서 컬렉션 확인
- 보안 규칙이 너무 제한적이지 않은지 확인

### CORS 오류
- Firebase Console에서 Authentication > 설정 > 승인된 도메인에 `localhost` 추가 