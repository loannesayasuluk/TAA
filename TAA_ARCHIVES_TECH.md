# TAA Archives - 기술 문서 (3/3)
## 배포 및 운영 가이드

### 1. 개발 환경 설정

#### 1.1 필수 요구사항
- **Node.js**: 16.x 이상
- **Python**: 3.7 이상 (로컬 서버용)
- **Git**: 최신 버전
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

#### 1.2 로컬 개발 환경 설정

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd "TAA 2"

# 2. Firebase 설정
# js/config/firebase-config.js 파일에 Firebase 설정 추가
# Firebase Console에서 프로젝트 생성 후 설정 정보 복사

# 3. 로컬 서버 실행
python -m http.server 8000

# 4. 브라우저에서 접속
# http://localhost:8000
```

#### 1.3 Firebase 프로젝트 설정

```javascript
// Firebase Console 설정 단계
1. Firebase Console (https://console.firebase.google.com) 접속
2. 새 프로젝트 생성
3. Authentication 활성화 (이메일/비밀번호)
4. Firestore Database 생성
5. Storage 활성화
6. 프로젝트 설정에서 웹 앱 추가
7. 설정 정보를 js/config/firebase-config.js에 복사
```

### 2. 배포 가이드

#### 2.1 Vercel 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프로젝트 루트에서 배포
vercel

# 3. 환경 변수 설정 (Vercel 대시보드)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

#### 2.2 vercel.json 설정

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### 2.3 GitHub Actions 자동 배포

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install -g vercel
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### 3. 운영 및 모니터링

#### 3.1 Firebase 모니터링

```javascript
// Firebase Console에서 모니터링할 항목
1. Authentication > Users: 사용자 등록/로그인 통계
2. Firestore > Usage: 데이터베이스 사용량
3. Storage > Usage: 파일 저장소 사용량
4. Performance > Web: 웹 성능 지표
5. Crashlytics: 오류 및 충돌 보고
```

#### 3.2 로그 관리

```javascript
// 애플리케이션 로그 구조
const logLevels = {
  ERROR: 'error',      // 오류 로그
  WARN: 'warn',        // 경고 로그
  INFO: 'info',        // 정보 로그
  DEBUG: 'debug'       // 디버그 로그
};

// 로그 예시
function logUserAction(action, details) {
  console.log(`[${new Date().toISOString()}] USER_ACTION: ${action}`, details);
  // Firebase Analytics 또는 외부 로깅 서비스로 전송
}
```

#### 3.3 성능 모니터링

```javascript
// 성능 측정 지표
const performanceMetrics = {
  // 페이지 로드 시간
  pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
  
  // Firebase 응답 시간
  firebaseResponseTime: 0,
  
  // 사용자 상호작용 시간
  userInteractionTime: 0
};

// 성능 측정 함수
function measurePerformance(metric, value) {
  performanceMetrics[metric] = value;
  // 성능 데이터를 Firebase Analytics로 전송
}
```

### 4. 보안 운영

#### 4.1 Firebase 보안 규칙 관리

```javascript
// Firestore 보안 규칙 업데이트
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 정기적인 보안 규칙 검토 및 업데이트
    // 사용자 권한 변경 시 즉시 반영
    // 관리자 작업 로그 보존
  }
}
```

#### 4.2 사용자 데이터 보호

```javascript
// 데이터 보호 정책
const dataProtection = {
  // 개인정보 암호화
  encryptPersonalData: true,
  
  // 데이터 보존 기간
  retentionPeriod: 365, // 일
  
  // 자동 데이터 삭제
  autoDeleteInactiveUsers: true,
  
  // GDPR 준수
  gdprCompliant: true
};
```

### 5. 백업 및 복구

#### 5.1 Firebase 백업

```bash
# Firestore 데이터 백업
firebase firestore:export ./backup --project your-project-id

# Storage 백업
gsutil -m cp -r gs://your-bucket/* ./storage-backup/

