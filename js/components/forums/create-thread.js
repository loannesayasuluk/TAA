// TAA Archives - Create Thread Component
// 스레드 생성 페이지: 새로운 토론 시작

class CreateThread {
    constructor() {
        this.forumService = window.forumService;
        this.container = null;
        this.channelId = null;
        this.currentChannel = null;
        this.draftKey = null;
    }

    // 스레드 생성 페이지 초기화
    async init(container, channelId) {
        this.container = container;
        this.channelId = channelId;
        this.draftKey = `thread_draft_${channelId}`;
        
        this.render();
        await this.loadChannelInfo();
        this.loadDraft();
        this.setupEventListeners();
    }

    // 스레드 생성 페이지 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="channel-header">
                <div class="channel-info">
                    <h1 id="channel-title">새 토론 작성</h1>
                    <p id="channel-description">채널 정보를 불러오는 중...</p>
                </div>
                <div class="channel-actions">
                    <button class="terminal-btn" onclick="window.router.navigate('/forums/${this.channelId}')">채널로 돌아가기</button>
                    <button class="terminal-btn" onclick="window.router.navigate('/forums')">포럼 목록</button>
                </div>
            </div>
            
            <div class="thread-content">
                <form id="create-thread-form">
                    <div class="form-group">
                        <label for="thread-title">제목</label>
                        <input type="text" id="thread-title" class="terminal-input" placeholder="토론 제목을 입력하세요" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="thread-content">내용</label>
                        <div class="content-editor">
                            <div class="editor-tabs">
                                <button type="button" class="tab-btn active" data-tab="write">작성</button>
                                <button type="button" class="tab-btn" data-tab="preview">미리보기</button>
                            </div>
                            <div class="editor-content">
                                <textarea id="thread-content" class="terminal-textarea" placeholder="토론 내용을 입력하세요 (Markdown 지원)" rows="15" required></textarea>
                                <div id="content-preview" class="content-preview" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="terminal-btn secondary" onclick="this.saveDraft()">임시저장</button>
                        <button type="button" class="terminal-btn secondary" onclick="this.loadDraft()">임시저장 불러오기</button>
                        <button type="submit" class="terminal-btn primary">토론 시작</button>
                    </div>
                </form>
            </div>
        `;
    }

    // 채널 정보 로드
    async loadChannelInfo() {
        try {
            const forums = await this.forumService.getForums();
            this.currentChannel = forums.find(f => f.id === this.channelId);
            
            if (this.currentChannel) {
                const title = document.getElementById('channel-title');
                const description = document.getElementById('channel-description');
                
                if (title) title.textContent = `${this.currentChannel.name} - 새 토론 작성`;
                if (description) description.textContent = this.currentChannel.description;
            } else {
                this.showError('채널을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('Error loading channel info:', error);
            this.showError('채널 정보를 불러오는데 실패했습니다.');
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        const form = document.getElementById('create-thread-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createThread();
            });
        }

        // 탭 전환
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 자동 저장
        const titleInput = document.getElementById('thread-title');
        const contentTextarea = document.getElementById('thread-content');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.autoSave();
            });
        }
        
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => {
                this.autoSave();
            });
        }
    }

    // 탭 전환
    switchTab(tabName) {
        const writeTab = document.querySelector('[data-tab="write"]');
        const previewTab = document.querySelector('[data-tab="preview"]');
        const textarea = document.getElementById('thread-content');
        const preview = document.getElementById('content-preview');

        if (tabName === 'write') {
            writeTab.classList.add('active');
            previewTab.classList.remove('active');
            textarea.style.display = 'block';
            preview.style.display = 'none';
        } else if (tabName === 'preview') {
            previewTab.classList.add('active');
            writeTab.classList.remove('active');
            textarea.style.display = 'none';
            preview.style.display = 'block';
            this.updatePreview();
        }
    }

    // 미리보기 업데이트
    updatePreview() {
        const content = document.getElementById('thread-content').value;
        const preview = document.getElementById('content-preview');
        
        if (preview) {
            // 간단한 Markdown 렌더링
            const html = this.renderMarkdown(content);
            preview.innerHTML = html;
        }
    }

    // Markdown 렌더링 (간단한 버전)
    renderMarkdown(text) {
        return text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`(.*)`/gim, '<code>$1</code>')
            .replace(/\n/gim, '<br>');
    }

    // 자동 저장
    autoSave() {
        const title = document.getElementById('thread-title')?.value || '';
        const content = document.getElementById('thread-content')?.value || '';
        
        if (title || content) {
            const draft = { title, content, timestamp: Date.now() };
            localStorage.setItem(this.draftKey, JSON.stringify(draft));
        }
    }

    // 임시저장
    saveDraft() {
        this.autoSave();
        this.showSuccess('임시저장되었습니다.');
    }

    // 임시저장 불러오기
    loadDraft() {
        const draftData = localStorage.getItem(this.draftKey);
        if (draftData) {
            try {
                const draft = JSON.parse(draftData);
                const titleInput = document.getElementById('thread-title');
                const contentTextarea = document.getElementById('thread-content');
                
                if (titleInput) titleInput.value = draft.title || '';
                if (contentTextarea) contentTextarea.value = draft.content || '';
                
                this.showSuccess('임시저장된 내용을 불러왔습니다.');
            } catch (error) {
                console.error('Error loading draft:', error);
                this.showError('임시저장 불러오기에 실패했습니다.');
            }
        } else {
            this.showError('임시저장된 내용이 없습니다.');
        }
    }

    // 스레드 생성
    async createThread() {
        const title = document.getElementById('thread-title')?.value?.trim();
        const content = document.getElementById('thread-content')?.value?.trim();

        if (!title) {
            this.showError('제목을 입력해주세요.');
            return;
        }

        if (!content) {
            this.showError('내용을 입력해주세요.');
            return;
        }

        try {
            // 로딩 상태 표시
            const submitBtn = document.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '생성 중...';
            submitBtn.disabled = true;

            // 스레드 생성
            const threadId = await this.forumService.createThread(this.channelId, title, content);
            
            // 임시저장 삭제
            localStorage.removeItem(this.draftKey);
            
            this.showSuccess('토론이 성공적으로 생성되었습니다.');
            
            // 생성된 스레드 페이지로 이동
            setTimeout(() => {
                window.router.navigate(`/forums/${this.channelId}/thread/${threadId}`);
            }, 1000);

        } catch (error) {
            console.error('Error creating thread:', error);
            this.showError('토론 생성에 실패했습니다.');
            
            // 버튼 상태 복원
            const submitBtn = document.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
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
        // 임시저장 정리 (선택사항)
        // localStorage.removeItem(this.draftKey);
    }
}

// 전역 인스턴스 생성
window.createThread = new CreateThread();

console.log('TAA Archives: Create thread component initialized'); 