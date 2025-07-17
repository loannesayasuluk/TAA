// TAA Archives - Enhanced Wiki Component
// Namuwiki 스타일 위키 기능 강화

class WikiEnhanced {
    constructor() {
        this.currentFile = null;
        this.isEditing = false;
        this.originalContent = '';
        this.wikiLinks = new Map();
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // AMEND FILE 버튼
        document.addEventListener('click', (e) => {
            if (e.target.id === 'amend-file-btn') {
                this.startAmending();
            }
        });

        // DISCUSS FILE 버튼
        document.addEventListener('click', (e) => {
            if (e.target.id === 'discuss-file-btn') {
                this.startDiscussion();
            }
        });

        // SAVE REVISION 버튼
        document.addEventListener('click', (e) => {
            if (e.target.id === 'save-revision-btn') {
                this.saveRevision();
            }
        });

        // 위키 링크 클릭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('wiki-link')) {
                e.preventDefault();
                const pageName = e.target.dataset.page;
                this.handleWikiLink(pageName);
            }
        });
    }

    // 파일 로드 시 위키 기능 초기화
    initializeWikiFeatures(file) {
        this.currentFile = file;
        this.originalContent = file.content || '';
        
        // 파일 제목 아래에 버튼들 추가
        this.addActionButtons();
        
        // 위키 링크 파싱 및 렌더링
        this.parseAndRenderWikiLinks();
        
        // 파일 내용에 위키 링크 이벤트 추가
        this.setupWikiLinkEvents();
    }

    // 액션 버튼 추가
    addActionButtons() {
        const fileHeader = document.querySelector('.file-header');
        if (!fileHeader || !this.currentFile) return;

        // 기존 버튼들 확인
        let actionButtons = fileHeader.querySelector('.file-actions');
        if (!actionButtons) {
            actionButtons = document.createElement('div');
            actionButtons.className = 'file-actions';
            fileHeader.appendChild(actionButtons);
        }

        // AMEND FILE 버튼 추가
        if (!document.getElementById('amend-file-btn')) {
            const amendBtn = document.createElement('button');
            amendBtn.id = 'amend-file-btn';
            amendBtn.className = 'terminal-btn warning';
            amendBtn.textContent = 'AMEND FILE';
            actionButtons.appendChild(amendBtn);
        }

        // DISCUSS FILE 버튼 추가
        if (!document.getElementById('discuss-file-btn')) {
            const discussBtn = document.createElement('button');
            discussBtn.id = 'discuss-file-btn';
            discussBtn.className = 'terminal-btn';
            discussBtn.textContent = 'DISCUSS FILE';
            actionButtons.appendChild(discussBtn);
        }
    }

    // 위키 링크 파싱 및 렌더링
    parseAndRenderWikiLinks() {
        const fileBody = document.getElementById('file-body');
        if (!fileBody || !this.currentFile) return;

        let content = this.currentFile.content || '';
        
        // 위키 링크 패턴 찾기: [[페이지명]]
        const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;
        let match;
        this.wikiLinks.clear();

        while ((match = wikiLinkPattern.exec(content)) !== null) {
            const pageName = match[1];
            const fullMatch = match[0];
            
            // 위키 링크를 HTML로 변환
            const linkHtml = `<a href="#" class="wiki-link" data-page="${pageName}">${pageName}</a>`;
            content = content.replace(fullMatch, linkHtml);
            
            // 링크 정보 저장
            this.wikiLinks.set(pageName, {
                exists: false, // 실제로는 API에서 확인
                fullMatch: fullMatch,
                linkHtml: linkHtml
            });
        }

        // 파싱된 내용을 렌더링
        fileBody.innerHTML = this.parseWikiContent(content);
    }

    // 위키 콘텐츠 파싱 (마크다운 + 위키 링크)
    parseWikiContent(content) {
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

    // 위키 링크 이벤트 설정
    setupWikiLinkEvents() {
        const wikiLinks = document.querySelectorAll('.wiki-link');
        
        wikiLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = link.dataset.page;
                this.handleWikiLink(pageName);
            });
        });
    }

    // 위키 링크 처리
    async handleWikiLink(pageName) {
        try {
            // 페이지 존재 여부 확인
            const pageExists = await this.checkPageExists(pageName);
            
            if (pageExists) {
                // 기존 페이지로 이동
                this.navigateToPage(pageName);
            } else {
                // 새 페이지 생성 제안
                this.showCreatePageSuggestion(pageName);
            }
        } catch (error) {
            console.error('Error handling wiki link:', error);
            if (window.terminalEffects) {
                terminalEffects.showError('페이지를 불러오는데 실패했습니다.');
            }
        }
    }

    // 페이지 존재 여부 확인
    async checkPageExists(pageName) {
        try {
            // Firestore에서 페이지 검색
            const snapshot = await db.collection('articles')
                .where('title', '==', pageName)
                .limit(1)
                .get();
            
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking page existence:', error);
            return false;
        }
    }

    // 페이지로 이동
    navigateToPage(pageName) {
        if (window.router) {
            // 실제로는 페이지 ID를 찾아서 이동해야 함
            window.router.navigate(`/article/${pageName}`);
        } else {
            // 폴백: 검색으로 페이지 찾기
            this.searchAndNavigateToPage(pageName);
        }
    }

    // 검색으로 페이지 찾기
    async searchAndNavigateToPage(pageName) {
        try {
            const snapshot = await db.collection('articles')
                .where('title', '==', pageName)
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                if (window.taaApp) {
                    window.taaApp.loadFile(doc.id);
                }
            }
        } catch (error) {
            console.error('Error searching for page:', error);
        }
    }

    // 새 페이지 생성 제안
    showCreatePageSuggestion(pageName) {
        const fileBody = document.getElementById('file-body');
        if (!fileBody) return;

        const suggestionHtml = `
            <div class="link-suggestion">
                <div class="suggestion-content">
                    <h3>Page Not Found</h3>
                    <p>The page "<strong>${pageName}</strong>" does not exist.</p>
                    <div class="suggestion-actions">
                        <button class="terminal-btn" onclick="window.wikiEnhanced.createNewPage('${pageName}')">
                            Create Page
                        </button>
                        <button class="terminal-btn small" onclick="window.wikiEnhanced.removeSuggestion()">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 기존 제안 제거
        const existingSuggestion = fileBody.querySelector('.link-suggestion');
        if (existingSuggestion) {
            existingSuggestion.remove();
        }

        // 새 제안 추가
        fileBody.insertAdjacentHTML('afterbegin', suggestionHtml);
    }

    // 새 페이지 생성
    async createNewPage(pageName) {
        try {
            // 파일 생성 페이지로 이동
            if (window.router) {
                window.router.navigate('/create');
            } else {
                if (window.taaApp) {
                    window.taaApp.showView('create');
                }
            }

            // 제목 필드에 페이지 이름 설정
            setTimeout(() => {
                const fileTitle = document.getElementById('file-title');
                if (fileTitle) {
                    fileTitle.value = pageName;
                }
            }, 100);

            // 제안 제거
            this.removeSuggestion();

        } catch (error) {
            console.error('Error creating new page:', error);
            if (window.terminalEffects) {
                terminalEffects.showError('페이지 생성 중 오류가 발생했습니다.');
            }
        }
    }

    // 제안 제거
    removeSuggestion() {
        const suggestion = document.querySelector('.link-suggestion');
        if (suggestion) {
            suggestion.remove();
        }
    }

    // 파일 수정 시작
    startAmending() {
        if (!this.currentFile) return;

        this.isEditing = true;
        this.originalContent = this.currentFile.content || '';

        // 편집 모드로 전환
        this.showEditMode();
    }

    // 편집 모드 표시
    showEditMode() {
        const fileBody = document.getElementById('file-body');
        if (!fileBody) return;

        // 편집 폼 생성
        const editForm = `
            <div class="edit-form">
                <div class="edit-header">
                    <h3>AMEND FILE: ${this.currentFile.title}</h3>
                    <div class="edit-controls">
                        <button id="save-revision-btn" class="terminal-btn">SAVE REVISION</button>
                        <button id="cancel-edit-btn" class="terminal-btn small">CANCEL</button>
                    </div>
                </div>
                <div class="edit-content">
                    <textarea id="edit-content" class="content-textarea" rows="20">${this.originalContent}</textarea>
                </div>
                <div class="edit-help">
                    <h4>Wiki Formatting Help:</h4>
                    <ul>
                        <li><code># Heading</code> - Main heading</li>
                        <li><code>## Subheading</code> - Subheading</li>
                        <li><code>**bold**</code> - Bold text</li>
                        <li><code>*italic*</code> - Italic text</li>
                        <li><code>[[PageName]]</code> - Wiki link</li>
                        <li><code>`code`</code> - Inline code</li>
                    </ul>
                </div>
            </div>
        `;

        fileBody.innerHTML = editForm;

        // 취소 버튼 이벤트
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.cancelEdit();
        }

        // 편집기 포커스
        const editTextarea = document.getElementById('edit-content');
        if (editTextarea) {
            editTextarea.focus();
        }
    }

    // 편집 취소
    cancelEdit() {
        this.isEditing = false;
        this.renderOriginalContent();
    }

    // 원본 내용 렌더링
    renderOriginalContent() {
        const fileBody = document.getElementById('file-body');
        if (!fileBody || !this.currentFile) return;

        fileBody.innerHTML = this.parseWikiContent(this.currentFile.content || '');
        this.setupWikiLinkEvents();
    }

    // 수정사항 저장
    async saveRevision() {
        const editTextarea = document.getElementById('edit-content');
        if (!editTextarea || !this.currentFile) return;

        const newContent = editTextarea.value.trim();
        
        if (!newContent) {
            if (window.terminalEffects) {
                terminalEffects.showError('내용을 입력해주세요.');
            }
            return;
        }

        try {
            // 수정사항 저장
            await this.saveFileRevision(newContent);
            
            this.isEditing = false;
            
            if (window.terminalEffects) {
                terminalEffects.showSuccess('파일이 성공적으로 수정되었습니다.');
            }

            // 수정된 내용으로 다시 렌더링
            this.currentFile.content = newContent;
            this.renderOriginalContent();

        } catch (error) {
            console.error('Error saving revision:', error);
            if (window.terminalEffects) {
                terminalEffects.showError('파일 저장 중 오류가 발생했습니다.');
            }
        }
    }

    // 파일 수정사항 저장
    async saveFileRevision(newContent) {
        if (!this.currentFile) return;

        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // 파일 업데이트
        await db.collection('articles').doc(this.currentFile.id).update({
            content: newContent,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            version: (this.currentFile.version || 1) + 1
        });

        // 히스토리 기록
        await db.collection('file_history').add({
            fileId: this.currentFile.id,
            action: 'amended',
            authorId: user.uid,
            authorName: this.getCurrentUserName(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            version: (this.currentFile.version || 1) + 1,
            changes: {
                content: newContent
            }
        });
    }

    // 현재 사용자 이름 가져오기
    getCurrentUserName() {
        if (window.sessionManager) {
            const user = sessionManager.getCurrentUser();
            return user?.displayName || user?.email || 'Unknown Agent';
        }
        return 'Unknown Agent';
    }

    // 토론 시작
    startDiscussion() {
        if (!this.currentFile) return;

        // 토론 페이지로 이동
        if (window.router) {
            window.router.navigate(`/files/${this.currentFile.id}/discussion`);
        } else {
            if (window.taaApp) {
                window.taaApp.showView('discussion');
                // 파일 정보 전달
                window.currentDiscussionFile = this.currentFile;
            }
        }
    }

    // 컴포넌트 정리
    cleanup() {
        this.currentFile = null;
        this.isEditing = false;
        this.originalContent = '';
        this.wikiLinks.clear();
    }
}

// 전역 인스턴스 생성
window.wikiEnhanced = new WikiEnhanced(); 