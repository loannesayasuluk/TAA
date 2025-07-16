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

console.log('TAA Archives: Firebase initialized successfully'); 