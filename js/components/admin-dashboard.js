// TAA Archives - Admin Dashboard Component
// 관리자 대시보드 탭 및 기능 관리

class AdminDashboard {
    constructor() {
        this.currentTab = 'content';
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 탭 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('admin-tab')) {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            }
        });
    }

    // 탭 전환
    switchTab(tabName) {
        // 모든 탭 비활성화
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 선택된 탭 활성화
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}-tab`);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');

        this.currentTab = tabName;

        // 탭별 데이터 로드
        this.loadTabData(tabName);
    }

    // 탭별 데이터 로드
    async loadTabData(tabName) {
        switch (tabName) {
            case 'content':
                if (window.adminAuthService) {
                    await window.adminAuthService.loadAllContent();
                }
                break;
            case 'users':
                if (window.adminAuthService) {
                    await window.adminAuthService.loadAllUsers();
                }
                break;
        }
    }

    // 관리자 대시보드 초기화
    async initialize() {
        // 기본 탭 설정
        this.switchTab('content');
        
        // 관리자 정보 업데이트
        this.updateAdminInfo();
    }

    // 관리자 정보 업데이트
    updateAdminInfo() {
        const adminUserInfo = document.getElementById('admin-user-info');
        if (adminUserInfo && window.adminAuthService) {
            const admin = window.adminAuthService.getCurrentAdmin();
            if (admin) {
                adminUserInfo.textContent = `ADMIN: ${admin.displayName || admin.email}`;
            }
        }
    }

    // 관리자 대시보드 표시
    show() {
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
            this.initialize();
        }
    }

    // 관리자 대시보드 숨기기
    hide() {
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.add('hidden');
        }
    }
}

// 전역 인스턴스 생성
const adminDashboard = new AdminDashboard();
window.adminDashboard = adminDashboard;

console.log('TAA Archives: Admin dashboard component initialized'); 