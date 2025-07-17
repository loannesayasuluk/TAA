// TAA Archives - Admin Authentication Service
// 관리자 전용 인증 및 권한 관리

class AdminAuthService {
    constructor() {
        this.adminEmail = 'apostleloannes@internal.taa';
        this.adminPassword = 'eoqusdls0823!';
        this.isAdminLoggedIn = false;
        this.adminUser = null;
        this.realtimeListeners = new Map(); // 실시간 리스너 관리
        this.setupEventListeners();
        this.setupRealtimeListeners();
        this.updateTimestamp();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 관리자 로그인 폼
        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.adminLogin();
            });
        }

        // 관리자 로그아웃 버튼
        const adminLogoutBtn = document.getElementById('admin-logout-btn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                this.adminLogout();
            });
        }

        // 보안 확인 체크박스
        const securityConfirm = document.getElementById('admin-security-confirm');
        if (securityConfirm) {
            securityConfirm.addEventListener('change', () => {
                this.updateLoginButtonState();
            });
        }

        // 입력 필드 변경 감지
        const adminIdInput = document.getElementById('admin-id');
        const adminPasswordInput = document.getElementById('admin-password');
        
        if (adminIdInput) {
            adminIdInput.addEventListener('input', () => {
                this.updateLoginButtonState();
            });
        }
        
        if (adminPasswordInput) {
            adminPasswordInput.addEventListener('input', () => {
                this.updateLoginButtonState();
            });
        }
    }

    // 실시간 리스너 설정
    setupRealtimeListeners() {
        // 사용자 상태 변경 감지
        this.setupUserStatusListener();
        
        // 콘텐츠 변경 감지
        this.setupContentChangeListener();
        
        // 관리자 작업 로그 감지
        this.setupAdminActionListener();
    }

    // 사용자 상태 실시간 감지
    setupUserStatusListener() {
        const userListener = db.collection('users')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified') {
                        const userData = change.doc.data();
                        const userId = change.doc.id;
                        
                        // 현재 로그인한 사용자가 차단된 경우 즉시 로그아웃
                        if (window.authService && window.authService.getCurrentUser()) {
                            const currentUser = window.authService.getCurrentUser();
                            if (currentUser.uid === userId && !userData.isActive) {
                                this.handleUserBan(userData);
                            }
                        }
                        
                        // 관리자 대시보드에서 사용자 목록 업데이트
                        if (this.isAdminLoggedIn && this.currentTab === 'users') {
                            this.loadAllUsers();
                        }
                    }
                });
            });
        
        this.realtimeListeners.set('users', userListener);
    }

    // 콘텐츠 변경 실시간 감지
    setupContentChangeListener() {
        const contentListener = db.collection('files')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'removed') {
                        const fileId = change.doc.id;
                        
                        // 현재 보고 있는 파일이 삭제된 경우 홈페이지로 이동
                        if (window.router && window.router.getCurrentRoute() === `/article/${fileId}`) {
                            window.router.navigate('/');
                            this.showGlobalMessage('관리자에 의해 해당 콘텐츠가 삭제되었습니다.', 'warning');
                        }
                        
                        // 관리자 대시보드에서 콘텐츠 목록 업데이트
                        if (this.isAdminLoggedIn && this.currentTab === 'content') {
                            this.loadAllContent();
                        }
                    }
                });
            });
        
        this.realtimeListeners.set('content', contentListener);
    }

    // 관리자 작업 로그 실시간 감지
    setupAdminActionListener() {
        const actionListener = db.collection('adminActions')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                // 관리자 대시보드에서 최근 작업 표시
                if (this.isAdminLoggedIn) {
                    this.updateAdminActionLog(snapshot.docs);
                }
            });
        
        this.realtimeListeners.set('actions', actionListener);
    }

    // 사용자 차단 처리
    handleUserBan(userData) {
        // 즉시 로그아웃
        if (window.authService) {
            window.authService.logout();
        }
        
        // 차단 메시지 표시
        this.showGlobalMessage(`관리자에 의해 계정이 차단되었습니다. (사유: ${userData.banReason || '정책 위반'})`, 'error');
        
        // 로그인 화면으로 이동
        if (window.router) {
            window.router.navigate('/login');
        }
    }

    // 전역 메시지 표시
    showGlobalMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.global-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `global-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-text">${message}</span>
                <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // 메시지 스타일 적용
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ff8800' : '#0088ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-family: 'Courier New', monospace;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(messageDiv);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // 관리자 작업 로그 로드
    async loadAdminActions() {
        try {
            const actionLog = document.getElementById('admin-action-log');
            if (!actionLog) return;

            const snapshot = await db.collection('adminActions')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            actionLog.innerHTML = '';
            
            if (snapshot.empty) {
                actionLog.innerHTML = '<p class="no-data">작업 로그가 없습니다.</p>';
                return;
            }

            snapshot.docs.forEach(doc => {
                const action = doc.data();
                const actionItem = document.createElement('div');
                actionItem.className = 'admin-action-item';
                
                const actionTypeText = this.getActionTypeText(action.actionType);
                const actionDetails = this.getActionDetails(action);
                
                actionItem.innerHTML = `
                    <div class="action-header">
                        <span class="action-type ${action.actionType.toLowerCase()}">${actionTypeText}</span>
                        <span class="action-time">${this.formatDate(action.timestamp)}</span>
                    </div>
                    <div class="action-target">대상: ${action.target}</div>
                    <div class="action-admin">관리자: ${action.adminName}</div>
                    ${actionDetails ? `<div class="action-details">${actionDetails}</div>` : ''}
                `;
                actionLog.appendChild(actionItem);
            });

        } catch (error) {
            console.error('Error loading admin actions:', error);
        }
    }

    // 작업 타입 텍스트 변환
    getActionTypeText(actionType) {
        const actionTypes = {
            'USER_BAN': '사용자 차단',
            'USER_UNBAN': '사용자 해제',
            'USER_DELETE': '사용자 삭제',
            'CONTENT_DELETE': '콘텐츠 삭제',
            'CLEARANCE_UPDATE': '보안등급 변경'
        };
        return actionTypes[actionType] || actionType;
    }

    // 작업 상세 정보 생성
    getActionDetails(action) {
        if (!action.details) return '';
        
        const details = action.details;
        let detailsText = '';
        
        switch (action.actionType) {
            case 'USER_BAN':
                detailsText = `차단 사유: ${details.reason || '정책 위반'}`;
                break;
            case 'USER_DELETE':
                detailsText = `삭제된 파일: ${details.deletedFiles}개, 삭제된 댓글: ${details.deletedComments}개`;
                break;
            case 'CONTENT_DELETE':
                detailsText = `작성자: ${details.authorName}, 삭제된 댓글: ${details.deletedComments}개`;
                break;
            case 'CLEARANCE_UPDATE':
                detailsText = `Level ${details.oldClearance} → Level ${details.newClearance}`;
                break;
        }
        
        return detailsText;
    }

    // 관리자 작업 로그 업데이트 (실시간용)
    updateAdminActionLog(actions) {
        const actionLog = document.getElementById('admin-action-log');
        if (!actionLog) return;
        
        // 실시간 업데이트는 현재 탭이 actions일 때만
        if (this.currentTab === 'actions') {
            this.loadAdminActions();
        }
    }

    // 관리자 작업 로그 기록
    async logAdminAction(actionType, target, details = {}) {
        try {
            await db.collection('adminActions').add({
                actionType: actionType,
                target: target,
                details: details,
                adminId: this.adminUser.uid,
                adminName: this.adminUser.displayName || this.adminUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    // 관리자 로그인
    async adminLogin() {
        const adminId = document.getElementById('admin-id').value.trim();
        const adminPassword = document.getElementById('admin-password').value;
        const securityConfirm = document.getElementById('admin-security-confirm').checked;
        const statusElement = document.getElementById('admin-login-status');
        const loginBtn = document.querySelector('.admin-login-btn');

        // 입력 검증
        if (!adminId || !adminPassword) {
            this.showAdminMessage('모든 필드를 입력해주세요.', 'error');
            return;
        }

        if (!securityConfirm) {
            this.showAdminMessage('보안 확인을 체크해주세요.', 'error');
            return;
        }

        // 관리자 ID 확인
        if (adminId !== 'apostleloannes') {
            this.showAdminMessage('잘못된 관리자 ID입니다.', 'error');
            return;
        }

        // 로딩 상태 시작
        this.setLoadingState(true);

        try {
            statusElement.textContent = 'ADMIN AUTHENTICATING...';
            statusElement.className = 'status-message';

            // Firebase Auth로 로그인
            const userCredential = await auth.signInWithEmailAndPassword(
                this.adminEmail,
                adminPassword
            );

            const user = userCredential.user;

            // Firestore에서 관리자 권한 확인
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                await auth.signOut();
                this.showAdminMessage('관리자 계정을 찾을 수 없습니다.', 'error');
                return;
            }

            const userData = userDoc.data();
            
            if (userData.role !== 'admin') {
                await auth.signOut();
                this.showAdminMessage('관리자 권한이 없습니다.', 'error');
                return;
            }

            // 관리자 로그인 성공
            this.isAdminLoggedIn = true;
            this.adminUser = {
                ...user,
                ...userData
            };

            this.showAdminMessage('관리자 인증 성공', 'success');
            
            // 관리자 작업 로그 기록
            await this.logAdminAction('ADMIN_LOGIN', 'System Access', {
                adminId: adminId,
                loginTime: new Date().toISOString()
            });
            
            // 관리자 기능 표시
            if (window.taaApp) {
                window.taaApp.showAdminFeatures();
            }
            
            // 관리자 대시보드로 이동
            setTimeout(() => {
                if (window.router) {
                    window.router.navigate('/admin');
                } else {
                    this.showAdminDashboard();
                }
            }, 1000);

        } catch (error) {
            console.error('Admin login error:', error);
            let errorMessage = '관리자 인증 실패';

            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = '잘못된 비밀번호입니다';
                    break;
                case 'auth/user-not-found':
                    errorMessage = '관리자 계정을 찾을 수 없습니다';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = '너무 많은 시도. 나중에 다시 시도해주세요';
                    break;
                default:
                    errorMessage = '시스템 오류. 관리자에게 문의하세요';
            }

            this.showAdminMessage(errorMessage, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    // 관리자 로그아웃
    async adminLogout() {
        try {
            await auth.signOut();
            this.isAdminLoggedIn = false;
            this.adminUser = null;
            
            // 실시간 리스너 정리
            this.cleanupRealtimeListeners();
            
            // 관리자 기능 숨기기
            if (window.taaApp) {
                window.taaApp.hideAdminFeatures();
            }
            
            // 관리자 대시보드 숨기기
            if (window.adminDashboard) {
                window.adminDashboard.hide();
            }
            
            // 메인 페이지로 이동
            if (window.router) {
                window.router.navigate('/');
            } else {
                window.location.href = '/';
            }
            
        } catch (error) {
            console.error('Admin logout error:', error);
        }
    }

    // 실시간 리스너 정리
    cleanupRealtimeListeners() {
        this.realtimeListeners.forEach((listener, key) => {
            if (listener && typeof listener === 'function') {
                listener();
            }
        });
        this.realtimeListeners.clear();
    }

    // 관리자 메시지 표시
    showAdminMessage(message, type) {
        const statusElement = document.getElementById('admin-login-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-message ${type}`;
        }
    }

    // 로딩 상태 설정
    setLoadingState(isLoading) {
        const loginBtn = document.querySelector('.login-button');
        if (loginBtn) {
            if (isLoading) {
                loginBtn.classList.add('loading');
                loginBtn.disabled = true;
            } else {
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
            }
        }
    }

    // 로그인 버튼 상태 업데이트
    updateLoginButtonState() {
        const adminId = document.getElementById('admin-id')?.value.trim();
        const adminPassword = document.getElementById('admin-password')?.value;
        const securityConfirm = document.getElementById('admin-security-confirm')?.checked;
        const loginBtn = document.querySelector('.login-button');

        if (loginBtn) {
            const isValid = adminId && adminPassword && securityConfirm;
            loginBtn.disabled = !isValid;
            
            if (isValid) {
                loginBtn.style.opacity = '1';
                loginBtn.style.cursor = 'pointer';
            } else {
                loginBtn.style.opacity = '0.6';
                loginBtn.style.cursor = 'not-allowed';
            }
        }
    }

    // 타임스탬프 업데이트
    updateTimestamp() {
        const timestampElement = document.getElementById('admin-timestamp');
        if (timestampElement) {
            const now = new Date();
            const timestamp = now.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timestampElement.textContent = timestamp;
        }
    }

    // 관리자 권한 확인
    checkAdminPermission(permission) {
        if (!this.adminUser || !this.adminUser.permissions) {
            return false;
        }
        return this.adminUser.permissions[permission] === true;
    }

    // 관리자 대시보드 표시
    showAdminDashboard() {
        const adminLoginScreen = document.getElementById('admin-login-screen');
        
        if (adminLoginScreen) adminLoginScreen.classList.add('hidden');
        
        // 관리자 대시보드 컴포넌트 사용
        if (window.adminDashboard) {
            window.adminDashboard.show();
        }
        
        // 관리자 대시보드 초기화
        this.initializeAdminDashboard();
    }

    // 관리자 로그인 화면 표시
    showAdminLoginScreen() {
        const adminLoginScreen = document.getElementById('admin-login-screen');
        if (adminLoginScreen) {
            adminLoginScreen.classList.remove('hidden');
            this.updateTimestamp();
            this.updateLoginButtonState();
        }
    }

    // 관리자 대시보드 초기화
    async initializeAdminDashboard() {
        // 콘텐츠 관리 탭 초기화
        await this.loadAllContent();
        
        // 사용자 관리 탭 초기화
        await this.loadAllUsers();
    }

    // 모든 콘텐츠 로드
    async loadAllContent() {
        try {
            const contentList = document.getElementById('admin-content-list');
            if (!contentList) return;

            const snapshot = await db.collection('files').orderBy('createdAt', 'desc').get();
            const files = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            contentList.innerHTML = '';
            
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'admin-content-item';
                fileItem.innerHTML = `
                    <div class="content-info">
                        <h3>${file.title}</h3>
                        <p>작성자: ${file.authorName || 'Unknown'}</p>
                        <p>생성일: ${this.formatDate(file.createdAt)}</p>
                        <p>보안등급: ${file.requiredClearance}</p>
                    </div>
                    <div class="content-actions">
                        <button class="terminal-btn small" onclick="adminAuthService.viewContent('${file.id}')">보기</button>
                        <button class="terminal-btn small warning" onclick="adminAuthService.deleteContent('${file.id}')">영구삭제</button>
                    </div>
                `;
                contentList.appendChild(fileItem);
            });

        } catch (error) {
            console.error('Error loading content:', error);
        }
    }

    // 모든 사용자 로드
    async loadAllUsers() {
        try {
            const userList = document.getElementById('admin-user-list');
            if (!userList) return;

            const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            userList.innerHTML = '';
            
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'admin-user-item';
                userItem.innerHTML = `
                    <div class="user-info">
                        <h3>${user.displayName || user.email}</h3>
                        <p>Agent ID: ${user.agentId || 'N/A'}</p>
                        <p>이메일: ${user.email}</p>
                        <p>보안등급: 
                            <select class="clearance-select" onchange="adminAuthService.updateUserClearance('${user.id}', this.value)">
                                <option value="1" ${user.securityClearance === 1 ? 'selected' : ''}>Level 1</option>
                                <option value="2" ${user.securityClearance === 2 ? 'selected' : ''}>Level 2</option>
                                <option value="3" ${user.securityClearance === 3 ? 'selected' : ''}>Level 3</option>
                                <option value="4" ${user.securityClearance === 4 ? 'selected' : ''}>Level 4</option>
                                <option value="5" ${user.securityClearance === 5 ? 'selected' : ''}>Level 5</option>
                            </select>
                        </p>
                        <p>상태: <span class="status-${user.isActive ? 'active' : 'banned'}">${user.isActive ? '활성' : '차단'}</span></p>
                        ${user.banReason ? `<p>차단사유: ${user.banReason}</p>` : ''}
                    </div>
                    <div class="user-actions">
                        <button class="terminal-btn small" onclick="adminAuthService.toggleUserStatus('${user.id}', ${user.isActive})">
                            ${user.isActive ? '차단' : '해제'}
                        </button>
                        <button class="terminal-btn small warning" onclick="adminAuthService.deleteUser('${user.id}')">삭제</button>
                    </div>
                `;
                userList.appendChild(userItem);
            });

        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // 콘텐츠 보기
    viewContent(contentId) {
        if (window.router) {
            window.router.navigate(`/article/${contentId}`);
        }
    }

    // 콘텐츠 영구 삭제
    async deleteContent(contentId) {
        if (!this.checkAdminPermission('canDeleteContent')) {
            this.showGlobalMessage('콘텐츠 삭제 권한이 없습니다.', 'error');
            return;
        }

        if (!confirm('정말로 이 콘텐츠를 영구 삭제하시겠습니까?')) {
            return;
        }

        try {
            // 콘텐츠 정보 가져오기 (로깅용)
            const contentDoc = await db.collection('files').doc(contentId).get();
            const contentData = contentDoc.data();
            
            // 콘텐츠 삭제
            await db.collection('files').doc(contentId).delete();
            
            // 관련 댓글도 삭제
            const commentsSnapshot = await db.collection('comments')
                .where('fileId', '==', contentId)
                .get();
            
            const deletePromises = commentsSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);
            
            // 관리자 작업 로그 기록
            await this.logAdminAction('CONTENT_DELETE', contentData?.title || contentId, {
                contentId: contentId,
                authorId: contentData?.authorId,
                authorName: contentData?.authorName,
                deletedComments: commentsSnapshot.size
            });
            
            this.showGlobalMessage('콘텐츠가 영구 삭제되었습니다.', 'success');
            this.loadAllContent(); // 목록 새로고침
        } catch (error) {
            console.error('Error deleting content:', error);
            this.showGlobalMessage('콘텐츠 삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    // 사용자 상태 토글 (차단/해제)
    async toggleUserStatus(userId, currentStatus) {
        if (!this.checkAdminPermission('canBanUsers')) {
            this.showGlobalMessage('사용자 차단 권한이 없습니다.', 'error');
            return;
        }

        try {
            // 사용자 정보 가져오기
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            
            const newStatus = !currentStatus;
            const banReason = newStatus ? null : prompt('차단 사유를 입력하세요:') || '정책 위반';
            
            const updateData = {
                isActive: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (!newStatus) {
                updateData.banReason = banReason;
                updateData.bannedAt = firebase.firestore.FieldValue.serverTimestamp();
            } else {
                updateData.banReason = null;
                updateData.bannedAt = null;
            }
            
            await db.collection('users').doc(userId).update(updateData);

            // 관리자 작업 로그 기록
            await this.logAdminAction(
                newStatus ? 'USER_UNBAN' : 'USER_BAN', 
                userData?.displayName || userData?.email || userId,
                {
                    userId: userId,
                    reason: banReason,
                    previousStatus: currentStatus
                }
            );

            this.showGlobalMessage(`사용자가 ${newStatus ? '활성화' : '차단'}되었습니다.`, 'success');
            this.loadAllUsers(); // 목록 새로고침
        } catch (error) {
            console.error('Error toggling user status:', error);
            this.showGlobalMessage('사용자 상태 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    // 사용자 삭제
    async deleteUser(userId) {
        if (!this.checkAdminPermission('canManageUsers')) {
            this.showGlobalMessage('사용자 삭제 권한이 없습니다.', 'error');
            return;
        }

        if (!confirm('정말로 이 사용자를 삭제하시겠습니까?\n\n⚠️ 경고: 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            // 사용자 정보 가져오기
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            
            // 사용자가 작성한 모든 콘텐츠 삭제
            const userFilesSnapshot = await db.collection('files')
                .where('authorId', '==', userId)
                .get();
            
            const fileDeletePromises = userFilesSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(fileDeletePromises);
            
            // 사용자가 작성한 모든 댓글 삭제
            const userCommentsSnapshot = await db.collection('comments')
                .where('authorId', '==', userId)
                .get();
            
            const commentDeletePromises = userCommentsSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(commentDeletePromises);
            
            // 사용자 계정 삭제
            await db.collection('users').doc(userId).delete();
            
            // 관리자 작업 로그 기록
            await this.logAdminAction('USER_DELETE', userData?.displayName || userData?.email || userId, {
                userId: userId,
                deletedFiles: userFilesSnapshot.size,
                deletedComments: userCommentsSnapshot.size
            });

            this.showGlobalMessage('사용자와 관련 데이터가 모두 삭제되었습니다.', 'success');
            this.loadAllUsers(); // 목록 새로고침
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showGlobalMessage('사용자 삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    // 날짜 포맷팅
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 현재 관리자 정보 반환
    getCurrentAdmin() {
        return this.adminUser;
    }

    // 사용자 보안등급 변경
    async updateUserClearance(userId, newClearance) {
        if (!this.checkAdminPermission('canManageUsers')) {
            this.showGlobalMessage('사용자 권한 변경 권한이 없습니다.', 'error');
            return;
        }

        try {
            const clearance = parseInt(newClearance);
            if (clearance < 1 || clearance > 5) {
                this.showGlobalMessage('유효하지 않은 보안등급입니다.', 'error');
                return;
            }

            // 사용자 정보 가져오기
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            const oldClearance = userData.securityClearance || 1;

            await db.collection('users').doc(userId).update({
                securityClearance: clearance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 관리자 작업 로그 기록
            await this.logAdminAction('CLEARANCE_UPDATE', userData?.displayName || userData?.email || userId, {
                userId: userId,
                oldClearance: oldClearance,
                newClearance: clearance
            });

            this.showGlobalMessage(`사용자 보안등급이 Level ${oldClearance}에서 Level ${clearance}로 변경되었습니다.`, 'success');
        } catch (error) {
            console.error('Error updating user clearance:', error);
            this.showGlobalMessage('보안등급 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    // 관리자 로그인 상태 확인
    isAdmin() {
        return this.isAdminLoggedIn;
    }
}

// 전역 인스턴스 생성
const adminAuthService = new AdminAuthService();
window.adminAuthService = adminAuthService;

console.log('TAA Archives: Admin authentication service initialized'); 