# 설정 백업
firebase projects:list
firebase use your-project-id
firebase functions:config:get > config-backup.json
```

#### 5.2 복구 절차

```javascript
// 데이터 복구 프로세스
const recoveryProcess = {
  1: "백업 데이터 검증",
  2: "Firestore 데이터 복원",
  3: "Storage 파일 복원",
  4: "사용자 인증 데이터 복원",
  5: "시스템 정상 동작 확인"
};
```

### 6. 확장성 및 유지보수

#### 6.1 코드 구조 개선

```javascript
// 모듈화 개선 방안
const moduleStructure = {
  // 서비스 레이어 분리
  services: ['auth', 'file', 'comment', 'admin'],
  
  // 컴포넌트 재사용성 향상
  components: ['terminal', 'modal', 'form', 'table'],
  
  // 유틸리티 함수 정리
  utils: ['validation', 'formatting', 'crypto']
};
```

#### 6.2 성능 최적화

```javascript
// 성능 최적화 전략
const optimizationStrategies = {
  // 이미지 최적화
  imageOptimization: {
    format: 'WebP',
    compression: 'high',
    lazyLoading: true
  },
  
  // 코드 분할
  codeSplitting: {
    dynamicImports: true,
    routeBasedSplitting: true
  },
  
  // 캐싱 전략
  caching: {
    browserCache: '1 week',
    cdnCache: '1 month',
    apiCache: '5 minutes'
  }
};
```

### 7. 문제 해결 가이드

#### 7.1 일반적인 문제

```javascript
// 자주 발생하는 문제 및 해결책
const troubleshooting = {
  "Firebase 연결 실패": {
    cause: "네트워크 문제 또는 설정 오류",
    solution: "Firebase 설정 확인, 네트워크 연결 확인"
  },
  "인증 오류": {
    cause: "세션 만료 또는 권한 문제",
    solution: "재로그인, 권한 확인"
  },
  "파일 업로드 실패": {
    cause: "파일 크기 초과 또는 형식 오류",
    solution: "파일 크기 및 형식 확인"
  }
};
```

#### 7.2 디버깅 도구

```javascript
// 개발자 도구 활용
const debuggingTools = {
  // 브라우저 개발자 도구
  browserDevTools: ['Console', 'Network', 'Application'],
  
  // Firebase 디버깅
  firebaseDebug: ['Firebase Console', 'Firebase CLI'],
  
  // 성능 분석
  performanceTools: ['Lighthouse', 'WebPageTest']
};
```

### 8. 업데이트 및 버전 관리

#### 8.1 버전 관리 전략

```javascript
// Semantic Versioning
const versioning = {
  major: 1,    // 호환되지 않는 변경
  minor: 2,    // 호환되는 기능 추가
  patch: 3     // 버그 수정
};

// 배포 전 체크리스트
const deploymentChecklist = [
  "테스트 완료",
  "성능 검증",
  "보안 검토",
  "문서 업데이트",
  "백업 생성"
];
```

#### 8.2 롤백 절차

```javascript
// 롤백 프로세스
const rollbackProcess = {
  1: "문제 상황 분석",
  2: "이전 버전으로 복원",
  3: "데이터 무결성 확인",
  4: "사용자 알림",
  5: "문제 원인 분석 및 수정"
};
```

### 9. 파일 관리 시스템

#### 9.1 파일 서비스
- Firestore의 files 컬렉션에 CRUD
- 파일 생성/수정 시 히스토리 자동 기록(fileHistory 컬렉션)
- 파일 삭제 시 관련 댓글, 히스토리도 함께 삭제
- 파일별 보안등급(requiredClearance) 설정, 열람/수정 권한 체크

#### 9.2 파일 에디터
- 마크다운 지원, 실시간 미리보기, 저장/취소/프리뷰 버튼
- 저장 시 Firestore에 반영, 히스토리 생성
- 히스토리 탭에서 버전별 복원/비교 가능

### 10. 댓글 시스템

#### 10.1 댓글 서비스
- Firestore의 comments 컬렉션에 CRUD
- 파일별 댓글 실시간 구독(onSnapshot)
- 댓글 작성/수정/삭제 시 실시간 UI 반영
- 댓글 작성자/관리자만 수정/삭제 가능

### 11. 관리자 작업 로그 및 실시간 연동

#### 11.1 adminActions 컬렉션
- 모든 관리자 작업(차단, 해제, 삭제, 등급변경 등) Firestore에 기록
- 관리자 대시보드에서 실시간 조회 및 필터링
- 작업 로그는 actionType, target, details, adminId, adminName, timestamp 등으로 구성

#### 11.2 실시간 데이터 연동
- Firestore onSnapshot 리스너로 사용자/콘텐츠/작업 로그 실시간 반영
- 차단/삭제/등급변경 등 모든 변경사항이 즉시 모든 클라이언트에 반영
- 관리자 작업 시 전역 메시지(Global Message)로 사용자에게 즉시 알림

---

**이전 문서**: [TAA Archives - 기술 문서 (2/3) - 구현 세부사항](./TAA_ARCHIVES_TECH_2_3.md)

**전체 문서 목록**:
- [TAA Archives - 기술 문서 (1/3) - 프로젝트 개요](./TAA_ARCHIVES_TECH_1_3.md)
- [TAA Archives - 기술 문서 (2/3) - 구현 세부사항](./TAA_ARCHIVES_TECH_2_3.md)
- [TAA Archives - 기술 문서 (3/3) - 배포 및 운영](./TAA_ARCHIVES_TECH.md)

---

**이 문서는 TAA Archives 프로젝트의 완전한 기술 문서 세트의 일부입니다.** 