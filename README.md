# TAA Archives - Terminal Access to Classified Information

1990년대 비밀 기관의 구형 터미널을 해킹하여 접속한 듯한 경험을 제공하는 협업형 콘텐츠 플랫폼입니다.

## 🎯 프로젝트 개요

TAA Archives는 나무위키와 디시인사이드의 핵심 기능을 결합한 협업형 위키 플랫폼입니다. 사용자는 '요원'이 되어 시스템을 탐험하며, 보안 등급에 따라 특정 문서의 열람이 제한됩니다.

### 주요 특징

- **다이제틱 인터페이스**: 1990년대 터미널을 연상시키는 디자인
- **실시간 협업**: Firebase Firestore를 통한 실시간 데이터 동기화
- **위키 링크 시스템**: `[[링크할 단어]]` 형식의 자동 링크 생성
- **보안 등급 시스템**: 사용자별 접근 권한 관리
- **댓글 시스템**: 익명 분석 및 추천 기능
- **자동 검열**: 금지어 자동 마스킹
- **버전 관리**: 파일 편집 히스토리 및 복원 기능

## 🚀 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Firestore (실시간 데이터베이스)
- **Authentication**: Firebase Authentication
- **Hosting**: Firebase Hosting (권장)

## 📁 프로젝트 구조

```
TAA 2/
├── index.html                 # 메인 HTML 파일
├── styles/
│   ├── main.css              # 메인 스타일시트
│   ├── terminal.css          # 터미널 효과 스타일
│   └── wiki.css              # 위키 링크 스타일
├── js/
│   ├── config/
│   │   └── firebase-config.js # Firebase 설정
│   ├── utils/
│   │   ├── terminal-effects.js # 터미널 효과 유틸리티
│   │   └── wiki-parser.js     # 위키 파서
│   ├── services/
│   │   ├── auth-service.js    # 인증 서비스
│   │   ├── file-service.js    # 파일 관리 서비스
│   │   └── comment-service.js # 댓글 서비스
│   ├── components/
│   │   ├── boot-sequence.js   # 부팅 시퀀스
│   │   ├── ghost-terminals.js # 유령 터미널
│   │   ├── file-editor.js     # 파일 에디터
│   │   └── comments.js        # 댓글 컴포넌트
│   └── app.js                 # 메인 애플리케이션
├── assets/
│   ├── sounds/
│   │   ├── keyboard.mp3       # 키보드 사운드
│   │   └── fan.mp3           # 팬 소음
│   └── favicon.ico           # 파비콘
└── README.md                 # 프로젝트 문서
```

## 🛠️ 설치 및 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성
3. Firestore Database 활성화
4. Authentication 활성화 (이메일/비밀번호 방식)

### 2. Firebase 설정

1. 프로젝트 설정에서 웹 앱 추가
2. Firebase 설정 객체 복사
3. `js/config/firebase-config.js` 파일에서 설정 업데이트:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 3. Firestore 보안 규칙 설정

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.securityClearance >= 4;
    }
    
    // 파일 문서
    match /files/{fileId} {
      allow read: if request.auth != null && 
        resource.data.requiredClearance <= get(/databases/$(database)/documents/users/$(request.auth.uid)).data.securityClearance;
      allow write: if request.auth != null;
    }
    
    // 댓글 문서
    match /comments/{commentId} {
      allow read, write: if request.auth != null;
    }
    
    // 감사 로그
    match /audit_logs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. 로컬 개발 서버 실행

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# PHP
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

## 🎮 사용 방법

### 1. 초기 접속

- 사이트 접속 시 부팅 시퀀스가 자동으로 실행됩니다
- 부팅 완료 후 로그인 화면이 표시됩니다

### 2. 로그인

- Agent ID (이메일)와 비밀번호 입력
- 초기 사용자는 보안 등급 1로 설정됩니다

### 3. 파일 생성

- "CREATE FILE" 버튼 클릭
- 제목과 내용 입력
- `[[위키링크]]` 형식으로 내부 링크 생성
- 마크다운 문법 지원

### 4. 파일 편집

- 파일 보기 화면에서 "EDIT" 버튼 클릭
- 내용 수정 후 "SAVE CHANGES" 클릭
- 편집 히스토리가 자동으로 저장됩니다

### 5. 댓글 작성

- 파일 하단의 "RECORD ANALYSIS" 섹션에서 댓글 작성
- 익명으로 작성 가능
- 다른 사용자의 댓글에 추천 가능

## 🔧 주요 기능

### 위키 링크 시스템

```markdown
이 문서는 [[다른 문서]]와 관련이 있습니다.
```

- 존재하는 문서: 파란색 링크로 표시
- 존재하지 않는 문서: 빨간색으로 표시 (클릭 시 생성 제안)

### 보안 등급 시스템

- **등급 1**: 기본 문서 접근
- **등급 2**: 일반 문서 접근
- **등급 3**: 중요 문서 접근
- **등급 4**: 관리자 기능
- **등급 5**: 시스템 관리자

### 자동 검열 시스템

다음 단어들이 자동으로 `[데이터 말소]`로 마스킹됩니다:
- 비밀, 기밀, 국가기밀, 군사기밀
- secret, classified, confidential, top secret
- government, military, intelligence, spy, agent

### 댓글 추천 시스템

- 댓글에 추천 버튼 클릭
- 5개 이상 추천 시 `[[주요 분석 결과]]` 태그 자동 부여
- 추천된 댓글은 상단에 표시

## 🎨 디자인 특징

### 다이제틱 인터페이스

- **배경색**: 미드나잇 블루 (#191970)
- **텍스트색**: 앰버 모노크롬 (#FFBF00)
- **폰트**: IBM Plex Mono
- **효과**: 노이즈 텍스처, 스캔 라인, CRT 곡률

### 애니메이션 효과

- 부팅 시퀀스 타이핑 효과
- 유령 터미널 애니메이션
- 링크 호버 노이즈 효과
- 버튼 클릭 진동 효과

## 🔒 보안 기능

- Firebase Authentication을 통한 사용자 인증
- Firestore 보안 규칙을 통한 데이터 접근 제어
- 감사 로그 시스템
- 세션 관리 및 자동 로그아웃

## 🚀 배포

### Firebase Hosting (권장)

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 배포
firebase deploy
```

### 기타 호스팅 서비스

- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🐛 문제 해결

### 일반적인 문제

1. **Firebase 연결 오류**
   - Firebase 설정이 올바른지 확인
   - Firestore 규칙 설정 확인

2. **인증 오류**
   - Firebase Authentication 활성화 확인
   - 이메일/비밀번호 방식 활성화

3. **스타일 로딩 오류**
   - CSS 파일 경로 확인
   - IBM Plex Mono 폰트 로딩 확인

### 개발자 도구

브라우저 개발자 도구에서 다음 명령어로 디버깅:

```javascript
// 현재 사용자 정보
console.log(authService.getCurrentUser());

// 현재 파일 정보
console.log(app.currentFile);

// 위키 파서 테스트
console.log(wikiParser.parseWikiLinks("[[테스트]]"));
```

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**TAA Archives v1.0** - Terminal Access to Classified Information 