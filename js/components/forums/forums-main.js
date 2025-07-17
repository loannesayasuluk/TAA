// TAA Archives - Forums Main Component
// 모든 포럼 채널 목록을 보여주는 메인 페이지

class ForumsMain {
    constructor(containerId = 'forums-main-view') {
        this.containerId = containerId;
        this.container = null;
        this.channels = [];
        this.filteredChannels = [];
        this.isLoading = false;
        this.searchQuery = '';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.isLoadingMore = false;
        this.language = this.getLanguage();
        this.unsubscribe = null;
        this.forumService = window.forumService;
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        console.log(`ForumsMain: Initializing with container ID '${this.containerId}'`);
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`ForumsMain: Container with id '${this.containerId}' not found`);
            return;
        }
        
        console.log('ForumsMain: Container found, setting up components...');
        this.setupEventListeners();
        this.setupOfflineSupport();
        this.loadChannels();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 채널 클릭 이벤트는 동적으로 추가됨
        // 키보드 네비게이션 설정
        this.setupKeyboardNavigation();

        // 검색 기능
        const searchInput = this.container.querySelector('#channels-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterChannels(e.target.value);
            });
        }

        // 새로고침 버튼
        const refreshBtn = this.container.querySelector('#refresh-channels-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadChannels();
            });
        }

        // 관리자용 채널 생성 버튼
        const createChannelBtn = this.container.querySelector('#create-channel-btn');
        if (createChannelBtn) {
            createChannelBtn.addEventListener('click', () => {
                this.showCreateChannelModal();
            });
        }
    }

    // 채널 목록 로드
    async loadChannels() {
        const startTime = performance.now();
        
        try {
            this.isLoading = true;
            this.showLoading();

            // 기본 채널 목록 (실제로는 API에서 가져옴)
            this.channels = [
                {
                    id: 'general-discussion',
                    name: '일반 토론',
                    description: '에이전트 간 일반 주제 및 토론',
                    threadCount: 156,
                    lastActivity: new Date(),
                    isActive: true
                },
                {
                    id: 'classified-intel',
                    name: '기밀 정보',
                    description: '기밀 정보 공유 및 분석',
                    threadCount: 89,
                    lastActivity: new Date(Date.now() - 3600000),
                    isActive: true,
                    requiredClearance: 3
                },
                {
                    id: 'mission-reports',
                    name: '임무 보고서',
                    description: '현장 임무 보고서 및 브리핑',
                    threadCount: 234,
                    lastActivity: new Date(Date.now() - 7200000),
                    isActive: true,
                    requiredClearance: 2
                },
                {
                    id: 'technical-support',
                    name: '기술 지원',
                    description: '기술 문제 및 시스템 지원',
                    threadCount: 67,
                    lastActivity: new Date(Date.now() - 1800000),
                    isActive: true
                },
                {
                    id: 'agent-training',
                    name: '에이전트 교육',
                    description: '교육 자료 및 기술 개발',
                    threadCount: 123,
                    lastActivity: new Date(Date.now() - 5400000),
                    isActive: true
                },
                {
                    id: 'classified-operations',
                    name: '기밀 작전',
                    description: '최고 기밀 작전 및 계획',
                    threadCount: 45,
                    lastActivity: new Date(Date.now() - 10800000),
                    isActive: true,
                    requiredClearance: 4
                }
            ];

            this.filteredChannels = [...this.channels];

            // 기존 구독 해제
            if (this.unsubscribe) {
                this.unsubscribe();
            }

            // 실시간 리스너 설정
            this.unsubscribe = this.forumService.subscribeToChannels((channels) => {
                this.channels = channels;
                this.render();
                this.hideLoading();
            });

            this.render();
            this.measurePerformance('loadChannels', startTime);
        } catch (error) {
            console.error('ForumsMain: Error loading channels:', error);
            this.showError('채널 목록을 불러오는데 실패했습니다.');
            this.hideLoading();
        }
    }

    // 채널 목록 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="forums-header">
                <h1>에이전트 포럼</h1>
                <p>정보 공유 및 협업 플랫폼</p>
                <div class="forums-actions">
                    <button id="refresh-forums-btn" class="terminal-btn small">새로고침</button>
                    <button id="notifications-toggle-btn" class="terminal-btn small">알림</button>
                    <button id="dark-mode-toggle-btn" class="terminal-btn small">다크 모드</button>
                </div>
            </div>
            
            <div class="forums-content">
                <div class="channels-section">
                    <div class="channels-header">
                        <h2>사용 가능한 채널</h2>
                        <div class="channels-search">
                            <input type="text" id="channels-search" class="search-input" placeholder="채널 검색...">
                        </div>
                    </div>
                    <div class="channels-grid" id="channels-grid">
                        ${this.filteredChannels.map(channel => this.createChannelCard(channel)).join('')}
                    </div>
                </div>
                
                <div class="forums-sidebar">
                    <div class="sidebar-section">
                        <h3>포럼 통계</h3>
                        <div class="stats-list">
                            <div class="stat-item">
                                <span class="stat-label">총 채널:</span>
                                <span class="stat-value">${this.channels.length}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">총 스레드:</span>
                                <span class="stat-value">${this.channels.reduce((sum, ch) => sum + ch.threadCount, 0)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">활성 에이전트:</span>
                                <span class="stat-value">${this.getActiveAgentsCount()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">새 게시물:</span>
                                <span class="stat-value" id="new-posts-count">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3>최근 활동</h3>
                        <div class="recent-activity" id="recent-activity">
                            ${this.getRecentActivity()}
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3>빠른 작업</h3>
                        <div class="quick-actions">
                            <button id="create-thread-btn" class="terminal-btn">스레드 생성</button>
                            <button id="view-my-posts-btn" class="terminal-btn">내 게시물</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupChannelClickEvents();
        this.setupActionButtons();
        this.setupSearch();
        this.startRealTimeUpdates();
    }

    // 채널 카드 생성
    createChannelCard(channel) {
        const canAccess = this.canAccessChannel(channel);
        const lastActivityFormatted = this.formatDate(channel.lastActivity);
        
        return `
            <div class="channel-card ${canAccess ? '' : 'restricted'}" 
                 data-channel-id="${channel.id}"
                 tabindex="${canAccess ? '0' : '-1'}"
                 role="button"
                 aria-label="${channel.name} - ${channel.description}"
                 aria-describedby="channel-${channel.id}-stats"
                 ${canAccess ? 'onkeydown="if(event.key===\'Enter\')this.click()"' : ''}>
                <div class="channel-header">
                    <h3 class="channel-name"># ${channel.name}</h3>
                    ${channel.requiredClearance ? `<span class="clearance-badge" aria-label="Required clearance level ${channel.requiredClearance}">Level ${channel.requiredClearance}</span>` : ''}
                </div>
                
                <p class="channel-description">${channel.description}</p>
                
                <div class="channel-stats" id="channel-${channel.id}-stats">
                    <span class="stat">
                        <span class="stat-icon" aria-hidden="true">📄</span>
                        <span class="sr-only">스레드 수:</span>
                        ${channel.threadCount}개 스레드
                    </span>
                    <span class="stat">
                        <span class="stat-icon" aria-hidden="true">🕒</span>
                        <span class="sr-only">마지막 활동:</span>
                        ${lastActivityFormatted}
                    </span>
                </div>
                
                ${!canAccess ? '<div class="access-denied" role="alert">보안 등급이 부족합니다</div>' : ''}
            </div>
        `;
    }

    // 채널 접근 권한 확인
    canAccessChannel(channel) {
        if (!channel.requiredClearance) return true;
        
        if (window.sessionManager) {
            const user = sessionManager.getCurrentUser();
            return user && user.securityClearance >= channel.requiredClearance;
        }
        
        return false;
    }

    // 채널 클릭 이벤트 설정
    setupChannelClickEvents() {
        const channelCards = this.container.querySelectorAll('.channel-card');
        
        channelCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // 버튼 클릭이 아닌 카드 클릭만 처리
                if (e.target.tagName === 'BUTTON') return;
                
                const channelId = card.dataset.channelId;
                this.navigateToChannel(channelId);
            });
        });
    }

    // 채널로 이동
    navigateToChannel(channelId) {
        if (window.router) {
            window.router.navigate(`/forums/${channelId}`);
        } else {
            // 폴백: 직접 뷰 전환
            if (window.taaApp) {
                window.taaApp.showView('channel');
                // 채널 데이터 전달
                window.currentChannelId = channelId;
            }
        }
    }

    // 접근 거부 메시지
    showAccessDenied() {
        if (window.terminalEffects) {
            terminalEffects.showError('이 채널에 접근할 보안 등급이 부족합니다.');
        }
    }

    // 활성 에이전트 수 계산
    getActiveAgentsCount() {
        // 실제로는 API에서 가져와야 함
        return Math.floor(Math.random() * 50) + 20;
    }

    // 최근 활동 가져오기
    getRecentActivity() {
        const activities = [
            { agent: '에이전트_알파', action: '일반 토론에 게시', time: '2분 전' },
            { agent: '에이전트_베타', action: '임무 보고서에 답변', time: '5분 전' },
            { agent: '에이전트_감마', action: '기술 지원에 스레드 생성', time: '12분 전' },
            { agent: '에이전트_델타', action: '기밀 정보 검증', time: '18분 전' },
            { agent: '에이전트_에코', action: '임무 보고서 업데이트', time: '25분 전' }
        ];

        return activities.map(activity => `
            <div class="activity-item">
                <span class="activity-agent">${activity.agent}</span>
                <span class="activity-action">${activity.action}</span>
                <span class="activity-time">${activity.time}</span>
            </div>
        `).join('');
    }

    // 날짜 포맷팅
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    // 로딩 상태 표시
    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <span>포럼을 불러오는 중...</span>
                </div>
            `;
        }
    }

    // 로딩 상태 숨기기
    hideLoading() {
        const loadingContainer = this.container.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    }

    // 에러 상태 표시
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>오류</h3>
                    <p>${message}</p>
                    <button class="terminal-btn" onclick="window.forumsMain.loadChannels()">
                        다시 시도
                    </button>
                </div>
            `;
        }
    }

    // 컴포넌트 정리
    cleanup() {
        // 이벤트 리스너 정리
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    // 새로운 스레드 생성 버튼 설정
    setupActionButtons() {
        const createThreadBtn = this.container.querySelector('#create-thread-btn');
        if (createThreadBtn) {
            createThreadBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate('/forums/new');
                }
            });
        }

        const viewMyPostsBtn = this.container.querySelector('#view-my-posts-btn');
        if (viewMyPostsBtn) {
            viewMyPostsBtn.addEventListener('click', () => {
                if (window.router) {
                    window.router.navigate('/forums/my-posts');
                }
            });
        }

        const darkModeToggleBtn = this.container.querySelector('#dark-mode-toggle-btn');
        if (darkModeToggleBtn) {
            darkModeToggleBtn.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
    }

    // 다크 모드 토글
    toggleDarkMode() {
        const body = document.body;
        const isDarkMode = body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        } else {
            body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        }
    }

    // 실시간 알림 기능 시작
    startRealTimeUpdates() {
        // 실제로는 WebSocket을 사용하여 구현해야 함
        // 여기서는 간단한 타이머를 사용하여 예시를 보여줌
        setInterval(() => {
            const newPostsCount = Math.floor(Math.random() * 10) + 1;
            const recentActivity = this.getRecentActivity();
            const recentActivityElement = this.container.querySelector('#recent-activity');
            if (recentActivityElement) {
                recentActivityElement.innerHTML = recentActivity;
            }
            const newPostsCountElement = this.container.querySelector('#new-posts-count');
            if (newPostsCountElement) {
                newPostsCountElement.textContent = newPostsCount;
            }
        }, 5000);
    }

    // 성능 모니터링
    measurePerformance(action, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`ForumsMain: ${action} took ${duration.toFixed(2)}ms`);
        
        // 성능 데이터를 분석 서비스로 전송
        if (duration > 1000) {
            console.warn(`ForumsMain: Slow performance detected for ${action}`);
        }
        
        return duration;
    }

    // 검색 기능 설정
    setupSearch() {
        const searchInput = this.container.querySelector('#channels-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterChannels();
            });
        }
    }

    // 채널 필터링
    filterChannels() {
        if (!this.searchQuery) {
            this.filteredChannels = [...this.channels];
        } else {
            this.filteredChannels = this.channels.filter(channel => 
                channel.name.toLowerCase().includes(this.searchQuery) ||
                channel.description.toLowerCase().includes(this.searchQuery)
            );
        }
        this.currentPage = 1;
        this.renderChannelsGrid();
    }

    // 페이지네이션된 채널 목록 가져오기
    getPaginatedChannels() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredChannels.slice(startIndex, endIndex);
    }

    // 더 많은 채널 로드
    async loadMoreChannels() {
        if (this.isLoadingMore) return;
        
        this.isLoadingMore = true;
        this.currentPage++;
        
        // 실제로는 API 호출을 통해 더 많은 데이터를 가져옴
        // 여기서는 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.renderChannelsGrid(true); // append 모드
        this.isLoadingMore = false;
    }

    // 채널 그리드만 다시 렌더링
    renderChannelsGrid(append = false) {
        const channelsGrid = this.container.querySelector('#channels-grid');
        if (channelsGrid) {
            const channelsToShow = this.getPaginatedChannels();
            
            if (append) {
                // 기존 내용에 추가
                const newContent = channelsToShow.map(channel => this.createChannelCard(channel)).join('');
                channelsGrid.innerHTML += newContent;
            } else {
                // 전체 교체
                channelsGrid.innerHTML = channelsToShow.map(channel => this.createChannelCard(channel)).join('');
            }
            
            this.setupChannelClickEvents();
            this.setupInfiniteScroll();
            
            // 더 보기 버튼 표시/숨김
            this.updateLoadMoreButton();
        }
    }

    // 무한 스크롤 설정
    setupInfiniteScroll() {
        const channelsGrid = this.container.querySelector('#channels-grid');
        if (channelsGrid) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.isLoadingMore) {
                        this.loadMoreChannels();
                    }
                });
            }, { threshold: 0.1 });
            
            // 마지막 요소 관찰
            const lastChannel = channelsGrid.lastElementChild;
            if (lastChannel) {
                observer.observe(lastChannel);
            }
        }
    }

    // 더 보기 버튼 업데이트
    updateLoadMoreButton() {
        const hasMoreChannels = this.currentPage * this.itemsPerPage < this.filteredChannels.length;
        let loadMoreBtn = this.container.querySelector('#load-more-channels');
        
        if (hasMoreChannels) {
            if (!loadMoreBtn) {
                loadMoreBtn = document.createElement('button');
                loadMoreBtn.id = 'load-more-channels';
                loadMoreBtn.className = 'terminal-btn load-more-btn';
                loadMoreBtn.textContent = '더 많은 채널 로드';
                loadMoreBtn.onclick = () => this.loadMoreChannels();
                
                const channelsGrid = this.container.querySelector('#channels-grid');
                if (channelsGrid) {
                    channelsGrid.parentNode.appendChild(loadMoreBtn);
                }
            }
        } else if (loadMoreBtn) {
            loadMoreBtn.remove();
        }
    }

    // 키보드 네비게이션 설정
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                this.handleKeyboardNavigation(e);
            }
        });
    }

    // 키보드 네비게이션 처리
    handleKeyboardNavigation(e) {
        const channelCards = this.container.querySelectorAll('.channel-card:not(.restricted)');
        const currentFocus = document.activeElement;
        const currentIndex = Array.from(channelCards).indexOf(currentFocus);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % channelCards.length;
            channelCards[nextIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex <= 0 ? channelCards.length - 1 : currentIndex - 1;
            channelCards[prevIndex]?.focus();
        } else if (e.key === 'Enter' && currentFocus.classList.contains('channel-card')) {
            e.preventDefault();
            currentFocus.click();
        }
    }

    // 오프라인 지원 설정
    setupOfflineSupport() {
        // 실제로는 Service Worker와 캐싱을 구현해야 함
        // 여기서는 간단한 타이머를 사용하여 예시를 보여줌
        setInterval(() => {
            // 오프라인 상태 확인
            if (!navigator.onLine) {
                this.showError('오프라인 상태입니다. 인터넷 연결을 확인해주세요.');
            }
        }, 5000);
    }

    // 에러 바운더리
    handleError(error, errorInfo) {
        console.error('ForumsMain Error:', error, errorInfo);
        
        // 에러를 분석 서비스로 전송
        this.reportError(error, errorInfo);
        
        // 사용자에게 친화적인 에러 메시지 표시
        this.showError('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    // 에러 리포트
    reportError(error, errorInfo) {
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            errorInfo: errorInfo,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // 실제로는 에러 분석 서비스로 전송
        console.log('Error Report:', errorReport);
    }

    // 언어 설정 가져오기
    getLanguage() {
        return localStorage.getItem('language') || navigator.language || 'ko-KR';
    }

    // 번역 함수
    t(key) {
        const translations = {
            'ko-KR': {
                'forums.title': '에이전트 포럼',
                'forums.subtitle': '정보 공유 및 협업 플랫폼',
                'channels.title': '사용 가능한 채널',
                'search.placeholder': '채널 검색...',
                'stats.total_channels': '총 채널:',
                'stats.total_threads': '총 스레드:',
                'stats.active_agents': '활성 에이전트:',
                'stats.new_posts': '새 게시물:',
                'actions.create_thread': '스레드 생성',
                'actions.my_posts': '내 게시물',
                'actions.refresh': '새로고침',
                'actions.notifications': '알림',
                'actions.dark_mode': '다크 모드',
                'error.load_failed': '채널 목록을 불러오는데 실패했습니다.',
                'error.offline': '오프라인 상태입니다. 인터넷 연결을 확인해주세요.',
                'error.system_error': '시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                'access.insufficient_clearance': '보안 등급이 부족합니다.',
                'load_more': '더 많은 채널 로드'
            },
            'en-US': {
                'forums.title': 'AGENT FORUMS',
                'forums.subtitle': 'Intelligence sharing and collaboration platform',
                'channels.title': 'AVAILABLE CHANNELS',
                'search.placeholder': 'SEARCH CHANNELS...',
                'stats.total_channels': 'Total Channels:',
                'stats.total_threads': 'Total Threads:',
                'stats.active_agents': 'Active Agents:',
                'stats.new_posts': 'New Posts:',
                'actions.create_thread': 'CREATE THREAD',
                'actions.my_posts': 'MY POSTS',
                'actions.refresh': 'REFRESH',
                'actions.notifications': 'NOTIFICATIONS',
                'actions.dark_mode': 'DARK MODE',
                'error.load_failed': 'Failed to load channels.',
                'error.offline': 'You are offline. Please check your internet connection.',
                'error.system_error': 'System error occurred. Please try again later.',
                'access.insufficient_clearance': 'Insufficient clearance level.',
                'load_more': 'LOAD MORE CHANNELS'
            }
        };
        
        const lang = this.language.startsWith('ko') ? 'ko-KR' : 'en-US';
        return translations[lang]?.[key] || key;
    }

    // 테스트 기능
    runTests() {
        console.log('Running ForumsMain tests...');
        
        const tests = [
            this.testChannelLoading(),
            this.testSearchFunctionality(),
            this.testAccessControl(),
            this.testPerformance()
        ];
        
        Promise.all(tests).then(results => {
            const passed = results.filter(r => r).length;
            const total = results.length;
            console.log(`ForumsMain tests: ${passed}/${total} passed`);
        });
    }

    async testChannelLoading() {
        try {
            await this.loadChannels();
            return this.channels.length > 0;
        } catch (error) {
            console.error('Channel loading test failed:', error);
            return false;
        }
    }

    async testSearchFunctionality() {
        try {
            this.searchQuery = 'general';
            this.filterChannels();
            return this.filteredChannels.length > 0;
        } catch (error) {
            console.error('Search functionality test failed:', error);
            return false;
        }
    }

    async testAccessControl() {
        try {
            const restrictedChannel = this.channels.find(ch => ch.requiredClearance);
            return restrictedChannel && !this.canAccessChannel(restrictedChannel);
        } catch (error) {
            console.error('Access control test failed:', error);
            return false;
        }
    }

    async testPerformance() {
        try {
            const startTime = performance.now();
            this.render();
            const duration = performance.now() - startTime;
            return duration < 1000; // 1초 이내
        } catch (error) {
            console.error('Performance test failed:', error);
            return false;
        }
    }

    // 채널 생성 모달 표시
    showCreateChannelModal() {
        // 간단한 모달 구현
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>새 채널 생성</h3>
                <form id="create-channel-form">
                    <div class="form-group">
                        <label for="channel-name">채널 이름:</label>
                        <input type="text" id="channel-name" class="terminal-input" required>
                    </div>
                    <div class="form-group">
                        <label for="channel-description">설명:</label>
                        <textarea id="channel-description" class="terminal-input" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="channel-order">순서:</label>
                        <input type="number" id="channel-order" class="terminal-input" value="1" min="1">
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="terminal-btn">생성</button>
                        <button type="button" class="terminal-btn" onclick="this.closeModal()">취소</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // 폼 제출 처리
        const form = modal.querySelector('#create-channel-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = modal.querySelector('#channel-name').value;
            const description = modal.querySelector('#channel-description').value;
            const order = parseInt(modal.querySelector('#channel-order').value);

            try {
                await this.forumService.createChannel({ name, description, order });
                this.closeModal();
                showNotification('채널이 성공적으로 생성되었습니다.', 'success');
            } catch (error) {
                console.error('Error creating channel:', error);
                showNotification('채널 생성에 실패했습니다.', 'error');
            }
        });
    }

    // 모달 닫기
    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
}

// 전역 인스턴스 생성
console.log('Creating ForumsMain global instance...');
window.forumsMain = new ForumsMain();
console.log('ForumsMain global instance created:', window.forumsMain); 