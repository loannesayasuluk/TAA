// TAA Archives - Channel Page Component
// 채널 페이지: 특정 채널의 모든 게시물 목록 표시

class ChannelPage {
    constructor() {
        this.forumService = window.forumService;
        this.container = null;
        this.channelId = null;
        this.unsubscribe = null;
        this.currentChannel = null;
    }

    // 채널 페이지 초기화
    async init(container, channelId) {
        this.container = container;
        this.channelId = channelId;
        this.render();
        await this.loadChannelInfo();
        this.loadThreads();
    }

    // 채널 페이지 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="channel-header">
                <div class="channel-info">
                    <h1 id="channel-title">채널 로딩 중...</h1>
                    <p id="channel-description">설명을 불러오는 중...</p>
                </div>
                <div class="channel-actions">
                    <button class="terminal-btn" onclick="window.router.navigate('/forums')">포럼 목록</button>
                    <button class="terminal-btn" onclick="window.router.navigate('/forums/${this.channelId}/create')">새 토론 시작</button>
                </div>
            </div>
            
            <div class="threads-container">
                <div class="threads-header">
                    <h2>토론 목록</h2>
                    <div class="thread-filters">
                        <select class="terminal-select" id="sort-select">
                            <option value="latest">최신순</option>
                            <option value="votes">추천순</option>
                            <option value="comments">댓글순</option>
                        </select>
                    </div>
                </div>
                
                <div class="threads-table">
                    <table>
                        <thead>
                            <tr>
                                <th class="title-col">제목</th>
                                <th class="agent-col">작성자</th>
                                <th class="timestamp-col">작성일</th>
                                <th class="votes-col">추천</th>
                                <th class="replies-col">댓글</th>
                            </tr>
                        </thead>
                        <tbody id="threads-tbody">
                            <tr>
                                <td colspan="5" class="loading-container">
                                    <div class="loading-spinner"></div>
                                    <p>토론 목록을 불러오는 중...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // 정렬 기능 설정
        this.setupSorting();
    }

    // 채널 정보 로드
    async loadChannelInfo() {
        try {
            const forums = await this.forumService.getForums();
            this.currentChannel = forums.find(f => f.id === this.channelId);
            
            if (this.currentChannel) {
                const title = document.getElementById('channel-title');
                const description = document.getElementById('channel-description');
                
                if (title) title.textContent = this.currentChannel.name;
                if (description) description.textContent = this.currentChannel.description;
            } else {
                this.showError('채널을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('Error loading channel info:', error);
            this.showError('채널 정보를 불러오는데 실패했습니다.');
        }
    }

    // 스레드 목록 로드 (실시간)
    loadThreads() {
        if (!this.channelId) return;

        this.unsubscribe = this.forumService.getThreadsByChannel(this.channelId, (threads) => {
            this.displayThreads(threads);
        });
    }

    // 스레드 목록 표시
    displayThreads(threads) {
        const tbody = document.getElementById('threads-tbody');
        if (!tbody) return;

        if (threads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>토론이 없습니다</h3>
                        <p>첫 번째 토론을 시작해보세요.</p>
                        <button class="terminal-btn" onclick="window.router.navigate('/forums/${this.channelId}/create')">새 토론 시작</button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = threads.map(thread => `
            <tr class="thread-row" onclick="window.router.navigate('/forums/${this.channelId}/thread/${thread.id}')">
                <td class="title-col">
                    <a href="#" class="thread-title" onclick="event.preventDefault(); window.router.navigate('/forums/${this.channelId}/thread/${thread.id}')">
                        ${thread.title}
                    </a>
                </td>
                <td class="agent-col">
                    <span class="agent-name">${thread.authorName || '익명'}</span>
                </td>
                <td class="timestamp-col">
                    <span class="timestamp">${this.formatDate(thread.createdAt)}</span>
                </td>
                <td class="votes-col">
                    <span class="vote-count">${thread.votes || 0}</span>
                </td>
                <td class="replies-col">
                    <span class="reply-count">${thread.commentCount || 0}</span>
                </td>
            </tr>
        `).join('');
    }

    // 정렬 기능 설정
    setupSorting() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortThreads(e.target.value);
            });
        }
    }

    // 스레드 정렬
    sortThreads(sortType) {
        // 현재 스레드 목록을 다시 로드하여 정렬 적용
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        // 정렬 로직은 서버 사이드에서 처리되므로 다시 구독
        this.loadThreads();
    }

    // 날짜 포맷팅
    formatDate(timestamp) {
        if (!timestamp) return '-';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return date.toLocaleDateString('ko-KR');
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
window.channelPage = new ChannelPage();

console.log('TAA Archives: Channel page component initialized'); 