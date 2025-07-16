// TAA Archives - Admin Authentication Service
// 관리자 전용 인증 및 권한 관리

class AdminAuthService {
    constructor() {
        this.adminEmail = 'apostleloannes@internal.taa';
        this.isAdminLoggedIn = false;
        this.adminUser = null;
        this.setupEventListeners();
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
    }

    // 관리자 로그인
    async adminLogin() {
        const adminId = document.getElementById('admin-id').value.trim();
        const adminPassword = document.getElementById('admin-password').value;
        const statusElement = document.getElementById('admin-login-status');

        if (!adminId || !adminPassword) {
            this.showAdminMessage('모든 필드를 입력해주세요.', 'error');
            return;
        }

        // 관리자 ID 확인
        if (adminId !== 'apostleloannes') {
            this.showAdminMessage('잘못된 관리자 ID입니다.', 'error');
            return;
        }

        try {
            statusElement.textContent = 'ADMIN AUTHENTICATING...';
            statusElement.className = 'status-text';

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
        }
    }

    // 관리자 로그아웃
    async adminLogout() {
        try {
            await auth.signOut();
            this.isAdminLoggedIn = false;
            this.adminUser = null;
            
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

    // 관리자 메시지 표시
    showAdminMessage(message, type) {
        const statusElement = document.getElementById('admin-login-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-text ${type}-message`;
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
                        <p>보안등급: ${user.securityClearance || 1}</p>
                        <p>상태: ${user.isActive ? '활성' : '비활성'}</p>
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
            alert('콘텐츠 삭제 권한이 없습니다.');
            return;
        }

        if (!confirm('정말로 이 콘텐츠를 영구 삭제하시겠습니까?')) {
            return;
        }

        try {
            await db.collection('files').doc(contentId).delete();
            alert('콘텐츠가 영구 삭제되었습니다.');
            this.loadAllContent(); // 목록 새로고침
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('콘텐츠 삭제 중 오류가 발생했습니다.');
        }
    }

    // 사용자 상태 토글 (차단/해제)
    async toggleUserStatus(userId, currentStatus) {
        if (!this.checkAdminPermission('canBanUsers')) {
            alert('사용자 차단 권한이 없습니다.');
            return;
        }

        try {
            await db.collection('users').doc(userId).update({
                isActive: !currentStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`사용자가 ${!currentStatus ? '활성화' : '차단'}되었습니다.`);
            this.loadAllUsers(); // 목록 새로고침
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('사용자 상태 변경 중 오류가 발생했습니다.');
        }
    }

    // 사용자 삭제
    async deleteUser(userId) {
        if (!this.checkAdminPermission('canManageUsers')) {
            alert('사용자 삭제 권한이 없습니다.');
            return;
        }

        if (!confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await db.collection('users').doc(userId).delete();
            alert('사용자가 삭제되었습니다.');
            this.loadAllUsers(); // 목록 새로고침
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('사용자 삭제 중 오류가 발생했습니다.');
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

    // 관리자 로그인 상태 확인
    isAdmin() {
        return this.isAdminLoggedIn;
    }
}

// 전역 인스턴스 생성
const adminAuthService = new AdminAuthService();
window.adminAuthService = adminAuthService;

console.log('TAA Archives: Admin authentication service initialized'); 