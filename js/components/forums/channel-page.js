// TAA Archives - Channel Page Component
// 특정 채널에 속한 게시물 목록을 보여주는 페이지 (실시간 동기화 지원)

class ChannelPage {
    constructor(containerId = 'channel-view') {
        this.containerId = containerId;
        this.container = null;
        this.currentChannel = null;
        this.threads = [];
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.unsubscribeThreads = null; // 실시간 리스너 해제용
        this.filterType = 'all'; // all, validated, pinned
        this.sortType = 'latest'; // latest, votes, replies
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`ChannelPage: Container with id '${this.containerId}' not found`);
            return;
        }
        
        this.setupEventListeners();
    }

    // 채널 로드
    async loadChannel(channelId) {
        try {
            this.isLoading = true;
            this.showLoading();

            // 채널 정보 로드
            this.currentChannel = await this.getChannelInfo(channelId);
            
            // 스레드 목록 로드 (실시간)
            await this.loadThreads(channelId);
            
            this.render();
        } catch (error) {
            console.error('ChannelPage: Error loading channel:', error);
            this.showError('채널을 불러오는데 실패했습니다.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // 채널 정보 가져오기
    async getChannelInfo(channelId) {
        const channels = {
            'general-discussion': {
                id: 'general-discussion',
                name: '자유게시판',
                description: '일반적인 토론과 정보 공유',
                requiredClearance: 1
            },
            'classified-intel': {
                id: 'classified-intel',
                name: '정보분석실',
                description: '기밀 정보 공유 및 분석',
                requiredClearance: 3
            },
            'mission-reports': {
                id: 'mission-reports',
                name: '임무보고서',
                description: '현장 임무 보고서 및 브리핑',
                requiredClearance: 2
            },
            'technical-support': {
                id: 'technical-support',
                name: '장비토론',
                description: '기술적 문제 및 시스템 지원',
                requiredClearance: 1
            },
            'agent-training': {
                id: 'agent-training',
                name: '에이전트 교육',
                description: '교육 자료 및 기술 개발',
                requiredClearance: 1
            },
            'classified-operations': {
                id: 'classified-operations',
                name: '기밀 작전',
                description: '최고 기밀 작전 및 계획',
                requiredClearance: 4
            }
        };

        return channels[channelId] || channels['general-discussion'];
    }

    // 스레드 목록 로드 (실시간 동기화)
    async loadThreads(channelId) {
        try {
            // 기존 리스너 해제
            if (this.unsubscribeThreads) {
                this.unsubscribeThreads();
            }

            // 실시간 리스너 설정
            this.unsubscribeThreads = window.forumService.getChannelThreads(channelId, (threads) => {
                this.threads = threads;
                this.render();
            });

        } catch (error) {
            console.error('ChannelPage: Error loading threads:', error);
            this.showError('스레드 목록을 불러오는데 실패했습니다.');
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 새 스레드 생성 버튼
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'create-thread-btn') {
                this.createNewThread();
            }
        });

        // 필터 및 정렬 이벤트
        this.setupFilterEvents();
    }

    // 렌더링
    render() {
        if (!this.currentChannel) return;

        const filteredThreads = this.filterThreads();
        const sortedThreads = this.sortThreads(filteredThreads);
        const paginatedThreads = this.paginateThreads(sortedThreads);

        this.container.innerHTML = `
            <div class="channel-header">
                <div class="channel-info">
                    <h1>${this.currentChannel.name}</h1>
                    <p>${this.currentChannel.description}</p>
                </div>
                <div class="channel-actions">
                    <button id="create-thread-btn" class="terminal-btn">새 스레드 생성</button>
                </div>
            </div>

            <div class="threads-container">
                <div class="threads-header">
                    <h2>스레드 목록 (${this.threads.length}개)</h2>
                    <div class="thread-filters">
                        <select id="filter-select" class="terminal-input">
                            <option value="all">전체</option>
                            <option value="validated">검증된 정보</option>
                            <option value="pinned">고정된 게시물</option>
                        </select>
                        <select id="sort-select" class="terminal-input">
                            <option value="latest">최신순</option>
                            <option value="votes">추천순</option>
                            <option value="replies">댓글순</option>
                        </select>
                    </div>
                </div>

                <div class="threads-table">
                    <table>
                        <thead>
                            <tr>
                                <th class="status-col">상태</th>
                                <th class="title-col">제목</th>
                                <th class="agent-col">작성자</th>
                                <th class="timestamp-col">작성일</th>
                                <th class="votes-col">추천</th>
                                <th class="replies-col">댓글</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paginatedThreads.map(thread => this.createThreadRow(thread)).join('')}
                        </tbody>
                    </table>
                </div>

                ${this.renderPagination()}
            </div>
        `;

        this.setupThreadClickEvents();
        this.setupFilterEvents();
    }

    // 스레드 행 생성
    createThreadRow(thread) {
        const statusIcon = this.getStatusIcon(thread.status);
        const validatedClass = thread.isValidated ? 'validated-intel' : '';
        const pinnedClass = thread.isPinned ? 'pinned' : '';
        
        return `
            <tr class="thread-row ${thread.isValidated ? 'validated' : ''}" data-thread-id="${thread.id}">
                <td class="status-col">
                    <span class="status-icon">${statusIcon}</span>
                </td>
                <td class="title-col">
                    <a href="#" class="thread-title ${validatedClass} ${pinnedClass}">
                        ${this.escapeHtml(thread.title)}
                        ${thread.isValidated ? '<span class="validated-badge">✓</span>' : ''}
                    </a>
                </td>
                <td class="agent-col">
                    <span class="agent-name">${this.escapeHtml(thread.authorName)}</span>
                </td>
                <td class="timestamp-col">
                    <span class="timestamp">${this.formatDate(thread.createdAt)}</span>
                </td>
                <td class="votes-col">
                    <span class="vote-count">${thread.votes || 0}</span>
                </td>
                <td class="replies-col">
                    <span class="reply-count">${thread.replies || 0}</span>
                </td>
            </tr>
        `;
    }

    // 상태 아이콘 반환
    getStatusIcon(status) {
        switch (status) {
            case 'pinned': return '📌';
            case 'locked': return '🔒';
            case 'active': return '●';
            default: return '●';
        }
    }

    // 스레드 클릭 이벤트 설정
    setupThreadClickEvents() {
        this.container.querySelectorAll('.thread-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const threadId = row.dataset.threadId;
                if (threadId) {
                    this.navigateToThread(threadId);
                }
            });
        });
    }

    // 투표 처리
    async handleVote(threadId) {
        try {
            await window.forumService.voteThread(threadId, 'up');
            terminalEffects.showSuccess('투표가 완료되었습니다.');
        } catch (error) {
            console.error('Error voting thread:', error);
            terminalEffects.showError('투표 처리 중 오류가 발생했습니다.');
        }
    }

    // 필터 이벤트 설정
    setupFilterEvents() {
        const filterSelect = this.container.querySelector('#filter-select');
        const sortSelect = this.container.querySelector('#sort-select');

        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterType = e.target.value;
                this.currentPage = 1;
                this.render();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortType = e.target.value;
                this.render();
            });
        }
    }

    // 스레드로 이동
    navigateToThread(threadId) {
        if (window.router) {
            window.router.navigate(`/forums/${this.currentChannel.id}/thread/${threadId}`);
        }
    }

    // 새 스레드 생성
    createNewThread() {
        if (window.router) {
            window.router.navigate(`/forums/${this.currentChannel.id}/create-thread`);
        }
    }

    // 스레드 필터링
    filterThreads() {
        let filtered = this.threads;

        switch (this.filterType) {
            case 'validated':
                filtered = filtered.filter(thread => thread.isValidated);
                break;
            case 'pinned':
                filtered = filtered.filter(thread => thread.isPinned);
                break;
            default:
                break;
        }

        return filtered;
    }

    // 스레드 정렬
    sortThreads(threads) {
        switch (this.sortType) {
            case 'votes':
                return threads.sort((a, b) => (b.votes || 0) - (a.votes || 0));
            case 'replies':
                return threads.sort((a, b) => (b.replies || 0) - (a.replies || 0));
            case 'latest':
            default:
                return threads.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                    return dateB - dateA;
                });
        }
    }

    // 페이지네이션된 스레드 반환
    paginateThreads(threads) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return threads.slice(startIndex, endIndex);
    }

    // 페이지네이션 렌더링
    renderPagination() {
        const totalPages = Math.ceil(this.threads.length / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        return `
            <div class="threads-pagination">
                <button class="terminal-btn" onclick="channelPage.previousPage()" ${this.currentPage <= 1 ? 'disabled' : ''}>
                    이전
                </button>
                <span class="page-info">${this.currentPage} / ${totalPages}</span>
                <button class="terminal-btn" onclick="channelPage.nextPage()" ${this.currentPage >= totalPages ? 'disabled' : ''}>
                    다음
                </button>
            </div>
        `;
    }

    // 이전 페이지
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
        }
    }

    // 다음 페이지
    nextPage() {
        const totalPages = Math.ceil(this.threads.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
        }
    }

    // 날짜 포맷팅
    formatDate(date) {
        if (!date) return '알 수 없음';
        
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes < 1) return '방금 전';
        if (diffMinutes < 60) return `${diffMinutes}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        
        return dateObj.toLocaleDateString('ko-KR');
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 로딩 표시
    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>채널 정보를 불러오는 중...</p>
                </div>
            `;
        }
    }

    // 로딩 숨기기
    hideLoading() {
        // 로딩 상태는 render()에서 자동으로 처리됨
    }

    // 에러 표시
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>오류 발생</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // 정리
    cleanup() {
        if (this.unsubscribeThreads) {
            this.unsubscribeThreads();
            this.unsubscribeThreads = null;
        }
    }
}

// 전역 인스턴스 생성
window.channelPage = new ChannelPage(); 