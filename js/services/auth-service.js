// TAA Archives - Authentication Service
// 사용자 인증 및 보안 등급 관리

class AuthService {
    constructor() {
        this.currentUser = null;
        this.securityClearance = 1;
        this.setupEventListeners();
        this.setupAuthStateListener();
    }

    setupEventListeners() {
        // 로그인 관련
        document.getElementById('login-btn')?.addEventListener('click', () => this.login());
        document.getElementById('password')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });

        // 회원가입 관련
        document.getElementById('register-btn')?.addEventListener('click', () => this.register());
        document.getElementById('register-confirm-password')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.register();
            }
        });

        // 중복 확인 버튼
        document.getElementById('check-agent-id-btn')?.addEventListener('click', () => this.checkAgentId());
        document.getElementById('check-email-btn')?.addEventListener('click', () => this.checkEmail());

        // 화면 전환
        document.getElementById('show-register-btn')?.addEventListener('click', () => this.showRegisterScreen());
        document.getElementById('show-login-btn')?.addEventListener('click', () => this.showLoginScreen());

        // 로그아웃
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

        // 마이그레이션 버튼 (관리자용)
        document.getElementById('migrate-accounts-btn')?.addEventListener('click', () => this.migrateAccounts());
    }

    setupAuthStateListener() {
        // Firebase Auth 상태 변경 감지
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserProfile();
                this.updateUI();
                
                // 로그인 상태 저장
                if (window.sessionManager) {
                    sessionManager.setLoggedIn();
                    sessionManager.setCurrentScreen('main');
                }
            } else {
                this.currentUser = null;
                this.securityClearance = 1;
                this.updateUI();
                
                // 로그아웃 상태 저장
                if (window.sessionManager) {
                    sessionManager.setLoggedOut();
                    sessionManager.setCurrentScreen('login');
                }
            }
        });
    }

    // 화면 전환 메서드
    showRegisterScreen() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('register-screen').classList.remove('hidden');
        this.clearFormMessages();
        
        // 현재 화면 상태 저장
        if (window.sessionManager) {
            sessionManager.setCurrentScreen('register');
        }
    }

    showLoginScreen() {
        document.getElementById('register-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        this.clearFormMessages();
        
        // 현재 화면 상태 저장
        if (window.sessionManager) {
            sessionManager.setCurrentScreen('login');
        }
    }

    clearFormMessages() {
        document.getElementById('login-status').textContent = '';
        document.getElementById('register-status').textContent = '';
    }

    // 로그인
    async login() {
        const identifier = document.getElementById('agent-id').value.trim();
        const password = document.getElementById('password').value;
        const statusElement = document.getElementById('login-status');

        if (!identifier || !password) {
            this.showFormMessage('login', '모든 필드를 입력해주세요.', 'error');
            return;
        }

        try {
            statusElement.textContent = 'AUTHENTICATING...';
            statusElement.className = 'status-text';
            
            // Agent ID 또는 이메일로 로그인
            const result = await userService.loginWithAgentIdOrEmail(identifier, password);
            
            // 로그인 방법에 따른 메시지
            const loginMethod = result.loginMethod === 'agentId' ? 'Agent ID' : '이메일';
            this.showFormMessage('login', `${loginMethod}로 인증 성공`, 'success');
            this.logLoginEvent('LOGIN_SUCCESS', { method: result.loginMethod });
            
            // 메인 앱으로 전환
            setTimeout(() => {
                this.showMainApp();
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = '인증 실패';
            
            if (error.message) {
                errorMessage = error.message;
            } else {
                switch (error.code) {
                    case 'auth/wrong-password':
                        errorMessage = '비밀번호가 올바르지 않습니다';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = '너무 많은 시도. 나중에 다시 시도해주세요';
                        break;
                    default:
                        errorMessage = '시스템 오류. 관리자에게 문의하세요';
                }
            }
            
            this.showFormMessage('login', errorMessage, 'error');
            this.logLoginEvent('LOGIN_FAILED', error.code);
        }
    }

    // 회원가입
    async register() {
        const agentId = document.getElementById('register-agent-id').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const clearance = parseInt(document.getElementById('register-clearance').value);
        const statusElement = document.getElementById('register-status');

        // 입력 검증
        if (!agentId || !email || !password || !confirmPassword) {
            this.showFormMessage('register', '모든 필드를 입력해주세요.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showFormMessage('register', '비밀번호가 일치하지 않습니다.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showFormMessage('register', '비밀번호는 최소 6자 이상이어야 합니다.', 'error');
            return;
        }

        try {
            statusElement.textContent = 'REGISTERING...';
            statusElement.className = 'status-text';
            
            // 사용자 서비스를 통한 등록
            const result = await userService.registerUser({
                agentId: agentId,
                email: email,
                password: password,
                clearance: clearance
            });
            
            this.showFormMessage('register', '등록 성공! 로그인 화면으로 이동합니다.', 'success');
            this.logLoginEvent('REGISTER_SUCCESS');
            
            // 로그인 화면으로 전환
            setTimeout(() => {
                this.showLoginScreen();
                // 입력 필드 초기화
                document.getElementById('agent-id').value = agentId;
                document.getElementById('password').value = '';
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = '등록 실패';
            
            if (error.message) {
                errorMessage = error.message;
            } else {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = '이미 등록된 이메일입니다';
                        break;
                    case 'auth/weak-password':
                        errorMessage = '비밀번호가 너무 약합니다';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = '올바르지 않은 이메일 형식입니다';
                        break;
                    default:
                        errorMessage = '시스템 오류. 관리자에게 문의하세요';
                }
            }
            
            this.showFormMessage('register', errorMessage, 'error');
            this.logLoginEvent('REGISTER_FAILED', error.code);
        }
    }

    // 폼 메시지 표시
    showFormMessage(formType, message, type) {
        const statusElement = document.getElementById(`${formType}-status`);
        statusElement.textContent = message;
        statusElement.className = `status-text ${type}-message`;
    }

    // Agent ID 중복 확인
    async checkAgentId() {
        const agentId = document.getElementById('register-agent-id').value.trim();
        const statusElement = document.getElementById('agent-id-status');
        const checkBtn = document.getElementById('check-agent-id-btn');

        if (!agentId) {
            statusElement.textContent = 'Agent ID를 입력해주세요.';
            statusElement.className = 'status-indicator error';
            return;
        }

        try {
            // 버튼 비활성화
            checkBtn.disabled = true;
            checkBtn.textContent = '확인중...';
            statusElement.textContent = '중복 확인 중...';
            statusElement.className = 'status-indicator checking';

            const result = await userService.checkAgentIdAvailability(agentId);

            if (result.available) {
                statusElement.textContent = result.message;
                statusElement.className = 'status-indicator available';
            } else {
                statusElement.textContent = result.message;
                statusElement.className = 'status-indicator unavailable';
            }
        } catch (error) {
            console.error('Agent ID 중복 확인 오류:', error);
            statusElement.textContent = '중복 확인 중 오류가 발생했습니다.';
            statusElement.className = 'status-indicator error';
        } finally {
            // 버튼 활성화
            checkBtn.disabled = false;
            checkBtn.textContent = '중복확인';
        }
    }

    // 이메일 중복 확인
    async checkEmail() {
        const email = document.getElementById('register-email').value.trim();
        const statusElement = document.getElementById('email-status');
        const checkBtn = document.getElementById('check-email-btn');

        if (!email) {
            statusElement.textContent = '이메일을 입력해주세요.';
            statusElement.className = 'status-indicator error';
            return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            statusElement.textContent = '올바른 이메일 형식을 입력해주세요.';
            statusElement.className = 'status-indicator error';
            return;
        }

        try {
            // 버튼 비활성화
            checkBtn.disabled = true;
            checkBtn.textContent = '확인중...';
            statusElement.textContent = '중복 확인 중...';
            statusElement.className = 'status-indicator checking';

            const result = await userService.checkEmailAvailability(email);

            if (result.available) {
                statusElement.textContent = result.message;
                statusElement.className = 'status-indicator available';
            } else {
                statusElement.textContent = result.message;
                statusElement.className = 'status-indicator unavailable';
            }
        } catch (error) {
            console.error('이메일 중복 확인 오류:', error);
            statusElement.textContent = '중복 확인 중 오류가 발생했습니다.';
            statusElement.className = 'status-indicator error';
        } finally {
            // 버튼 활성화
            checkBtn.disabled = false;
            checkBtn.textContent = '중복확인';
        }
    }

    // 사용자 프로필 로드
    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.securityClearance = userData.securityClearance || 1;
                this.currentUser.displayName = userData.displayName || this.currentUser.email;
            } else {
                // 새 사용자 프로필 생성
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            showNotification('사용자 프로필 로드 실패', 'error');
        }
    }

    // 사용자 프로필 생성
    async createUserProfile() {
        if (!this.currentUser) return;

        try {
            const userData = {
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || this.currentUser.email,
                securityClearance: 1,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };

            await db.collection('users').doc(this.currentUser.uid).set(userData);
            this.securityClearance = 1;
        } catch (error) {
            console.error('Error creating user profile:', error);
            showNotification('사용자 프로필 생성 실패', 'error');
        }
    }

    // 로그아웃
    async logout() {
        try {
            await auth.signOut();
            showNotification('로그아웃되었습니다', 'success');
            
            // 세션 초기화
            if (window.sessionManager) {
                sessionManager.clearSession();
                sessionManager.setCurrentScreen('login'); // 로그인 화면으로 설정
            }
            
            this.logLoginEvent('LOGOUT');
            this.showLoginScreen();
            
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('로그아웃 실패', 'error');
        }
    }

    // 메인 앱 표시
    showMainApp() {
        const loginScreen = document.getElementById('login-screen');
        const registerScreen = document.getElementById('register-screen');
        const mainApp = document.getElementById('main-app');
        
        loginScreen.classList.add('hidden');
        registerScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // 로그인 상태 및 화면 상태 저장
        if (window.sessionManager) {
            sessionManager.setLoggedIn();
            sessionManager.setCurrentScreen('main');
        }
        
        // 터미널 효과 시작
        if (window.terminalEffects) {
            terminalEffects.toggleFanSound(true);
        }
    }

    // 보안 등급 확인
    checkClearance(requiredClearance) {
        return this.securityClearance >= requiredClearance;
    }

    // 현재 사용자 정보 반환
    getCurrentUser() {
        return this.currentUser;
    }

    // 현재 보안 등급 반환
    getCurrentClearance() {
        return this.securityClearance;
    }

    // 파일 편집 권한 확인
    canEditFile(file) {
        if (!this.currentUser) return false;
        
        // 파일 작성자이거나 높은 보안 등급을 가진 경우
        return file.author === this.currentUser.uid || this.securityClearance >= 3;
    }

    // UI 업데이트
    updateUI() {
        if (this.currentUser) {
            document.getElementById('current-agent').textContent = this.currentUser.displayName || 'Unknown Agent';
            document.getElementById('current-clearance').textContent = this.securityClearance;
            
            // 관리자 권한에 따라 관리자 기능 표시
            const adminActions = document.getElementById('admin-actions');
            if (adminActions) {
                if (this.securityClearance >= 3) {
                    adminActions.style.display = 'block';
                } else {
                    adminActions.style.display = 'none';
                }
            }
        } else {
            document.getElementById('current-agent').textContent = 'UNKNOWN';
            document.getElementById('current-clearance').textContent = '1';
            
            // 관리자 기능 숨기기
            const adminActions = document.getElementById('admin-actions');
            if (adminActions) {
                adminActions.style.display = 'none';
            }
        }
    }

    // 로그인 이벤트 기록
    async logLoginEvent(eventType, details = null) {
        try {
            await db.collection('audit_logs').add({
                eventType: eventType,
                userId: this.currentUser?.uid || 'anonymous',
                userEmail: this.currentUser?.email || 'anonymous',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: details,
                ipAddress: 'unknown', // 실제로는 서버에서 IP를 가져와야 함
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error logging login event:', error);
        }
    }

    // 계정 마이그레이션 (관리자용)
    async migrateAccounts() {
        try {
            // 관리자 권한 확인
            if (this.securityClearance < 3) {
                showNotification('관리자 권한이 필요합니다.', 'error');
                return;
            }

            showNotification('계정 마이그레이션을 시작합니다...', 'info');
            
            const result = await userService.migrateExistingAccounts();
            
            showNotification(result.message, 'success');
            this.logAuditEvent('ACCOUNT_MIGRATION', {
                migratedCount: result.migratedCount
            });
            
        } catch (error) {
            console.error('마이그레이션 오류:', error);
            showNotification('마이그레이션 중 오류가 발생했습니다.', 'error');
        }
    }

    // 마이그레이션 상태 확인
    async checkMigrationStatus() {
        try {
            const status = await userService.checkMigrationStatus();
            console.log('마이그레이션 상태:', status);
            
            if (status.migrationNeeded) {
                showNotification(`${status.usersWithoutAgentId}개의 계정이 마이그레이션이 필요합니다.`, 'warning');
            }
            
            return status;
        } catch (error) {
            console.error('마이그레이션 상태 확인 오류:', error);
            return null;
        }
    }

    // 감사 이벤트 기록
    async logAuditEvent(eventType, details = null) {
        if (!this.currentUser) return;

        try {
            await db.collection('audit_logs').add({
                eventType: eventType,
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: details,
                clearance: this.securityClearance
            });
        } catch (error) {
            console.error('Error logging audit event:', error);
        }
    }
}

// 전역 인스턴스 생성
const authService = new AuthService();

console.log('TAA Archives: Authentication service initialized'); 