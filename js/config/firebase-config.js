// TAA Archives - Firebase Configuration
// Firebase 설정 및 초기화

// Firebase 설정 객체
const firebaseConfig = {
    apiKey: "AIzaSyBwpnlmKq1IDCWMgZPGghD1jyAmZOa3Dnk",
    authDomain: "taastudio.firebaseapp.com",
    projectId: "taastudio",
    storageBucket: "taastudio.firebasestorage.app",
    messagingSenderId: "979667708001",
    appId: "1:979667708001:web:ed10e573fa1c7e88b92220",
    measurementId: "G-NLCYWTRTWN"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 및 Auth 인스턴스
const db = firebase.firestore();
const auth = firebase.auth();

// Firestore 설정
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// 오프라인 지원 활성화
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });

// 전역 변수로 내보내기
window.db = db;
window.auth = auth;
window.firebaseConfig = firebaseConfig;

// 저장된 토큰 복원 시도
const savedToken = localStorage.getItem('authToken');
if (savedToken) {
    console.log('Saved auth token found, attempting to restore session...');
    // Firebase Auth는 자동으로 토큰을 검증하고 사용자 상태를 복원합니다
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Session restored successfully for user:', user.email);
        } else {
            console.log('Saved token is invalid, removing from storage');
            localStorage.removeItem('authToken');
        }
    });
}

console.log('TAA Archives: Firebase initialized successfully'); 