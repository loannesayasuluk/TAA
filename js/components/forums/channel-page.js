// TAA Archives - Channel Page Component
// 특정 채널에 속한 게시물 목록을 보여주는 페이지

class ChannelPage {
    constructor(containerId = 'channel-view') {
        this.containerId = containerId;
        this.container = null;
        this.currentChannel = null;
        this.threads = [];
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
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
            
            // 스레드 목록 로드
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
        // 실제로는 API에서 가져와야 함
        const channels = {
            'general-discussion': {
                id: 'general-discussion',
                name: 'GENERAL DISCUSSION',
                description: 'General topics and discussions among agents',
                requiredClearance: 1
            },
            'classified-intel': {
                id: 'classified-intel',
                name: 'CLASSIFIED INTEL',
                description: 'Classified intelligence sharing and analysis',
                requiredClearance: 3
            },
            'mission-reports': {
                id: 'mission-reports',
                name: 'MISSION REPORTS',
                description: 'Field mission reports and debriefings',
                requiredClearance: 2
            },
            'technical-support': {
                id: 'technical-support',
                name: 'TECHNICAL SUPPORT',
                description: 'Technical issues and system support',
                requiredClearance: 1
            },
            'agent-training': {
                id: 'agent-training',
                name: 'AGENT TRAINING',
                description: 'Training materials and skill development',
                requiredClearance: 1
            },
            'classified-operations': {
                id: 'classified-operations',
                name: 'CLASSIFIED OPERATIONS',
                description: 'Top secret operations and planning',
                requiredClearance: 4
            }
        };

        return channels[channelId] || channels['general-discussion'];
    }

    // 스레드 목록 로드
    async loadThreads(channelId) {
        // 실제로는 API에서 가져와야 함
        this.threads = [
            {
                id: 'thread-1',
                title: 'New surveillance equipment deployment',
                author: 'Agent_Alpha',
                timestamp: new Date(Date.now() - 1800000),
                votes: 15,
                replies: 8,
                isValidated: true,
                status: 'active',
                userVoted: false
            },
            {
                id: 'thread-2',
                title: 'Field report: Operation Nightfall',
                author: 'Agent_Beta',
                timestamp: new Date(Date.now() - 3600000),
                votes: 23,
                replies: 12,
                isValidated: true,
                status: 'active',
                userVoted: false
            },
            {
                id: 'thread-3',
                title: 'System maintenance schedule',
                author: 'Agent_Gamma',
                timestamp: new Date(Date.now() - 5400000),
                votes: 7,
                replies: 3,
                isValidated: false,
                status: 'active',
                userVoted: false
            },
            {
                id: 'thread-4',
                title: 'Intelligence briefing: Sector 7',
                author: 'Agent_Delta',
                timestamp: new Date(Date.now() - 7200000),
                votes: 31,
                replies: 15,
                isValidated: true,
                status: 'pinned',
                userVoted: false
            },
            {
                id: 'thread-5',
                title: 'Training session feedback',
                author: 'Agent_Echo',
                timestamp: new Date(Date.now() - 9000000),
                votes: 12,
                replies: 6,
                isValidated: false,
                status: 'active',
                userVoted: false
            }
        ];
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 새 스레드 생성 버튼
        const createThreadBtn = document.getElementById('create-thread-btn');
        if (createThreadBtn) {
            createThreadBtn.addEventListener('click', () => {
                this.createNewThread();
            });
        }
    }

    // 채널 페이지 렌더링
    render() {
        if (!this.container || !this.currentChannel) return;

        this.container.innerHTML = `
            <div class="channel-header">
                <div class="channel-info">
                    <h1># ${this.currentChannel.name}</h1>
                    <p>${this.currentChannel.description}</p>
                </div>
                <div class="channel-actions">
                    <button id="create-thread-btn" class="terminal-btn">CREATE NEW THREAD</button>
                </div>
            </div>
            
            <div class="threads-container">
                <div class="threads-header">
                    <h2>THREADS (${this.threads.length})</h2>
                    <div class="thread-filters">
                        <select id="status-filter" class="terminal-input">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pinned">Pinned</option>
                            <option value="locked">Locked</option>
                        </select>
                        <select id="sort-filter" class="terminal-input">
                            <option value="latest">Latest</option>
                            <option value="votes">Most Voted</option>
                            <option value="replies">Most Replies</option>
                        </select>
                    </div>
                </div>
                
                <div class="threads-table">
                    <table>
                        <thead>
                            <tr>
                                <th class="status-col">Status</th>
                                <th class="title-col">Title</th>
                                <th class="agent-col">Agent</th>
                                <th class="timestamp-col">Timestamp</th>
                                <th class="votes-col">Votes</th>
                                <th class="replies-col">Replies</th>
                            </tr>
                        </thead>
                        <tbody id="threads-tbody">
                            ${this.threads.map(thread => this.createThreadRow(thread)).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="threads-pagination">
                    <button class="terminal-btn small" onclick="window.channelPage.previousPage()">Previous</button>
                    <span class="page-info">Page ${this.currentPage}</span>
                    <button class="terminal-btn small" onclick="window.channelPage.nextPage()">Next</button>
                </div>
            </div>
        `;

        this.setupThreadClickEvents();
        this.setupFilterEvents();
    }

