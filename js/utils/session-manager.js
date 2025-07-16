// Session Manager - 세션 상태 관리
class SessionManager {
    constructor() {
        this.sessionKey = 'taa_session';
        this.bootKey = 'taa_boot_completed';
        this.currentViewKey = 'taa_current_view';
        this.currentScreenKey = 'taa_current_screen'; // 현재 화면 상태 (로그인/회원가입/메인)
        this.loggedInKey = 'taa_logged_in'; // 로그인 상태 (localStorage 사용)
        this.pendingRouteKey = 'taa_pending_route'; // 대기 중인 라우트
        this.init();
    }

    init() {
        // 세션 시작 시간 기록
        if (!this.getSessionStartTime()) {
            this.setSessionStartTime();
        }
    }

    // 세션 시작 시간 관리
    setSessionStartTime() {
        const sessionData = {
            startTime: Date.now(),
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    }

    getSessionStartTime() {
        const sessionData = sessionStorage.getItem(this.sessionKey);
        return sessionData ? JSON.parse(sessionData).startTime : null;
    }

    // 부팅 완료 상태 관리
    setBootCompleted() {
        localStorage.setItem(this.bootKey, 'true');
    }

    isBootCompleted() {
        return localStorage.getItem(this.bootKey) === 'true';
    }

    // 현재 뷰 상태 관리
    setCurrentView(viewName) {
        sessionStorage.setItem(this.currentViewKey, viewName);
    }

    getCurrentView() {
        return sessionStorage.getItem(this.currentViewKey) || 'home';
    }

    // 현재 화면 상태 관리 (로그인/회원가입/메인) - localStorage 사용
    setCurrentScreen(screenName) {
        localStorage.setItem(this.currentScreenKey, screenName);
    }

    getCurrentScreen() {
        return localStorage.getItem(this.currentScreenKey) || 'login';
    }

    // 세션 유효성 검사
    isSessionValid() {
        const sessionStart = this.getSessionStartTime();
        if (!sessionStart) return false;

        // 세션 시작 후 24시간 이내인지 확인
        const now = Date.now();
        const sessionAge = now - sessionStart;
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24시간

        return sessionAge < maxSessionAge;
    }

    // 새 세션 시작 (브라우저 재시작 시)
    startNewSession() {
        sessionStorage.clear();
        this.setSessionStartTime();
    }

    // 세션 완전 초기화 (로그아웃 시)
    clearSession() {
        sessionStorage.clear();
        localStorage.removeItem(this.bootKey);
        localStorage.removeItem(this.currentScreenKey);
        localStorage.removeItem(this.loggedInKey);
        localStorage.removeItem(this.pendingRouteKey);
    }

    // 화면 상태만 초기화 (로그인/회원가입 화면 전환 시)
    clearScreenState() {
        localStorage.removeItem(this.currentScreenKey);
    }

    // 부팅 시퀀스 표시 여부 결정
    shouldShowBootSequence() {
        const bootCompleted = this.isBootCompleted();
        const currentScreen = this.getCurrentScreen();
        const isLoggedIn = this.isLoggedIn();
        
        console.log('=== Session Debug Info ===');
        console.log('Boot completed:', bootCompleted);
        console.log('Current screen:', currentScreen);
        console.log('Is logged in:', isLoggedIn);
        console.log('Session valid:', this.isSessionValid());
        console.log('Page refresh:', this.isPageRefresh());
        
        // 로그인된 상태이고 메인 화면이면 부팅 시퀀스 건너뛰기
        if (isLoggedIn && currentScreen === 'main') {
            console.log('User logged in and on main screen - skipping boot sequence');
            return false;
        }
        
        // 부팅이 완료되었으면 부팅 시퀀스 건너뛰기
        if (bootCompleted) {
            console.log('Boot completed - skipping boot sequence');
            return false;
        }
        
        console.log('Boot not completed - showing boot sequence');
        return true;
    }

    // 로그인 상태 확인 - localStorage 사용
    isLoggedIn() {
        return localStorage.getItem(this.loggedInKey) === 'true';
    }

    setLoggedIn() {
        localStorage.setItem(this.loggedInKey, 'true');
    }

    setLoggedOut() {
        localStorage.removeItem(this.loggedInKey);
    }

    // 페이지 새로고침 감지
    isPageRefresh() {
        return performance.navigation.type === 1;
    }

    // 브라우저 탭/창 닫힘 감지
    setupPageUnloadDetection() {
        window.addEventListener('beforeunload', () => {
            // 페이지가 닫힐 때 세션 정보 유지
            // localStorage는 유지되지만 sessionStorage는 사라짐
        });
    }

    // 대기 중인 라우트 관리
    setPendingRoute(route) {
        localStorage.setItem(this.pendingRouteKey, route);
    }

    getPendingRoute() {
        return localStorage.getItem(this.pendingRouteKey);
    }

    clearPendingRoute() {
        localStorage.removeItem(this.pendingRouteKey);
    }

    // 세션 정보 가져오기
    getSessionInfo() {
        return {
            sessionStart: this.getSessionStartTime(),
            bootCompleted: this.isBootCompleted(),
            currentView: this.getCurrentView(),
            currentScreen: this.getCurrentScreen(),
            isLoggedIn: this.isLoggedIn(),
            sessionValid: this.isSessionValid(),
            isRefresh: this.isPageRefresh(),
            pendingRoute: this.getPendingRoute()
        };
    }
}

// 전역 인스턴스 생성
const sessionManager = new SessionManager();

// 페이지 언로드 감지 설정
sessionManager.setupPageUnloadDetection();

console.log('TAA Archives: Session manager initialized'); 