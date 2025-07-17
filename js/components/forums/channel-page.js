// TAA Archives - Channel Page Component
// 채널 페이지: 스레드 목록 표시

class ChannelPage {
    constructor(containerId = 'channel-page-view') {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.channelId = null;
        this.threads = [];
        this.unsubscribe = null;
        this.forumService = window.forumService;
        
        if (!this.container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 새 스레드 생성 버튼
        const createThreadBtn = this.container.querySelector('#create-thread-btn');
        if (createThreadBtn) {
            createThreadBtn.addEventListener('click', () => {
                this.navigateToCreateThread();
            });
        }

        // 검색 기능
        const searchInput = this.container.querySelector('#threads-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterThreads(e.target.value);
            });
        }

        // 정렬 옵션
        const sortSelect = this.container.querySelector('#threads-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortThreads(e.target.value);
            });
        }
    }

    // 채널 로드
    async loadChannel(channelId) {
        this.channelId = channelId;
        
        try {
            this.showLoading();
            
            // 기존 구독 해제
            if (this.unsubscribe) {
                this.unsubscribe();
            }

            // 실시간 리스너 설정
            this.unsubscribe = this.forumService.subscribeToThreads(channelId, (threads) => {
                this.threads = threads;
                this.render();
                this.hideLoading();
            });

            // 채널 정보 업데이트
            this.updateChannelInfo(channelId);

        } catch (error) {
            console.error('Error loading channel:', error);
            this.showError('채널을 불러오는데 실패했습니다.');
            this.hideLoading();
        }
    }

    // 채널 정보 업데이트
    async updateChannelInfo(channelId) {
        try {
            const channels = await this.forumService.getChannels();
            const channel = channels.find(ch => ch.id === channelId);
            
            if (channel) {
                const channelTitle = this.container.querySelector('.channel-title');
                const channelDescription = this.container.querySelector('.channel-description');
                
                if (channelTitle) {
                    channelTitle.textContent = `#${channel.name}`;
                }
                
                if (channelDescription) {
                    channelDescription.textContent = channel.description || '설명이 없습니다.';
                }
            }
        } catch (error) {
            console.error('Error updating channel info:', error);
        }
    }

    // 스레드 목록 렌더링
    render() {
        if (!this.container) return;

        const threadsTable = this.container.querySelector('#threads-table tbody');
        if (!threadsTable) return;

        if (this.threads.length === 0) {
            threadsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>스레드가 없습니다</h3>
                        <p>첫 번째 스레드를 작성해보세요.</p>
                        <button class="terminal-btn" onclick="this.navigateToCreateThread()">스레드 작성</button>
                    </td>
                </tr>
            `;
            return;
        }

        threadsTable.innerHTML = this.threads.map(thread => 
            this.createThreadRow(thread)
        ).join('');

        // 스레드 행 클릭 이벤트 설정
        this.setupThreadClickEvents();
    }

    // 스레드 행 생성
    createThreadRow(thread) {
        const createdAt = this.formatDate(thread.createdAt);
        const isValidated = thread.votes >= 10;
        
        return `
            <tr class="thread-row ${isValidated ? 'validated' : ''}" data-thread-id="${thread.id}">
                <td class="status-col">
                    ${isValidated ? '<span class="validated-badge">✓</span>' : ''}
                </td>
                <td class="title-col">
                    <a href="#" class="thread-title ${isValidated ? 'validated-intel' : ''}">
                        ${thread.title}
                    </a>
                </td>
                <td class="agent-col">
                    <span class="agent-name">${thread.authorName}</span>
                </td>
                <td class="timestamp-col">
                    <span class="timestamp">${createdAt}</span>
                </td>
                <td class="votes-col">
                    <button class="vote-btn" data-thread-id="${thread.id}" data-vote-type="up">
                        <span class="vote-icon">▲</span>
                        <span class="vote-count">${thread.votes || 0}</span>
                    </button>
                </td>
                <td class="replies-col">
                    <span class="reply-count">${thread.commentCount || 0}</span>
                </td>
            </tr>
        `;
    }

    // 스레드 클릭 이벤트 설정
    setupThreadClickEvents() {
        const threadRows = this.container.querySelectorAll('.thread-row');
        threadRows.forEach(row => {
            row.addEventListener('click', (e) => {
                // 버튼 클릭이 아닌 행 클릭만 처리
                if (e.target.tagName === 'BUTTON') return;
                
                const threadId = row.dataset.threadId;
                this.navigateToThread(threadId);
            });
        });

        // 추천 버튼 이벤트
        const voteBtns = this.container.querySelectorAll('.vote-btn');
        voteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const threadId = btn.dataset.threadId;
                const voteType = btn.dataset.voteType;
                
                try {
                    await this.forumService.voteThread(threadId, voteType);
                    showNotification('추천이 반영되었습니다.', 'success');
                } catch (error) {
                    console.error('Error voting thread:', error);
                    showNotification('추천 처리에 실패했습니다.', 'error');
                }
            });
        });
    }

    // 스레드 페이지로 이동
    navigateToThread(threadId) {
        if (window.router) {
            window.router.navigate(`/forums/${this.channelId}/thread/${threadId}`);
        } else {
            window.location.href = `/forums/${this.channelId}/thread/${threadId}`;
        }
    }

    // 스레드 생성 페이지로 이동
    navigateToCreateThread() {
        if (window.router) {
            window.router.navigate(`/forums/${this.channelId}/create`);
        } else {
            window.location.href = `/forums/${this.channelId}/create`;
        }
    }

    // 스레드 필터링
    filterThreads(query) {
        const threadRows = this.container.querySelectorAll('.thread-row');
        const searchTerm = query.toLowerCase();

        threadRows.forEach(row => {
            const title = row.querySelector('.thread-title').textContent.toLowerCase();
            const author = row.querySelector('.agent-name').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || author.includes(searchTerm)) {
                row.style.display = 'table-row';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // 스레드 정렬
    sortThreads(sortType) {
        const sortedThreads = [...this.threads];
        
        switch (sortType) {
            case 'newest':
                sortedThreads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                sortedThreads.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'votes':
                sortedThreads.sort((a, b) => (b.votes || 0) - (a.votes || 0));
                break;
            case 'comments':
                sortedThreads.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
                break;
        }
        
        this.threads = sortedThreads;
        this.render();
    }

    // 날짜 포맷팅
    formatDate(timestamp) {
        if (!timestamp) return '알 수 없음';
        
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

    // 로딩 표시
    showLoading() {
        const threadsTable = this.container.querySelector('#threads-table tbody');
        if (threadsTable) {
            threadsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>스레드 목록을 불러오는 중...</p>
                    </td>
                </tr>
            `;
        }
    }

    // 로딩 숨기기
    hideLoading() {
        // render() 메서드에서 처리됨
    }

    // 에러 표시
    showError(message) {
        const threadsTable = this.container.querySelector('#threads-table tbody');
        if (threadsTable) {
            threadsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>오류 발생</h3>
                        <p>${message}</p>
                        <button class="terminal-btn" onclick="this.loadChannel('${this.channelId}')">다시 시도</button>
                    </td>
                </tr>
            `;
        }
    }

    // 정리
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// 전역 인스턴스 생성
window.channelPage = new ChannelPage();

console.log('TAA Archives: ChannelPage component initialized'); 