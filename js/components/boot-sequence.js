// TAA Archives - Boot Sequence Component
// 부팅 시퀀스 및 시스템 초기화

class BootSequence {
    constructor() {
        this.isRunning = false;
        this.adminKeySequence = [];
        this.adminKeyPattern = ['/', '/', '/', '/'];
        this.bootSteps = [
            {
                text: "INITIALIZING TAA ARCHIVES...",
                delay: 600,
                sound: true
            },
            {
                text: "LOADING SECURITY PROTOCOLS...",
                delay: 500,
                sound: true
            },
            {
                text: "ESTABLISHING SECURE CONNECTION...",
                delay: 700,
                sound: true
            },
            {
                text: "VERIFYING USER CREDENTIALS...",
                delay: 400,
                sound: true
            },
            {
                text: "ACCESSING CLASSIFIED DATABASE...",
                delay: 800,
                sound: true
            },
            {
                text: "LOADING ENCRYPTION MODULES...",
                delay: 500,
                sound: true
            },
            {
                text: "SYSTEM STATUS: OPERATIONAL",
                delay: 300,
                sound: false
            },
            {
                text: "WELCOME, AGENT.",
                delay: 600,
                sound: false
            },
            {
                text: "TAA ARCHIVES v1.0 READY FOR ACCESS.",
                delay: 1000,
                sound: false
            }
        ];
        
        // 관리자 키 시퀀스 리스너 설정
        this.setupAdminKeyListener();
    }

    // 부팅 시퀀스 시작
    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        const bootText = document.getElementById('boot-text');
        const bootScreen = document.getElementById('boot-sequence');
        
        // 부팅 화면 표시
        bootScreen.classList.remove('hidden');
        bootText.textContent = '';
        
        // 커서 추가
        terminalEffects.addCursorToText(bootText);
        
        // 각 부팅 단계 실행
        for (let i = 0; i < this.bootSteps.length; i++) {
            const step = this.bootSteps[i];
            
            // 텍스트 타이핑
            await this.typeText(bootText, step.text, step.sound);
            
            // 지연
            await this.delay(step.delay);
            
            // 줄바꿈 추가 (마지막 단계 제외)
            if (i < this.bootSteps.length - 1) {
                bootText.textContent += '\n';
            }
        }
        
        // 최종 지연
        await this.delay(1000);
        