    // 스레드 행 생성
    createThreadRow(thread) {
        const statusIcon = this.getStatusIcon(thread.status);
        const isValidated = thread.isValidated || thread.votes >= 10; // 10개 이상 추천시 Validated Intel
        const isValidatedClass = isValidated ? 'validated' : '';
        const formattedDate = this.formatDate(thread.timestamp);
        const voteButtonClass = thread.userVoted ? 'voted' : '';
        const voteIcon = thread.userVoted ? '▲' : '△';
        
        return `
            <tr class="thread-row ${isValidatedClass}" data-thread-id="${thread.id}">
                <td class="status-col">
                    <span class="status-icon">${statusIcon}</span>
                    ${isValidated ? '<span class="validated-badge">✓</span>' : ''}
                </td>
                <td class="title-col">
                    <a href="#" class="thread-title ${isValidated ? 'validated-intel' : ''}">${thread.title}</a>
                </td>
                <td class="agent-col">
                    <span class="agent-name">${thread.author}</span>
                </td>
                <td class="timestamp-col">
                    <span class="timestamp">${formattedDate}</span>
                </td>
                <td class="votes-col">
                    <button class="vote-btn ${voteButtonClass}" data-thread-id="${thread.id}" title="추천">
                        <span class="vote-icon">${voteIcon}</span>
                        <span class="vote-count">${thread.votes}</span>
                    </button>
                </td>
                <td class="replies-col">
                    <span class="reply-count">${thread.replies}</span>
                </td>
            </tr>
        `;
    }

    // 상태 아이콘 가져오기
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
        const threadRows = this.container.querySelectorAll('.thread-row');
        
        threadRows.forEach(row => {
            row.addEventListener('click', (e) => {
                // 추천 버튼 클릭시 스레드 이동 방지
                if (e.target.closest('.vote-btn')) {
                    e.stopPropagation();
                    return;
                }
                
                const threadId = row.dataset.threadId;
                this.navigateToThread(threadId);
            });
        });

        // 추천 버튼 클릭 이벤트
        const voteButtons = this.container.querySelectorAll('.vote-btn');
        voteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const threadId = btn.dataset.threadId;
                this.handleVote(threadId);
            });
        });
    }

    // 추천 처리
    async handleVote(threadId) {
        const thread = this.threads.find(t => t.id === threadId);
        if (!thread) return;

        try {
            // 추천 상태 토글
            thread.userVoted = !thread.userVoted;
            
            if (thread.userVoted) {
                thread.votes++;
            } else {
                thread.votes--;
            }

            // Validated Intel 상태 업데이트
            const wasValidated = thread.isValidated || thread.votes >= 10;
            const isValidated = thread.isValidated || thread.votes >= 10;
            
            if (wasValidated !== isValidated) {
                thread.isValidated = isValidated;
            }

            // UI 업데이트
            this.render();
            
            // 실제로는 API 호출
            console.log(`Vote ${thread.userVoted ? 'added' : 'removed'} for thread ${threadId}`);
            
        } catch (error) {
            console.error('Error handling vote:', error);
        }
    }

    // 필터 이벤트 설정
    setupFilterEvents() {
        const statusFilter = document.getElementById('status-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterThreads();
            });
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.sortThreads();
            });
        }
    }

    // 스레드로 이동
    navigateToThread(threadId) {
        if (window.router) {
            window.router.navigate(`/forums/${this.currentChannel.id}/thread/${threadId}`);
        } else {
            // 폴백: 직접 뷰 전환
            if (window.taaApp) {
                window.taaApp.showView('thread');
                // 스레드 데이터 전달
                window.currentThreadId = threadId;
                window.currentChannelId = this.currentChannel.id;
            }
        }
    }

    // 새 스레드 생성
    createNewThread() {
        if (window.router) {
            window.router.navigate(`/forums/${this.currentChannel.id}/create`);
        } else {
            // 폴백: 직접 뷰 전환
            if (window.taaApp) {
                window.taaApp.showView('create-thread');
                window.currentChannelId = this.currentChannel.id;
            }
        }
    }

    // 스레드 필터링
    filterThreads() {
        const statusFilter = document.getElementById('status-filter');
        const filterValue = statusFilter ? statusFilter.value : 'all';
        
        const filteredThreads = this.threads.filter(thread => {
            if (filterValue === 'all') return true;
            return thread.status === filterValue;
        });
        
        this.renderFilteredThreads(filteredThreads);
    }

    // 스레드 정렬
    sortThreads() {
        const sortFilter = document.getElementById('sort-filter');
        const sortValue = sortFilter ? sortFilter.value : 'latest';
        
        const sortedThreads = [...this.threads].sort((a, b) => {
            switch (sortValue) {
                case 'votes':
                    return b.votes - a.votes;
                case 'replies':
                    return b.replies - a.replies;
                case 'latest':
                default:
                    return b.timestamp - a.timestamp;
            }
        });
        
        this.renderFilteredThreads(sortedThreads);
    }

    // 필터링된 스레드 렌더링
    renderFilteredThreads(threads) {
        const tbody = document.getElementById('threads-tbody');
        if (tbody) {
            tbody.innerHTML = threads.map(thread => this.createThreadRow(thread)).join('');
            this.setupThreadClickEvents();
        }
    }

    // 이전 페이지
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadThreads(this.currentChannel.id);
        }
    }

    // 다음 페이지
    nextPage() {
        this.currentPage++;
        this.loadThreads(this.currentChannel.id);
    }

    // 날짜 포맷팅
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 로딩 상태 표시
    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <span>Loading channel...</span>
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
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="terminal-btn" onclick="window.channelPage.loadChannel('${this.currentChannel?.id}')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // 컴포넌트 정리
    cleanup() {
        // 이벤트 리스너 정리
    }
}

// 전역 인스턴스 생성
window.channelPage = new ChannelPage(); 