// TAA Archives - Create Thread Component
// 새로운 스레드(게시물)를 생성하는 컴포넌트

class CreateThread {
    constructor(containerId = 'create-thread-view') {
        this.containerId = containerId;
        this.container = null;
        this.currentChannel = null;
        this.isSubmitting = false;
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`CreateThread: Container with id '${this.containerId}' not found`);
            return;
        }
        
        this.setupEventListeners();
    }

    // 채널 정보 설정
    setChannel(channelId) {
        this.currentChannel = this.getChannelInfo(channelId);
        this.render();
    }

    // 채널 정보 가져오기
    getChannelInfo(channelId) {
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

    // 이벤트 리스너 설정
    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'create-thread-btn') {
                this.createThread();
            } else if (e.target.id === 'preview-thread-btn') {
                this.previewThread();
            } else if (e.target.id === 'cancel-btn') {
                this.cancelCreation();
            }
        });

        // 제목 입력 필드 자동 저장
        const titleInput = this.container.querySelector('#thread-title');
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.autoSave();
            });
        }

        // 내용 입력 필드 자동 저장
        const contentInput = this.container.querySelector('#thread-content');
        if (contentInput) {
            contentInput.addEventListener('input', () => {
                this.autoSave();
            });
        }
    }

    // 렌더링
    render() {
        if (!this.currentChannel) return;

        this.container.innerHTML = `
            <div class="thread-editor">
                <div class="editor-header">
                    <div class="channel-info">
                        <h1>새 스레드 생성</h1>
                        <p>채널: ${this.currentChannel.name} - ${this.currentChannel.description}</p>
                    </div>
                    <div class="editor-controls">
                        <button id="preview-thread-btn" class="terminal-btn">미리보기</button>
                        <button id="create-thread-btn" class="terminal-btn">스레드 생성</button>
                        <button id="cancel-btn" class="terminal-btn">취소</button>
                    </div>
                </div>
                
                <div class="editor-content">
                    <div class="input-group">
                        <label for="thread-title">제목</label>
                        <input type="text" id="thread-title" class="title-input" 
                               placeholder="스레드 제목을 입력하세요..." maxlength="200">
                    </div>
                    
                    <div class="input-group">
                        <label for="thread-content">내용</label>
                        <textarea id="thread-content" class="content-textarea" 
                                  placeholder="스레드 내용을 입력하세요...&#10;&#10;마크다운 형식을 지원합니다:&#10;# 제목&#10;**굵게**&#10;*기울임*&#10;#태그&#10;&#10;내부 링크: [[파일명]]"></textarea>
                    </div>
                    
                    <div class="editor-footer">
                        <div class="editor-tips">
                            <h4>작성 팁:</h4>
                            <ul>
                                <li>명확하고 구체적인 제목을 사용하세요</li>
                                <li>관련 태그를 추가하여 검색을 용이하게 하세요</li>
                                <li>내부 링크를 사용하여 관련 문서와 연결하세요</li>
                                <li>기밀 정보는 적절한 보안 등급을 설정하세요</li>
                            </ul>
                        </div>
                        
                        <div class="editor-stats">
                            <span id="char-count">0자</span>
                            <span id="word-count">0단어</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupAutoSave();
        this.updateStats();
    }

    // 자동 저장 설정
    setupAutoSave() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentInput = this.container.querySelector('#thread-content');

        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.autoSave();
                this.updateStats();
            });
        }

        if (contentInput) {
            contentInput.addEventListener('input', () => {
                this.autoSave();
                this.updateStats();
            });
        }
    }

    // 통계 업데이트
    updateStats() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentInput = this.container.querySelector('#thread-content');
        const charCount = this.container.querySelector('#char-count');
        const wordCount = this.container.querySelector('#word-count');

        if (titleInput && contentInput && charCount && wordCount) {
            const title = titleInput.value;
            const content = contentInput.value;
            const totalChars = title.length + content.length;
            const totalWords = (title + ' ' + content).trim().split(/\s+/).filter(word => word.length > 0).length;

            charCount.textContent = `${totalChars}자`;
            wordCount.textContent = `${totalWords}단어`;
        }
    }

    // 자동 저장
    autoSave() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentInput = this.container.querySelector('#thread-content');

        if (titleInput && contentInput) {
            const draft = {
                title: titleInput.value,
                content: contentInput.value,
                channelId: this.currentChannel.id,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem('thread-draft', JSON.stringify(draft));
        }
    }

    // 자동 저장된 내용 복원
    restoreDraft() {
        const draft = localStorage.getItem('thread-draft');
        if (draft) {
            try {
                const draftData = JSON.parse(draft);
                if (draftData.channelId === this.currentChannel.id) {
                    const titleInput = this.container.querySelector('#thread-title');
                    const contentInput = this.container.querySelector('#thread-content');

                    if (titleInput && contentInput) {
                        titleInput.value = draftData.title || '';
                        contentInput.value = draftData.content || '';
                        this.updateStats();
                        
                        if (draftData.title || draftData.content) {
                            terminalEffects.showInfo('이전에 작성 중이던 내용을 복원했습니다.');
                        }
                    }
                }
            } catch (error) {
                console.error('Error restoring draft:', error);
            }
        }
    }

    // 스레드 생성
    async createThread() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentInput = this.container.querySelector('#thread-content');

        if (!titleInput || !contentInput) return;

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        // 유효성 검사
        if (!title) {
            terminalEffects.showError('제목을 입력해주세요.');
            titleInput.focus();
            return;
        }

        if (!content) {
            terminalEffects.showError('내용을 입력해주세요.');
            contentInput.focus();
            return;
        }

        if (title.length > 200) {
            terminalEffects.showError('제목은 200자를 초과할 수 없습니다.');
            titleInput.focus();
            return;
        }

        try {
            this.isSubmitting = true;
            this.updateSubmitButton();

            // Firestore에 스레드 저장
            const threadId = await window.forumService.createThread(
                this.currentChannel.id,
                title,
                content,
                this.currentChannel.requiredClearance
            );

            // 자동 저장된 내용 삭제
            localStorage.removeItem('thread-draft');

            terminalEffects.showSuccess('스레드가 성공적으로 생성되었습니다.');

            // 생성된 스레드로 이동
            if (window.router) {
                window.router.navigate(`/forums/${this.currentChannel.id}/thread/${threadId}`);
            }

        } catch (error) {
            console.error('Error creating thread:', error);
            terminalEffects.showError('스레드 생성 중 오류가 발생했습니다.');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton();
        }
    }

    // 미리보기
    previewThread() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentInput = this.container.querySelector('#thread-content');

        if (!titleInput || !contentInput) return;

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title && !content) {
            terminalEffects.showWarning('미리보기할 내용이 없습니다.');
            return;
        }

        // 미리보기 모달 표시
        this.showPreviewModal(title, content);
    }

    // 미리보기 모달 표시
    showPreviewModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <h2>미리보기</h2>
                    <button class="close-btn" onclick="this.closest('.preview-modal').remove()">×</button>
                </div>
                <div class="preview-body">
                    <h1>${this.escapeHtml(title || '제목 없음')}</h1>
                    <div class="preview-text">
                        ${this.parseMarkdown(content || '내용 없음')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 모달 외부 클릭시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 취소
    cancelCreation() {
        const titleInput = this.container.querySelector('#thread-title');
        const contentInput = this.container.querySelector('#thread-content');

        if (titleInput && contentInput) {
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();

            if (title || content) {
                if (confirm('작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?')) {
                    localStorage.removeItem('thread-draft');
                    this.goBack();
                }
            } else {
                this.goBack();
            }
        } else {
            this.goBack();
        }
    }

    // 뒤로 가기
    goBack() {
        if (window.router) {
            window.router.navigate(`/forums/${this.currentChannel.id}`);
        }
    }

    // 제출 버튼 업데이트
    updateSubmitButton() {
        const submitBtn = this.container.querySelector('#create-thread-btn');
        if (submitBtn) {
            if (this.isSubmitting) {
                submitBtn.textContent = '생성 중...';
                submitBtn.disabled = true;
            } else {
                submitBtn.textContent = '스레드 생성';
                submitBtn.disabled = false;
            }
        }
    }

    // 마크다운 파싱 (간단한 버전)
    parseMarkdown(text) {
        return text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/#(\w+)/g, '<span class="tag">#$1</span>')
            .replace(/\n/g, '<br>');
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 정리
    cleanup() {
        // 자동 저장된 내용 정리 (선택사항)
        // localStorage.removeItem('thread-draft');
    }
}

// 전역 인스턴스 생성
window.createThread = new CreateThread(); 