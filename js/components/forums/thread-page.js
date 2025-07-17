// TAA Archives - Thread Page Component
// 개별 게시물과 댓글을 보여주는 페이지

class ThreadPage {
    constructor(containerId = 'thread-view') {
        this.containerId = containerId;
        this.container = null;
        this.currentThread = null;
        this.currentChannel = null;
        this.comments = [];
        this.isLoading = false;
        this.userVote = null; // 'up', 'down', null
        this.unsubscribeComments = null; // 실시간 리스너 해제용
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`ThreadPage: Container with id '${this.containerId}' not found`);
            return;
        }
        
        this.setupEventListeners();
    }

    // 스레드 로드
    async loadThread(channelId, threadId) {
        try {
            this.isLoading = true;
            this.showLoading();

            // 채널 정보 로드
            this.currentChannel = await this.getChannelInfo(channelId);
            
            // 스레드 정보 로드
            this.currentThread = await this.getThreadInfo(threadId);
            
            // 댓글 목록 로드
            await this.loadComments(threadId);
            
            this.render();
        } catch (error) {
            console.error('ThreadPage: Error loading thread:', error);
            this.showError('스레드를 불러오는데 실패했습니다.');
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
                description: 'General topics and discussions among agents'
            },
            'classified-intel': {
                id: 'classified-intel',
                name: 'CLASSIFIED INTEL',
                description: 'Classified intelligence sharing and analysis'
            },
            'mission-reports': {
                id: 'mission-reports',
                name: 'MISSION REPORTS',
                description: 'Field mission reports and debriefings'
            }
        };

        return channels[channelId] || channels['general-discussion'];
    }

    // 스레드 정보 가져오기
    async getThreadInfo(threadId) {
        // 실제로는 API에서 가져와야 함
        const threads = {
            'thread-1': {
                id: 'thread-1',
                title: 'New surveillance equipment deployment',
                content: `# Surveillance Equipment Update

## Overview
New surveillance equipment has been deployed across all sectors. This equipment provides enhanced monitoring capabilities and improved data collection.

## Technical Specifications
- **Range**: 500m radius
- **Resolution**: 4K Ultra HD
- **Night Vision**: Infrared + Thermal
- **Storage**: 1TB local + cloud backup

## Deployment Schedule
1. Sector A: Completed
2. Sector B: In Progress
3. Sector C: Pending
4. Sector D: Pending

## Training Required
All field agents must complete the new equipment training module before using the devices.

## Security Protocols
- Biometric authentication required
- Data encryption at rest and in transit
- Automatic backup every 6 hours

Please report any issues or concerns through the technical support channel.`,
                author: 'Agent_Alpha',
                timestamp: new Date(Date.now() - 1800000),
                votes: 15,
                replies: 8,
                isValidated: true,
                status: 'active',
                viewCount: 156
            },
            'thread-2': {
                id: 'thread-2',
                title: 'Field report: Operation Nightfall',
                content: `# Operation Nightfall - Field Report

## Mission Summary
Operation Nightfall was executed successfully with minimal casualties and maximum intelligence gathered.

## Key Findings
- Target location confirmed
- Evidence of illegal activities documented
- Multiple suspects identified
- Contraband seized and catalogued

## Agent Performance
All agents performed admirably under pressure. Special recognition to Agent_Beta for exceptional tactical leadership.

## Lessons Learned
1. Night operations require additional preparation
2. Communication protocols need refinement
3. Equipment performed as expected

## Next Steps
- Intelligence analysis in progress
- Follow-up operations being planned
- Training recommendations being prepared

This operation serves as a model for future night missions.`,
                author: 'Agent_Beta',
                timestamp: new Date(Date.now() - 3600000),
                votes: 23,
                replies: 12,
                isValidated: true,
                status: 'active',
                viewCount: 234
            }
        };

        return threads[threadId] || threads['thread-1'];
    }

    // 댓글 목록 로드 (실시간 동기화)
    async loadComments(threadId) {
        try {
            // 기존 리스너 해제
            if (this.unsubscribeComments) {
                this.unsubscribeComments();
            }

            // 실시간 리스너 설정
            this.unsubscribeComments = window.forumService.getThreadComments(threadId, (comments) => {
                this.comments = comments;
                this.renderComments();
            });

        } catch (error) {
            console.error('ThreadPage: Error loading comments:', error);
            this.showError('댓글을 불러오는데 실패했습니다.');
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 투표 버튼들
        const upvoteBtn = document.getElementById('upvote-btn');
        const downvoteBtn = document.getElementById('downvote-btn');
        
        if (upvoteBtn) {
            upvoteBtn.addEventListener('click', () => {
                this.handleVote('up');
            });
        }
        
        if (downvoteBtn) {
            downvoteBtn.addEventListener('click', () => {
                this.handleVote('down');
            });
        }

        // 댓글 제출 버튼
        const submitCommentBtn = document.getElementById('submit-comment-btn');
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener('click', () => {
                this.submitComment();
            });
        }

        // 댓글 입력 필드
        const commentInput = document.getElementById('comment-input');
        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.submitComment();
                }
            });
        }
    }

    // 스레드 페이지 렌더링
    render() {
        if (!this.container || !this.currentThread) return;

        this.container.innerHTML = `
            <div class="thread-header">
                <div class="breadcrumb">
                    <a href="#" onclick="window.router.navigate('/forums')">FORUMS</a> > 
                    <a href="#" onclick="window.router.navigate('/forums/${this.currentChannel.id}')">${this.currentChannel.name}</a> > 
                    <span>${this.currentThread.title}</span>
                </div>
                
                <div class="thread-title-section">
                    <h1 class="thread-title ${this.currentThread.isValidated ? 'validated' : ''}">
                        ${this.currentThread.title}
                        ${this.currentThread.isValidated ? '<span class="validated-badge">✓</span>' : ''}
                    </h1>
                    
                    <div class="thread-meta">
                        <span class="author">By: ${this.currentThread.author}</span>
                        <span class="timestamp">${this.formatDate(this.currentThread.timestamp)}</span>
                        <span class="views">Views: ${this.currentThread.viewCount}</span>
                    </div>
                </div>
                
                <div class="thread-actions">
                    <div class="vote-section">
                        <button id="upvote-btn" class="vote-btn ${this.userVote === 'up' ? 'voted' : ''}" title="Upvote">
                            <span class="vote-icon">▲</span>
                            <span class="vote-count">${this.currentThread.votes}</span>
                        </button>
                        <button id="downvote-btn" class="vote-btn ${this.userVote === 'down' ? 'voted' : ''}" title="Downvote">
                            <span class="vote-icon">▼</span>
                        </button>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="terminal-btn small" onclick="window.threadPage.shareThread()">SHARE</button>
                        <button class="terminal-btn small" onclick="window.threadPage.reportThread()">REPORT</button>
                    </div>
                </div>
            </div>
            
            <div class="thread-content">
                <div class="content-body">
                    ${this.parseContent(this.currentThread.content)}
                </div>
            </div>
            
            <div class="comments-section">
                <h2>AGENT COMMENTS (${this.comments.length})</h2>
                
                <div class="comment-form">
                    <textarea id="comment-input" class="terminal-input" placeholder="Add your comment..." rows="3"></textarea>
                    <button id="submit-comment-btn" class="terminal-btn">SUBMIT COMMENT</button>
                </div>
                
                <div class="comments-list" id="comments-list">
                    ${this.comments.map(comment => this.createCommentElement(comment)).join('')}
                </div>
            </div>
        `;

        this.setupCommentEvents();
    }

    // 콘텐츠 파싱 (마크다운 스타일)
    parseContent(content) {
        if (!content) return '';

        let parsed = content;

        // 제목 처리
        parsed = parsed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        parsed = parsed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        parsed = parsed.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // 굵은 글씨
        parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 기울임꼴
        parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 코드 블록
        parsed = parsed.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // 인라인 코드
        parsed = parsed.replace(/`(.*?)`/g, '<code>$1</code>');

        // 목록
        parsed = parsed.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        parsed = parsed.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

        // 줄바꿈
        parsed = parsed.replace(/\n/g, '<br>');

        return parsed;
    }

    // 댓글 요소 생성
    createCommentElement(comment) {
        const formattedDate = this.formatDate(comment.timestamp);
        
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-timestamp">${formattedDate}</span>
                    <span class="comment-votes">${comment.votes} votes</span>
                </div>
                
                <div class="comment-content">
                    ${comment.content}
                </div>
                
                <div class="comment-actions">
                    <button class="comment-vote-btn" onclick="window.threadPage.voteComment('${comment.id}', 'up')">
                        <span class="vote-icon">▲</span>
                    </button>
                    <button class="comment-vote-btn" onclick="window.threadPage.voteComment('${comment.id}', 'down')">
                        <span class="vote-icon">▼</span>
                    </button>
                    <button class="comment-reply-btn" onclick="window.threadPage.replyToComment('${comment.id}')">
                        Reply
                    </button>
                </div>
            </div>
        `;
    }

    // 댓글 이벤트 설정
    setupCommentEvents() {
        // 댓글 관련 이벤트들은 이미 HTML에 onclick으로 설정됨
    }

    // 투표 처리
    async handleVote(voteType) {
        try {
            if (!this.currentThread) return;

            // 이미 같은 투표를 했다면 취소
            if (this.userVote === voteType) {
                this.userVote = null;
                this.currentThread.votes -= (voteType === 'up' ? 1 : -1);
            } else {
                // 이전 투표가 있었다면 취소하고 새로 투표
                if (this.userVote) {
                    this.currentThread.votes -= (this.userVote === 'up' ? 1 : -1);
                }
                this.userVote = voteType;
                this.currentThread.votes += (voteType === 'up' ? 1 : -1);
            }

            // UI 업데이트
            this.updateVoteUI();

            // 서버에 투표 전송
            await this.sendVoteToServer(voteType);

        } catch (error) {
            console.error('Error handling vote:', error);
            if (window.terminalEffects) {
                terminalEffects.showError('투표 처리 중 오류가 발생했습니다.');
            }
        }
    }

    // 투표 UI 업데이트
    updateVoteUI() {
        const upvoteBtn = document.getElementById('upvote-btn');
        const downvoteBtn = document.getElementById('downvote-btn');
        const voteCount = document.querySelector('.vote-count');

        if (upvoteBtn) {
            upvoteBtn.classList.toggle('voted', this.userVote === 'up');
        }
        if (downvoteBtn) {
            downvoteBtn.classList.toggle('voted', this.userVote === 'down');
        }
        if (voteCount) {
            voteCount.textContent = this.currentThread.votes;
        }
    }

    // 서버에 투표 전송
    async sendVoteToServer(voteType) {
        // 실제로는 API 호출
        console.log(`Sending vote: ${voteType} for thread: ${this.currentThread.id}`);
    }

    // 댓글 투표
    async voteComment(commentId, voteType) {
        try {
            const comment = this.comments.find(c => c.id === commentId);
            if (comment) {
                comment.votes += (voteType === 'up' ? 1 : -1);
                this.updateCommentVotes(commentId, comment.votes);
            }
        } catch (error) {
            console.error('Error voting comment:', error);
        }
    }

    // 댓글 투표 수 업데이트
    updateCommentVotes(commentId, votes) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            const voteElement = commentElement.querySelector('.comment-votes');
            if (voteElement) {
                voteElement.textContent = `${votes} votes`;
            }
        }
    }

    // 댓글 제출
    async submitComment() {
        const commentInput = document.getElementById('comment-input');
        if (!commentInput) return;

        const content = commentInput.value.trim();
        if (!content) {
            if (window.terminalEffects) {
                terminalEffects.showError('댓글 내용을 입력해주세요.');
            }
            return;
        }

        try {
            // Firestore에 댓글 저장
            await window.forumService.createComment(this.currentThread.id, content);

            // 입력 필드 초기화
            commentInput.value = '';

            if (window.terminalEffects) {
                terminalEffects.showSuccess('댓글이 성공적으로 등록되었습니다.');
            }

        } catch (error) {
            console.error('Error submitting comment:', error);
            if (window.terminalEffects) {
                terminalEffects.showError('댓글 등록 중 오류가 발생했습니다.');
            }
        }
    }

    // 서버에 댓글 전송
    async sendCommentToServer(comment) {
        // 실제로는 API 호출
        console.log('Sending comment to server:', comment);
    }

    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        if (window.sessionManager) {
            return sessionManager.getCurrentUser();
        }
        return { displayName: 'Unknown Agent', email: 'unknown@internal.taa' };
    }

    // 스레드 공유
    shareThread() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            if (window.terminalEffects) {
                terminalEffects.showSuccess('스레드 링크가 클립보드에 복사되었습니다.');
            }
        });
    }

    // 스레드 신고
    reportThread() {
        if (window.terminalEffects) {
            terminalEffects.showWarning('스레드 신고 기능은 관리자에게 문의하세요.');
        }
    }

    // 댓글에 답글
    replyToComment(commentId) {
        const commentInput = document.getElementById('comment-input');
        if (commentInput) {
            commentInput.focus();
            commentInput.value = `@${commentId} `;
        }
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
                    <span>Loading thread...</span>
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
                    <button class="terminal-btn" onclick="window.threadPage.loadThread('${this.currentChannel?.id}', '${this.currentThread?.id}')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // 컴포넌트 정리
    cleanup() {
        if (this.unsubscribeComments) {
            this.unsubscribeComments();
            this.unsubscribeComments = null;
        }
    }
}

// 전역 인스턴스 생성
window.threadPage = new ThreadPage(); 