// TAA Archives - Client-side Router
// History API를 사용한 클라이언트 사이드 라우팅

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.defaultRoute = '/';
        
        // 라우트 정의
        this.defineRoutes();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 라우트 처리
        this.handleInitialRoute();
    }

    // 라우트 정의
    defineRoutes() {
        // 홈 페이지
        this.addRoute('/', {
            title: 'TAA Archives - Home',
            view: 'home',
            handler: () => this.showHomeView()
        });

        // 문서 페이지
        this.addRoute('/article/:id', {
            title: 'TAA Archives - Document',
            view: 'file',
            handler: (params) => this.showArticleView(params.id)
        });

        // 파일 생성 페이지
        this.addRoute('/create', {
            title: 'TAA Archives - Create Document',
            view: 'create',
            handler: () => this.showCreateView()
        });

        // 최근 파일 페이지
        this.addRoute('/recent', {
            title: 'TAA Archives - Recent Files',
            view: 'recent',
            handler: () => this.showRecentView()
        });

        // 히스토리 페이지
        this.addRoute('/history', {
            title: 'TAA Archives - History',
            view: 'history',
            handler: () => this.showHistoryView()
        });

        // 편집 페이지
        this.addRoute('/edit/:id', {
            title: 'TAA Archives - Edit Document',
            view: 'edit',
            handler: (params) => this.showEditView(params.id)
        });

        // 논의 페이지
        this.addRoute('/discussion/:id', {
            title: 'TAA Archives - Discussion',
            view: 'discussion',
            handler: (params) => this.showDiscussionView(params.id)
        });

        // 관리자 로그인 페이지
        this.addRoute('/admin-login', {
            title: 'TAA Archives - Admin Login',
            view: 'admin-login',
            handler: () => this.showAdminLoginView()
        });

        // 관리자 대시보드
        this.addRoute('/admin', {
            title: 'TAA Archives - Admin Dashboard',
            view: 'admin',
            handler: () => this.showAdminDashboardView()
        });

        // 포럼 메인 페이지
        this.addRoute('/forums', {
            title: 'TAA Archives - Agent Forums',
            view: 'forums',
            handler: () => this.showForumsMainView()
        });

        // 채널 페이지
        this.addRoute('/forums/:channelId', {
            title: 'TAA Archives - Channel',
            view: 'channel',
            handler: (params) => this.showChannelView(params.channelId)
        });

        // 스레드 페이지
        this.addRoute('/forums/:channelId/thread/:threadId', {
            title: 'TAA Archives - Thread',
            view: 'thread',
            handler: (params) => this.showThreadView(params.channelId, params.threadId)
        });

        // 스레드 생성 페이지
        this.addRoute('/forums/:channelId/create', {
            title: 'TAA Archives - Create Thread',
            view: 'create-thread',
            handler: (params) => this.showCreateThreadView(params.channelId)
        });
    }

    // 라우트 추가
    addRoute(path, config) {
        this.routes.set(path, config);
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 브라우저 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', (event) => {
            this.handleRouteChange();
        });

        // 페이지 로드 시 라우트 처리
        window.addEventListener('load', () => {
            this.handleRouteChange();
        });
    }

    // 초기 라우트 처리
    handleInitialRoute() {
        const path = window.location.pathname;
        
        // 세션 매니저가 있는지 확인
        if (window.sessionManager) {
            const sessionInfo = window.sessionManager.getSessionInfo();
            
            // 로그인된 상태인 경우
            if (sessionInfo.isLoggedIn) {
                console.log('User is logged in, handling route:', path);
                
                if (path === '/' || path === '') {
                    // 홈 페이지인 경우 홈으로 이동
                    this.navigate('/');
                } else {
                    // 특정 경로로 직접 접속한 경우 해당 경로 처리
                    this.handleRouteChange();
                }
                return;
            }
        }
        
        // 로그인되지 않은 상태이거나 세션 매니저가 없는 경우
        if (path === '/' || path === '') {
            // 홈 페이지인 경우 세션 상태 확인
            if (window.sessionManager && window.sessionManager.isLoggedIn()) {
                // 로그인된 상태면 홈으로, 아니면 로그인 화면으로
                this.navigate('/');
            } else {
                // 로그인되지 않은 상태면 현재 URL 유지 (부팅 시퀀스 처리)
                return;
            }
        } else {
            // 특정 경로로 직접 접속한 경우
            this.handleRouteChange();
        }
    }

    // 라우트 변경 처리
    handleRouteChange() {
        const path = window.location.pathname;
        const route = this.findRoute(path);
        
        if (route) {
            this.currentRoute = route;
            this.updatePageTitle(route.title);
            this.executeRouteHandler(route, path);
        } else {
            // 404 처리
            this.handleNotFound();
        }
    }

    // 라우트 찾기
    findRoute(path) {
        for (const [routePath, config] of this.routes) {
            if (this.matchRoute(routePath, path)) {
                return {
                    path: routePath,
                    config: config,
                    params: this.extractParams(routePath, path)
                };
            }
        }
        return null;
    }

    // 라우트 매칭
    matchRoute(routePath, currentPath) {
        if (routePath === currentPath) {
            return true;
        }

        // 파라미터가 있는 라우트 매칭
        const routeParts = routePath.split('/');
        const currentParts = currentPath.split('/');

        if (routeParts.length !== currentParts.length) {
            return false;
        }

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                // 파라미터 부분은 무시
                continue;
            }
            if (routeParts[i] !== currentParts[i]) {
                return false;
            }
        }

        return true;
    }

    // 파라미터 추출
    extractParams(routePath, currentPath) {
        const params = {};
        const routeParts = routePath.split('/');
        const currentParts = currentPath.split('/');

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1);
                params[paramName] = currentParts[i];
            }
        }

        return params;
    }

    // 라우트 핸들러 실행
    executeRouteHandler(route, path) {
        try {
            // 메인 앱이 로드되었는지 확인
            if (window.taaApp) {
                // 부드러운 전환 효과 시작
                this.startTransition();
                
                // 뷰 전환 (URL 업데이트 없이)
                if (route.config.view) {
                    window.taaApp.showViewWithoutRoute(route.config.view);
                }
                
                // 라우트 핸들러 실행
                if (route.config.handler) {
                    route.config.handler(route.params);
                }
                
                // 전환 효과 완료
                this.completeTransition();
            } else {
                // 메인 앱이 로드되지 않은 경우 대기
                setTimeout(() => {
                    this.executeRouteHandler(route, path);
                }, 100);
            }
        } catch (error) {
            console.error('Route handler execution error:', error);
            this.handleNotFound();
        }
    }

    // 전환 효과 시작
    startTransition() {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.style.opacity = '0';
            contentArea.style.transform = 'translateX(20px)';
            contentArea.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }
    }

    // 전환 효과 완료
    completeTransition() {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            setTimeout(() => {
                contentArea.style.opacity = '1';
                contentArea.style.transform = 'translateX(0)';
            }, 50);
        }
    }

    // 페이지 제목 업데이트
    updatePageTitle(title) {
        document.title = title;
    }

    // 404 처리
    handleNotFound() {
        console.log('Page not found:', window.location.pathname);
        this.navigate('/');
    }

    // 네비게이션
    navigate(path, replace = false) {
        if (replace) {
            window.history.replaceState(null, '', path);
        } else {
            window.history.pushState(null, '', path);
        }
        this.handleRouteChange();
    }

    // 홈 뷰 표시
    showHomeView() {
        if (window.taaApp) {
            window.taaApp.showViewWithoutRoute('home');
        }
    }

    // 문서 뷰 표시
    showArticleView(articleId) {
        if (window.taaApp && window.fileService) {
            window.taaApp.loadFile(articleId);
        }
    }

    // 생성 뷰 표시
    showCreateView() {
        if (window.taaApp) {
            window.taaApp.showViewWithoutRoute('create');
        }
    }

    // 최근 파일 뷰 표시
    showRecentView() {
        if (window.taaApp) {
            window.taaApp.showViewWithoutRoute('recent');
        }
    }

    // 히스토리 뷰 표시
    showHistoryView() {
        if (window.taaApp) {
            window.taaApp.showViewWithoutRoute('history');
        }
    }

    // 편집 뷰 표시
    showEditView(articleId) {
        if (window.taaApp && window.fileService) {
            window.taaApp.loadFile(articleId).then(() => {
                window.taaApp.editFile();
            });
        }
    }

    // 논의 뷰 표시
    showDiscussionView(articleId) {
        if (window.taaApp && window.fileService) {
            window.taaApp.loadFile(articleId).then(() => {
                window.taaApp.showView('discussion');
            });
        }
    }

    // 관리자 로그인 화면 표시
    showAdminLoginView() {
        console.log('Router: Showing admin login view');
        
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
        
        // 관리자 로그인 화면 표시 (새로운 메서드 사용)
        if (window.adminAuthService) {
            window.adminAuthService.showAdminLoginScreen();
        } else {
            // 폴백: 직접 표시
            const adminLoginScreen = document.getElementById('admin-login-screen');
            if (adminLoginScreen) {
                console.log('Router: Admin login screen found, showing...');
                adminLoginScreen.classList.remove('hidden');
                adminLoginScreen.style.opacity = '0';
                setTimeout(() => {
                    adminLoginScreen.style.opacity = '1';
                }, 100);
            } else {
                console.error('Router: Admin login screen not found!');
            }
        }
    }

    // 관리자 대시보드 표시
    showAdminDashboardView() {
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
            if (window.adminDashboard) {
                adminDashboard.loadAdminData();
            }
        }
    }

    // 포럼 메인 페이지 표시
    showForumsMainView() {
        if (window.forumsMain) {
            window.forumsMain.loadChannels();
        }
    }

    // 채널 페이지 표시
    showChannelView(channelId) {
        if (window.channelPage) {
            window.channelPage.loadChannel(channelId);
        }
    }

    // 스레드 페이지 표시
    showThreadView(channelId, threadId) {
        if (window.threadPage) {
            window.threadPage.loadThread(channelId, threadId);
        }
    }

    // 스레드 생성 페이지 표시
    showCreateThreadView(channelId) {
        // 스레드 생성 페이지 초기화
        window.currentChannelId = channelId;
    }

    // 현재 라우트 정보 반환
    getCurrentRoute() {
        return this.currentRoute;
    }

    // 현재 경로 반환
    getCurrentPath() {
        return window.location.pathname;
    }
}

// 전역 인스턴스 생성
const router = new Router();
window.router = router;

console.log('TAA Archives: Router initialized'); 