        // 부팅 완료
        this.complete();
    }

    // 텍스트 타이핑 효과
    async typeText(element, text, playSound = true) {
        const originalText = element.textContent;
        
        for (let i = 0; i < text.length; i++) {
            element.textContent = originalText + text.substring(0, i + 1);
            
            if (playSound) {
                terminalEffects.playKeyboardSound();
            }
            
            await this.delay(20 + Math.random() * 15); // 더 빠른 타이핑 속도
        }
    }

    // 지연 함수
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 부팅 완료
    complete() {
        this.isRunning = false;
        
        // 부팅 완료 상태 저장
        if (window.sessionManager) {
            sessionManager.setBootCompleted();
            // 현재 화면 상태가 없으면 기본적으로 로그인 화면 설정
            if (!sessionManager.getCurrentScreen()) {
                sessionManager.setCurrentScreen('login');
            }
        }
        
        // 부팅 화면 페이드 아웃
        const bootScreen = document.getElementById('boot-sequence');
        bootScreen.style.opacity = '0';
        
        setTimeout(() => {
            bootScreen.classList.add('hidden');
            this.showLoginScreen();
        }, 1000);
    }

    // 로그인 화면 표시
    showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const registerScreen = document.getElementById('register-screen');
        
        // 모든 화면 숨기기
        loginScreen.classList.add('hidden');
        registerScreen.classList.add('hidden');
        
        // 로그인 화면 표시
        loginScreen.classList.remove('hidden');
        loginScreen.style.opacity = '0';
        
        setTimeout(() => {
            loginScreen.style.opacity = '1';
            terminalEffects.fadeIn(loginScreen);
        }, 100);
    }

    // 회원가입 화면 표시
    showRegisterScreen() {
        const loginScreen = document.getElementById('login-screen');
        const registerScreen = document.getElementById('register-screen');
        
        // 모든 화면 숨기기
        loginScreen.classList.add('hidden');
        registerScreen.classList.add('hidden');
        
        // 회원가입 화면 표시
        registerScreen.classList.remove('hidden');
        registerScreen.style.opacity = '0';
        
        setTimeout(() => {
            registerScreen.style.opacity = '1';
            terminalEffects.fadeIn(registerScreen);
        }, 100);
    }

    // 관리자 키 시퀀스 리스너 설정
    setupAdminKeyListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === '/') {
                this.handleAdminKeyPress();
            }
        });
    }

    // 관리자 키 입력 처리
    handleAdminKeyPress() {
        this.adminKeySequence.push('/');
        
        // 최대 4개까지만 유지
        if (this.adminKeySequence.length > 4) {
            this.adminKeySequence.shift();
        }
        
        // 패턴 매칭 확인
        if (this.adminKeySequence.length === 4) {
            const isMatch = this.adminKeySequence.every((key, index) => key === this.adminKeyPattern[index]);
            if (isMatch) {
                this.activateAdminMode();
            }
        }
        
        // 3초 후 시퀀스 초기화
        setTimeout(() => {
            this.adminKeySequence = [];
        }, 3000);
    }

    // 관리자 모드 활성화
    async activateAdminMode() {
        console.log('ADMIN MODE ACTIVATED');
        
        // 부팅 시퀀스 중단
        this.isRunning = false;
        
        const bootText = document.getElementById('boot-text');
        const bootScreen = document.getElementById('boot-sequence');
        
        // 글리치 효과 시작
        this.startGlitchEffect(bootScreen);
        
        // 관리자 메시지 표시
        await this.showAdminMessage(bootText);
        
        // 관리자 로그인 페이지로 이동
        this.redirectToAdminLogin();
    }

    // 글리치 효과 시작
    startGlitchEffect(element) {
        element.classList.add('glitch-effect');
        
        // 랜덤 글리치 애니메이션
        const glitchInterval = setInterval(() => {
            element.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
            element.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
        }, 50);
        
        // 3초 후 글리치 효과 제거
        setTimeout(() => {
            clearInterval(glitchInterval);
            element.classList.remove('glitch-effect');
            element.style.transform = '';
            element.style.filter = '';
        }, 3000);
    }

    // 관리자 메시지 표시
    async showAdminMessage(bootText) {
        const adminMessages = [
            "SYSTEM COMPROMISED...",
            "UNAUTHORIZED ACCESS DETECTED...",
            "ADMINISTRATOR VERIFICATION...",
            "ACCESS GRANTED: ADMINISTRATOR MODE",
            "BYPASSING SECURITY PROTOCOLS...",
            "관리자 모드 확인. 로그인 화면으로 이동합니다."
        ];
        
        bootText.textContent += '\n\n';
        
        for (const message of adminMessages) {
            await this.typeText(bootText, message, false);
            bootText.textContent += '\n';
            await this.delay(300);
        }
        
        await this.delay(1000);
    }

    // 관리자 로그인 페이지로 리디렉션
    redirectToAdminLogin() {
        // 부팅 완료 상태 저장
        if (window.sessionManager) {
            sessionManager.setBootCompleted();
            sessionManager.setCurrentScreen('admin-login');
        }
        
        // 부팅 화면 숨기기
        const bootScreen = document.getElementById('boot-sequence');
        bootScreen.style.opacity = '0';
        
        setTimeout(() => {
            bootScreen.classList.add('hidden');
            
            // 관리자 로그인 페이지로 이동
            if (window.router && window.router.navigate) {
                console.log('Navigating to admin login via router');
                window.router.navigate('/admin-login');
            } else {
                console.log('Showing admin login screen directly');
                this.showAdminLoginScreen();
            }
        }, 1000);
    }

    // 관리자 로그인 화면 표시
    showAdminLoginScreen() {
        console.log('Showing admin login screen');
        
        // 모든 화면 숨기기
        const allScreens = [
            'boot-sequence',
            'login-screen', 
            'register-screen',
            'main-app',
            'admin-dashboard'
        ];
        
        allScreens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('hidden');
            }
        });
        
        // 관리자 로그인 화면 표시
        const adminLoginScreen = document.getElementById('admin-login-screen');
        if (adminLoginScreen) {
            console.log('Admin login screen found, showing...');
            adminLoginScreen.classList.remove('hidden');
            adminLoginScreen.style.opacity = '0';
            setTimeout(() => {
                adminLoginScreen.style.opacity = '1';
            }, 100);
        } else {
            console.error('Admin login screen not found!');
        }
    }

    // 부팅 시퀀스 재시작
    restart() {
        this.isRunning = false;
        const bootText = document.getElementById('boot-text');
        bootText.textContent = '';
        terminalEffects.removeCursor(bootText);
        this.start();
    }

    // 시스템 오류 시퀀스
    async showErrorSequence(errorCode) {
        const bootText = document.getElementById('boot-text');
        const errorMessages = [
            "SYSTEM ERROR DETECTED",
            `ERROR CODE: ${errorCode}`,
            "INITIATING EMERGENCY PROTOCOLS...",
            "CONTACT SYSTEM ADMINISTRATOR",
            "SYSTEM WILL RESTART IN 10 SECONDS..."
        ];
        
        bootText.textContent += '\n\n';
        
        for (const message of errorMessages) {
            await this.typeText(bootText, message, false);
            bootText.textContent += '\n';
            await this.delay(1000);
        }
        
        // 10초 후 재시작
        setTimeout(() => {
            this.restart();
        }, 10000);
    }

    // 시스템 점검 시퀀스
    async showSystemCheck() {
        const bootText = document.getElementById('boot-text');
        const checkSteps = [
            "PERFORMING SYSTEM DIAGNOSTICS...",
            "CHECKING MEMORY INTEGRITY...",
            "VERIFYING DATABASE CONNECTIONS...",
            "TESTING SECURITY MODULES...",
            "VALIDATING USER PERMISSIONS...",
            "SYSTEM CHECK COMPLETE - ALL SYSTEMS NOMINAL"
        ];
        
        for (const step of checkSteps) {
            await this.typeText(bootText, step, true);
            bootText.textContent += '\n';
            await this.delay(800);
        }
    }

    // 보안 경고 시퀀스
    async showSecurityWarning() {
        const bootText = document.getElementById('boot-text');
        const warnings = [
            "SECURITY ALERT: UNAUTHORIZED ACCESS ATTEMPT",
            "MULTIPLE FAILED LOGIN DETECTIONS",
            "ENHANCED SECURITY PROTOCOLS ACTIVATED",
            "CAPTCHA VERIFICATION REQUIRED",
            "SYSTEM LOCKDOWN INITIATED"
        ];
        
        bootText.textContent += '\n\n';
        
        for (const warning of warnings) {
            await this.typeText(bootText, warning, false);
            bootText.textContent += '\n';
            terminalEffects.warningBlink(bootText.parentElement);
            await this.delay(1500);
        }
    }

    // 네트워크 연결 시퀀스
    async showNetworkConnection() {
        const bootText = document.getElementById('boot-text');
        const networkSteps = [
            "ESTABLISHING NETWORK CONNECTION...",
            "CONNECTING TO TAA MAINFRAME...",
            "AUTHENTICATING WITH CENTRAL SERVER...",
            "SYNCHRONIZING LOCAL DATABASE...",
            "NETWORK STATUS: CONNECTED"
        ];
        
        for (const step of networkSteps) {
            await this.typeText(bootText, step, true);
            bootText.textContent += '\n';
            await this.delay(1000);
        }
    }

    // 암호화 모듈 로딩 시퀀스
    async showEncryptionLoading() {
        const bootText = document.getElementById('boot-text');
        const encryptionSteps = [
            "LOADING ENCRYPTION MODULES...",
            "INITIALIZING AES-256 ENCRYPTION...",
            "GENERATING SECURE KEY PAIRS...",
            "ESTABLISHING SECURE CHANNELS...",
            "ENCRYPTION STATUS: ACTIVE"
        ];
        
        for (const step of encryptionSteps) {
            await this.typeText(bootText, step, true);
            bootText.textContent += '\n';
            await this.delay(1200);
        }
    }

    // 사용자 인증 시퀀스
    async showUserAuthentication() {
        const bootText = document.getElementById('boot-text');
        const authSteps = [
            "VERIFYING USER CREDENTIALS...",
            "CHECKING SECURITY CLEARANCE...",
            "VALIDATING ACCESS PERMISSIONS...",
            "GENERATING SESSION TOKENS...",
            "AUTHENTICATION STATUS: VERIFIED"
        ];
        
        for (const step of authSteps) {
            await this.typeText(bootText, step, true);
            bootText.textContent += '\n';
            await this.delay(900);
        }
    }

    // 데이터베이스 연결 시퀀스
    async showDatabaseConnection() {
        const bootText = document.getElementById('boot-text');
        const dbSteps = [
            "CONNECTING TO CLASSIFIED DATABASE...",
            "LOADING INDEX TABLES...",
            "VERIFYING DATA INTEGRITY...",
            "ESTABLISHING READ/WRITE PERMISSIONS...",
            "DATABASE STATUS: ONLINE"
        ];
        
        for (const step of dbSteps) {
            await this.typeText(bootText, step, true);
            bootText.textContent += '\n';
            await this.delay(1100);
        }
    }

    // 보안 프로토콜 로딩 시퀀스
    async showSecurityProtocols() {
        const bootText = document.getElementById('boot-text');
        const securitySteps = [
            "LOADING SECURITY PROTOCOLS...",
            "INITIALIZING FIREWALL SYSTEMS...",
            "ACTIVATING INTRUSION DETECTION...",
            "CONFIGURING ACCESS CONTROLS...",
            "SECURITY STATUS: ARMED"
        ];
        
        for (const step of securitySteps) {
            await this.typeText(bootText, step, true);
            bootText.textContent += '\n';
            await this.delay(1000);
        }
    }

    // 시스템 초기화 시퀀스
    async showSystemInitialization() {
        const bootText = document.getElementById('boot-text');
        const initSteps = [
            "INITIALIZING TAA ARCHIVES...",
            "LOADING CORE MODULES...",
            "STARTING BACKGROUND SERVICES...",
            "INITIALIZING USER INTERFACE...",
            "SYSTEM STATUS: READY"
        ];
        
        for (const step of initSteps) {
            await this.typeText(bootText, step, true);
            bootText.textContent += '\n';
            await this.delay(800);
        }
    }

    // 커스텀 부팅 시퀀스 생성
    createCustomSequence(steps) {
        return new Promise(async (resolve) => {
            const bootText = document.getElementById('boot-text');
            
            for (const step of steps) {
                await this.typeText(bootText, step.text, step.sound || false);
                bootText.textContent += '\n';
                await this.delay(step.delay || 1000);
            }
            
            resolve();
        });
    }

    // 부팅 진행률 표시
    showProgress(current, total) {
        const bootText = document.getElementById('boot-text');
        const progress = Math.round((current / total) * 100);
        const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
        
        bootText.textContent += `\nPROGRESS: [${progressBar}] ${progress}%`;
    }

    // 부팅 상태 확인
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentStep: this.currentStep,
            totalSteps: this.bootSteps.length
        };
    }

    // 부팅 중단
    stop() {
        this.isRunning = false;
        const bootText = document.getElementById('boot-text');
        terminalEffects.removeCursor(bootText);
    }

    // 부팅 시퀀스 건너뛰기
    skipBootSequence() {
        // 부팅 완료 상태 저장
        if (window.sessionManager) {
            sessionManager.setBootCompleted();
        }
        
        // 부팅 화면 숨기기
        const bootScreen = document.getElementById('boot-sequence');
        if (bootScreen) {
            bootScreen.classList.add('hidden');
        }
        
        // 현재 화면 상태에 따라 적절한 화면 표시
        if (window.sessionManager) {
            const currentScreen = sessionManager.getCurrentScreen();
            const isLoggedIn = sessionManager.isLoggedIn();
            console.log('Current screen:', currentScreen);
            console.log('Is logged in:', isLoggedIn);
            
            if (isLoggedIn && currentScreen === 'main') {
                // 로그인된 상태이고 메인 화면이면 메인 앱 표시
                console.log('Showing main app');
                this.showMainApp();
            } else if (currentScreen === 'register') {
                // 회원가입 화면이면 회원가입 화면 표시
                console.log('Showing register screen');
                this.showRegisterScreen();
            } else {
                // 기본적으로 로그인 화면 표시
                console.log('Showing login screen');
                this.showLoginScreen();
            }
        } else {
            // 세션 매니저가 없으면 로그인 화면 표시
            console.log('No session manager, showing login screen');
            this.showLoginScreen();
        }
    }

    // 메인 앱 표시
    showMainApp() {
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.classList.remove('hidden');
            
            // 대기 중인 라우트가 있는지 확인
            if (window.sessionManager) {
                const pendingRoute = sessionManager.getPendingRoute();
                if (pendingRoute && window.router) {
                    // 대기 중인 라우트 처리
                    console.log('Processing pending route:', pendingRoute);
                    sessionManager.clearPendingRoute();
                    window.router.navigate(pendingRoute, true); // replace로 처리
                } else {
                    // 현재 뷰 복원
                    const currentView = sessionManager.getCurrentView();
                    if (window.taaApp) {
                        taaApp.showView(currentView);
                    }
                }
            }
        }
    }
}

