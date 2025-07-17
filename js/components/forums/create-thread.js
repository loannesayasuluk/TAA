// TAA Archives - Create Thread Component
// 스레드 생성 페이지

class CreateThread {
    constructor(containerId = 'create-thread-view') {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.channelId = null;
        this.forumService = window.forumService;
        this.draftKey = 'thread-draft';
        
        if (!this.container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDraft();
    }

    setupEventListeners() {
        // 폼 제출
        const form = this.container.querySelector('#create-thread-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitThread();
            });
        }

        // 자동 저장
        const titleInput = this.container.querySelector('#thread-title');
        const contentTextarea = this.container.querySelector('#thread-content');
        
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.saveDraft();
            });
        }
        
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => {
                this.saveDraft();
            });
        }

        // 미리보기 토글
        const previewBtn = this.container.querySelector('#preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.togglePreview();
            });
        }

        // 취소 버튼
        const cancelBtn = this.container.querySelector('#cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.navigateBack();
            });
        }

        // 초안 삭제 버튼
        const clearDraftBtn = this.container.querySelector('#clear-draft-btn');
        if (clearDraftBtn) {
            clearDraftBtn.addEventListener('click', () => {
                this.clearDraft();
            });
        }
    }

    // 채널 설정
    setChannel(channelId) {
        this.channelId = channelId;
        this.updateChannelInfo(channelId);
    }

    // 채널 정보 업데이트
    async updateChannelInfo(channelId) {
        try {
            const channels = await this.forumService.getChannels();
            const channel = channels.find(ch => ch.id === channelId);
            
            if (channel) {
                const channelInfo = this.container.querySelector('.channel-info');
                if (channelInfo) {
                    channelInfo.innerHTML = `
                        <h2>#${channel.name}</h2>
                        <p>${channel.description || '설명이 없습니다.'}</p>
                    `;
                }
            }
        } catch (error) {
            console.error('Error updating channel info:', error);
        }
    }

    // 스레드 제출
    async submitThread() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentTextarea = this.container.querySelector('#thread-content');
        
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();

        // 유효성 검사
        if (!title) {
            showNotification('제목을 입력해주세요.', 'warning');
            titleInput.focus();
            return;
        }

        if (!content) {
            showNotification('내용을 입력해주세요.', 'warning');
            contentTextarea.focus();
            return;
        }

        if (title.length < 5) {
            showNotification('제목은 5자 이상 입력해주세요.', 'warning');
            titleInput.focus();
            return;
        }

        if (content.length < 10) {
            showNotification('내용은 10자 이상 입력해주세요.', 'warning');
            contentTextarea.focus();
            return;
        }

        try {
            this.showSubmitting();
            
            const threadData = {
                channelId: this.channelId,
                title: title,
                content: content
            };

            const threadId = await this.forumService.createThread(threadData);
            
            // 초안 삭제
            this.clearDraft();
            
            showNotification('스레드가 성공적으로 생성되었습니다.', 'success');
            
            // 스레드 페이지로 이동
            this.navigateToThread(threadId);
            
        } catch (error) {
            console.error('Error creating thread:', error);
            showNotification('스레드 생성에 실패했습니다.', 'error');
            this.hideSubmitting();
        }
    }

    // 미리보기 토글
    togglePreview() {
        const contentTextarea = this.container.querySelector('#thread-content');
        const previewArea = this.container.querySelector('#preview-area');
        const previewBtn = this.container.querySelector('#preview-btn');
        
        if (!contentTextarea || !previewArea) return;

        if (previewArea.style.display === 'none' || !previewArea.style.display) {
            // 미리보기 표시
            const content = contentTextarea.value;
            previewArea.innerHTML = this.formatContent(content);
            previewArea.style.display = 'block';
            contentTextarea.style.display = 'none';
            previewBtn.textContent = '편집 모드';
        } else {
            // 편집 모드로 전환
            previewArea.style.display = 'none';
            contentTextarea.style.display = 'block';
            previewBtn.textContent = '미리보기';
        }
    }

    // 내용 포맷팅 (마크다운 지원)
    formatContent(content) {
        if (!content) return '';
        
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\n/g, '<br>');
    }

    // 초안 저장
    saveDraft() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentTextarea = this.container.querySelector('#thread-content');
        
        if (!titleInput || !contentTextarea) return;

        const draft = {
            title: titleInput.value,
            content: contentTextarea.value,
            channelId: this.channelId,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(this.draftKey, JSON.stringify(draft));
    }

    // 초안 로드
    loadDraft() {
        const draftData = localStorage.getItem(this.draftKey);
        if (!draftData) return;

        try {
            const draft = JSON.parse(draftData);
            const titleInput = this.container.querySelector('#thread-title');
            const contentTextarea = this.container.querySelector('#thread-content');
            
            if (titleInput && contentTextarea) {
                titleInput.value = draft.title || '';
                contentTextarea.value = draft.content || '';
                
                // 초안이 있으면 알림 표시
                if (draft.title || draft.content) {
                    this.showDraftNotification();
                }
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }

    // 초안 삭제
    clearDraft() {
        localStorage.removeItem(this.draftKey);
        
        const titleInput = this.container.querySelector('#thread-title');
        const contentTextarea = this.container.querySelector('#thread-content');
        
        if (titleInput) titleInput.value = '';
        if (contentTextarea) contentTextarea.value = '';
        
        showNotification('초안이 삭제되었습니다.', 'success');
    }

    // 초안 알림 표시
    showDraftNotification() {
        const draftNotification = this.container.querySelector('#draft-notification');
        if (draftNotification) {
            draftNotification.style.display = 'block';
        }
    }

    // 제출 중 표시
    showSubmitting() {
        const submitBtn = this.container.querySelector('#submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '생성 중...';
        }
    }

    // 제출 중 숨기기
    hideSubmitting() {
        const submitBtn = this.container.querySelector('#submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '스레드 생성';
        }
    }

    // 스레드 페이지로 이동
    navigateToThread(threadId) {
        if (window.router) {
            window.router.navigate(`/forums/${this.channelId}/thread/${threadId}`);
        } else {
            window.location.href = `/forums/${this.channelId}/thread/${threadId}`;
        }
    }

    // 뒤로가기
    navigateBack() {
        if (window.router) {
            window.router.navigate(`/forums/${this.channelId}`);
        } else {
            window.history.back();
        }
    }

    // 정리
    cleanup() {
        // 페이지를 벗어날 때 자동 저장
        this.saveDraft();
    }
}

// 전역 인스턴스 생성
window.createThread = new CreateThread();

console.log('TAA Archives: CreateThread component initialized'); 