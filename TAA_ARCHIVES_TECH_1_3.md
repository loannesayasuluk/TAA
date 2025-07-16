# TAA Archives - 기술 문서 (1/3)
## 프로젝트 개요 및 아키텍처

### 1. 프로젝트 개요

**TAA Archives**는 1990년대 비밀 기관 터미널 해킹 테마의 협업 위키 플랫폼입니다. 이 프로젝트는 복고풍 터미널 인터페이스와 현대적인 웹 기술을 결합하여 독특한 사용자 경험을 제공합니다.

#### 주요 특징
- **테마**: 1990년대 비밀 기관 터미널 해킹 스타일
- **플랫폼**: 협업 위키 시스템
- **백엔드**: Firebase (Firestore, Authentication, Storage)
- **프론트엔드**: 순수 JavaScript (Vanilla JS)
- **스타일링**: CSS3 (터미널 테마, 애니메이션 효과)

### 2. 시스템 아키텍처

#### 2.1 전체 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Firebase      │    │   External      │
│   (Vanilla JS)  │◄──►│   Services      │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │   Auth          │    │   File Storage  │
│   - Terminal    │    │   - Login       │    │   - Images      │
│   - Boot Seq    │    │   - Register    │    │   - Documents   │
│   - Navigation  │    │   - Admin       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Business      │    │   Data Layer    │
│   Logic         │    │   - Firestore   │
│   - Wiki Parser │    │   - Real-time   │
│   - File Mgmt   │    │   - Security    │
│   - Comments    │    │                 │
└─────────────────┘    └─────────────────┘
```

#### 2.2 디렉토리 구조
```
TAA 2/
├── index.html                 # 메인 HTML 파일
├── js/
│   ├── app.js                 # 메인 애플리케이션 로직
│   ├── components/
│   │   ├── boot-sequence.js   # 부팅 시퀀스 컴포넌트
│   │   └── ghost-terminals.js # 유령 터미널 효과
│   ├── config/
│   │   └── firebase-config.js # Firebase 설정
│   ├── services/
│   │   ├── auth-service.js    # 인증 서비스
│   │   ├── comment-service.js # 댓글 서비스
│   │   └── file-service.js    # 파일 관리 서비스
│   └── utils/
│       ├── terminal-effects.js # 터미널 시각 효과
│       └── wiki-parser.js     # 위키 파싱 유틸리티
├── styles/
│   ├── main.css              # 메인 스타일
│   ├── terminal.css          # 터미널 테마 스타일
│   └── wiki.css              # 위키 콘텐츠 스타일
└── README.md                 # 프로젝트 문서
```

### 3. 기술 스택

#### 3.1 프론트엔드 기술
- **언어**: JavaScript (ES6+)
- **프레임워크**: Vanilla JS (순수 JavaScript)
- **스타일링**: CSS3
- **애니메이션**: CSS3 Transitions/Animations
- **폰트**: 터미널 모노스페이스 폰트

#### 3.2 백엔드 기술
- **플랫폼**: Firebase
- **데이터베이스**: Firestore (NoSQL)
- **인증**: Firebase Authentication
- **파일 저장소**: Firebase Storage
- **실시간 동기화**: Firestore Real-time Listeners

#### 3.3 개발 도구
- **로컬 서버**: Python HTTP Server
- **버전 관리**: Git
- **배포**: Vercel (vercel.json 설정)
- **코드 품질**: ESLint (권장)

### 4. 핵심 기능 모듈

#### 4.1 인증 시스템 (Authentication)
- **로그인**: Agent ID 또는 이메일로 로그인
- **회원가입**: 중복 확인, 보안등급 설정
- **관리자 모드**: 특별 권한 관리자 계정
- **세션 관리**: Firebase Auth 세션 유지

#### 4.2 위키 시스템 (Wiki)
- **콘텐츠 관리**: 마크다운 지원 위키 페이지
- **파일 업로드**: 이미지, 문서 파일 지원
- **댓글 시스템**: 실시간 댓글 기능
- **버전 관리**: 콘텐츠 수정 이력

#### 4.3 관리자 시스템 (Admin)
- **사용자 관리**: 차단, 보안등급 변경
- **콘텐츠 관리**: 삭제, 수정 권한
- **실시간 모니터링**: 사용자 활동 추적
- **보안 관리**: 접근 권한 제어

#### 4.4 UI/UX 시스템
- **부팅 시퀀스**: 시스템 시작 애니메이션
- **터미널 효과**: CRT 모니터, 글리치 효과
- **반응형 디자인**: 다양한 화면 크기 지원
- **접근성**: 키보드 네비게이션 지원

### 5. 보안 아키텍처

#### 5.1 인증 보안
- **Firebase Auth**: 구글의 안전한 인증 시스템
- **세션 관리**: 자동 세션 만료 및 갱신
- **비밀번호 정책**: 강력한 비밀번호 요구사항

#### 5.2 데이터 보안
- **Firestore 보안 규칙**: 서버 사이드 보안
- **파일 접근 제어**: 권한 기반 파일 접근
- **실시간 보안**: 클라이언트-서버 간 안전한 통신

#### 5.3 관리자 보안
- **관리자 인증**: 별도 관리자 계정 시스템
- **권한 분리**: 일반 사용자와 관리자 권한 분리
- **활동 로그**: 관리자 활동 추적

### 6. 성능 최적화

#### 6.1 프론트엔드 최적화
- **지연 로딩**: 필요한 시에만 컴포넌트 로드
- **이미지 최적화**: Firebase Storage CDN 활용
- **캐싱 전략**: 브라우저 캐시 활용

#### 6.2 백엔드 최적화
- **Firestore 인덱싱**: 효율적인 쿼리 성능
- **실시간 동기화**: 필요한 데이터만 구독
- **오프라인 지원**: Firebase 오프라인 캐시

---

**다음 문서**: [TAA Archives - 기술 문서 (2/3) - 구현 세부사항](./TAA_ARCHIVES_TECH_2_3.md) 