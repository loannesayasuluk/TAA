// TAA Archives - Forums Main Component
// 포럼 메인 페이지: 모든 채널 목록 표시

class ForumsMain {
    constructor() {
        this.forumService = window.forumService;
        this.container = null;
        this.unsubscribe = null;
    }

    // 포럼 메인 페이지 초기화
    async init(container) {
        this.container = container;
        this.render();
        await this.loadForums();
    }

    // 포럼 메인 페이지 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="forums-header">
                <h1>에이전트 포럼</h1>
                <p>정보 공유 및 협업 플랫폼</p>
                <div class="forums-actions">
                    <button class="terminal-btn" onclick="window.router.navigate('/')">홈으로</button>
                    <button class="terminal-btn" onclick="this.initializeForums()">초기 데이터 생성</button>
                </div>
            </div>
            
            <div class="forums-content">
                <div class="channels-section">
                    <div class="channels-header">
                        <h2>포럼 채널</h2>
                        <div class="channels-search">
                            <input type="text" class="search-input" placeholder="채널 검색..." id="channel-search">
                        </div>
                    </div>
                    
                    <div class="channels-grid" id="channels-grid">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>채널 목록을 불러오는 중...</p>
                        </div>
                    </div>
                </div>
                
                <div class="forums-sidebar">
                    <div class="sidebar-section">
                        <h3>포럼 통계</h3>
                        <div class="stats-list" id="forum-stats">
                            <div class="stat-item">
                                <span class="stat-label">총 채널</span>
                                <span class="stat-value" id="total-channels">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">총 스레드</span>
                                <span class="stat-value" id="total-threads">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">총 댓글</span>
                                <span class="stat-value" id="total-comments">-</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3>최근 활동</h3>
                        <div class="recent-activity" id="recent-activity">
                            <div class="activity-item">
                                <span class="activity-agent">시스템</span>
                                <span class="activity-action">포럼을 초기화했습니다</span>
                                <span class="activity-time">방금 전</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3>빠른 액션</h3>
                        <div class="quick-actions">
                            <button class="terminal-btn" onclick="window.router.navigate('/forums/general')">자유 토론</button>
                            <button class="terminal-btn" onclick="window.router.navigate('/forums/tech-discussion')">기술 논의</button>
                            <button class="terminal-btn" onclick="window.router.navigate('/forums/mission-briefing')">임무 브리핑</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 검색 기능 설정
        this.setupSearch();
    }

    // 포럼 목록 로드
    async loadForums() {
        try {
            const forums = await this.forumService.getForums();
            this.displayForums(forums);
            this.updateStats(forums);
        } catch (error) {
            console.error('Error loading forums:', error);
            this.showError('포럼 목록을 불러오는데 실패했습니다.');
        }
    }

    // 포럼 목록 표시
    displayForums(forums) {
        const channelsGrid = document.getElementById('channels-grid');
        if (!channelsGrid) return;

        if (forums.length === 0) {
            channelsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>포럼이 없습니다</h3>
                    <p>첫 번째 포럼을 생성해보세요.</p>
                    <button class="terminal-btn" onclick="this.initializeForums()">초기 데이터 생성</button>
                </div>
            `;
            return;
        }

        channelsGrid.innerHTML = forums.map(forum => `
            <div class="channel-card" onclick="window.router.navigate('/forums/${forum.id}')">
                <div class="channel-header">
                    <h3 class="channel-name">${forum.name}</h3>
                    <span class="clearance-badge">Level ${forum.order}</span>
                </div>
                <p class="channel-description">${forum.description}</p>
                <div class="channel-stats">
                    <div class="stat">
                        <span class="stat-icon">📊</span>
                        <span>스레드: <span class="stat-value">-</span></span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">💬</span>
                        <span>댓글: <span class="stat-value">-</span></span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 통계 업데이트
    updateStats(forums) {
        const totalChannels = document.getElementById('total-channels');
        if (totalChannels) {
            totalChannels.textContent = forums.length;
        }
    }

    // 검색 기능 설정
    setupSearch() {
        const searchInput = document.getElementById('channel-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterChannels(e.target.value);
            });
        }
    }

    // 채널 필터링
    filterChannels(searchTerm) {
        const channelCards = document.querySelectorAll('.channel-card');
        const searchLower = searchTerm.toLowerCase();

        channelCards.forEach(card => {
            const channelName = card.querySelector('.channel-name').textContent.toLowerCase();
            const channelDesc = card.querySelector('.channel-description').textContent.toLowerCase();
            
            if (channelName.includes(searchLower) || channelDesc.includes(searchLower)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // 초기 포럼 데이터 생성
    async initializeForums() {
        try {
            await this.forumService.initializeForums();
            await this.loadForums();
            this.showSuccess('포럼 초기 데이터가 생성되었습니다.');
        } catch (error) {
            console.error('Error initializing forums:', error);
            this.showError('포럼 초기화에 실패했습니다.');
        }
    }

    // 성공 메시지 표시
    showSuccess(message) {
        if (window.terminalEffects) {
            window.terminalEffects.showSuccess(message);
        }
    }

    // 에러 메시지 표시
    showError(message) {
        if (window.terminalEffects) {
            window.terminalEffects.showError(message);
        }
    }

    // 컴포넌트 정리
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// 전역 인스턴스 생성
window.forumsMain = new ForumsMain();

console.log('TAA Archives: Forums main component initialized'); 