// 전역 인스턴스 생성
window.bootSequence = new BootSequence();

// 초기화 함수 - app.js에서 호출
function initializeBootSequence() {
    console.log('=== Initializing Boot Sequence ===');
    
    // 세션 매니저가 로드되었는지 확인
    if (window.sessionManager) {
        console.log('Session manager found');
        
        // 부팅 시퀀스 표시 여부 결정
        const shouldShow = sessionManager.shouldShowBootSequence();
        console.log('Should show boot sequence:', shouldShow);
        
        if (shouldShow) {
            // 부팅 시퀀스 시작
            console.log('Starting boot sequence');
            setTimeout(() => {
                bootSequence.start();
            }, 500);
        } else {
            // 부팅 시퀀스 건너뛰고 바로 메인 앱으로
            console.log('Skipping boot sequence');
            bootSequence.skipBootSequence();
        }
    } else {
        // 세션 매니저가 없으면 기본적으로 부팅 시퀀스 시작
        console.log('No session manager found - starting boot sequence');
        setTimeout(() => {
            bootSequence.start();
        }, 500);
    }
}

console.log('TAA Archives: Boot sequence component initialized');

// 즉시 부팅 시퀀스 시작 (간단한 방법)
setTimeout(() => {
    console.log('Starting boot sequence immediately...');
    if (window.bootSequence) {
        bootSequence.start();
    } else {
        console.error('Boot sequence not found');
    }
}, 1000); 