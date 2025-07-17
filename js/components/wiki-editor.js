// TAA Archives - Wiki Editor Component
// 위키 문서 편집을 관리하는 독립적인 컴포넌트

class WikiEditor {
    constructor(containerId = 'create-view') {
        this.containerId = containerId;
        this.container = null;
        this.currentFile = null;
        this.isEditing = false;
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000; // 30초
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`WikiEditor: Container with id '${this.containerId}' not found`);
            return;
        }
        
        this.setupEventListeners();
        this.setupAutoSave();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 제목 입력
        const titleInput = document.getElementById('file-title');
        if (titleInput) {
            titleInput.addEventListener('input', this.handleTitleChange.bind(this));
            titleInput.addEventListener('keydown', this.handleTitleKeydown.bind(this));
        }

        // 내용 입력
        const contentTextarea = document.getElementById('file-content');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', this.handleContentChange.bind(this));
            contentTextarea.addEventListener('keydown', this.handleContentKeydown.bind(this));
        }

        // 저장 버튼
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', this.saveFile.bind(this));
        }

        // 미리보기 버튼
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', this.togglePreview.bind(this));
        }

        // 편집 버튼 (파일 보기 모드에서)
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', this.startEditing.bind(this));
        }
    }

    // 자동 저장 설정
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.autoSave();
            }
        }, this.autoSaveDelay);
    }

    // 제목 변경 처리
    handleTitleChange(event) {
        this.markAsChanged();
        this.updateCharacterCount();
    }

    // 제목 키보드 처리
    handleTitleKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const contentTextarea = document.getElementById('file-content');
            if (contentTextarea) {
                contentTextarea.focus();
            }
        }
    }

    // 내용 변경 처리
    handleContentChange(event) {
        this.markAsChanged();
        this.updateCharacterCount();
        this.updatePreview();
    }

    // 내용 키보드 처리
    handleContentKeydown(event) {
        // Tab 키 처리
        if (event.key === 'Tab') {
            event.preventDefault();
            const start = event.target.selectionStart;
            const end = event.target.selectionEnd;
            
            event.target.value = event.target.value.substring(0, start) + 
                               '\t' + 
                               event.target.value.substring(end);
            
            event.target.selectionStart = event.target.selectionEnd = start + 1;
        }

        // Ctrl+S 저장
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.saveFile();
        }
    }

    // 변경 사항 표시
    markAsChanged() {
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'SAVE*';
            saveBtn.classList.add('has-changes');
        }
    }

    // 변경 사항 초기화
    clearChanges() {
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'SAVE';
            saveBtn.classList.remove('has-changes');
        }
    }

    // 문자 수 업데이트
    updateCharacterCount() {
        const contentTextarea = document.getElementById('file-content');
        const titleInput = document.getElementById('file-title');
        
        if (contentTextarea && titleInput) {
            const contentLength = contentTextarea.value.length;
            const titleLength = titleInput.value.length;
            const totalLength = contentLength + titleLength;
            
            // 문자 수 표시 요소가 있으면 업데이트
            const charCountElement = document.getElementById('char-count');
            if (charCountElement) {
                charCountElement.textContent = `${totalLength} characters`;
            }
        }
    }

    // 미리보기 업데이트
    updatePreview() {
        const contentTextarea = document.getElementById('file-content');
        const previewElement = document.getElementById('preview-content');
        
        if (contentTextarea && previewElement) {
            const content = contentTextarea.value;
            const parsedContent = this.parseWikiContent(content);
            previewElement.innerHTML = parsedContent;
        }
    }

    // 위키 콘텐츠 파싱
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

        // 위키 링크
        parsed = parsed.replace(/\[\[(.*?)\]\]/g, '<a href="#" class="wiki-link" data-page="$1">$1</a>');

        // 코드 블록
        parsed = parsed.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // 인라인 코드
        parsed = parsed.replace(/`(.*?)`/g, '<code>$1</code>');

        // 줄바꿈
        parsed = parsed.replace(/\n/g, '<br>');

        return parsed;
    }

    // 미리보기 토글
    togglePreview() {
        const contentTextarea = document.getElementById('file-content');
        const previewElement = document.getElementById('preview-content');
        const previewBtn = document.getElementById('preview-btn');
        
        if (contentTextarea && previewElement) {
            if (previewElement.style.display === 'none' || !previewElement.style.display) {
                // 미리보기 표시
                contentTextarea.style.display = 'none';
                previewElement.style.display = 'block';
                previewBtn.textContent = 'EDIT';
                this.updatePreview();
            } else {
                // 편집 모드로 복귀
                contentTextarea.style.display = 'block';
                previewElement.style.display = 'none';
                previewBtn.textContent = 'PREVIEW';
            }
        }
    }

    // 파일 저장
    async saveFile() {
        try {
            const titleInput = document.getElementById('file-title');
            const contentTextarea = document.getElementById('file-content');
            
            if (!titleInput || !contentTextarea) {
                throw new Error('Required elements not found');
            }

            const title = titleInput.value.trim();
            const content = contentTextarea.value.trim();

            if (!title) {
                this.showError('제목을 입력해주세요.');
                return;
            }

            if (!content) {
                this.showError('내용을 입력해주세요.');
                return;
            }

            this.showLoading();

            const fileData = {
                title: title,
                content: content,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                requiredClearance: this.getCurrentUserClearance()
            };

            if (this.currentFile && this.isEditing) {
                // 기존 파일 수정
                await this.updateFile(fileData);
            } else {
                // 새 파일 생성
                await this.createFile(fileData);
            }

            this.clearChanges();
            this.showSuccess('파일이 성공적으로 저장되었습니다.');

            // 저장 후 파일 보기로 이동
            if (this.currentFile) {
                if (window.router) {
                    window.router.navigate(`/article/${this.currentFile.id}`);
                }
            }

        } catch (error) {
            console.error('WikiEditor: Error saving file:', error);
            this.showError('파일 저장 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    // 새 파일 생성
    async createFile(fileData) {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        const newFileData = {
            ...fileData,
            authorId: user.uid,
            authorName: userData?.displayName || user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            viewCount: 0,
            version: 1
        };

        const docRef = await db.collection('articles').add(newFileData);
        this.currentFile = { id: docRef.id, ...newFileData };

        // 히스토리 기록
        await this.createHistoryRecord('created', newFileData);
    }

    // 파일 수정
    async updateFile(fileData) {
        if (!this.currentFile) {
            throw new Error('No current file to update');
        }

        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        const updateData = {
            ...fileData,
            authorId: user.uid,
            authorName: userData?.displayName || user.email,
            version: (this.currentFile.version || 1) + 1
        };

        await db.collection('articles').doc(this.currentFile.id).update(updateData);
        this.currentFile = { ...this.currentFile, ...updateData };

        // 히스토리 기록
        await this.createHistoryRecord('updated', updateData);
    }

    // 히스토리 기록 생성
    async createHistoryRecord(action, fileData) {
        const user = auth.currentUser;
        if (!user || !this.currentFile) return;

        const historyData = {
            fileId: this.currentFile.id,
            action: action,
            authorId: user.uid,
            authorName: fileData.authorName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            version: fileData.version,
            changes: {
                title: fileData.title,
                content: fileData.content
            }
        };

        await db.collection('file_history').add(historyData);
    }

    // 자동 저장
    async autoSave() {
        if (!this.hasUnsavedChanges()) return;

        try {
            console.log('Auto-saving...');
            await this.saveFile();
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    // 저장되지 않은 변경사항 확인
    hasUnsavedChanges() {
        const titleInput = document.getElementById('file-title');
        const contentTextarea = document.getElementById('file-content');
        
        if (!titleInput || !contentTextarea) return false;

        const currentTitle = titleInput.value.trim();
        const currentContent = contentTextarea.value.trim();

        if (this.currentFile) {
            return currentTitle !== this.currentFile.title || 
                   currentContent !== this.currentFile.content;
        } else {
            return currentTitle !== '' || currentContent !== '';
        }
    }

    // 편집 모드 시작
    startEditing() {
        if (!this.currentFile) return;

        this.isEditing = true;
        this.loadFileForEditing();
    }

    // 편집을 위한 파일 로드
    loadFileForEditing() {
        const titleInput = document.getElementById('file-title');
        const contentTextarea = document.getElementById('file-content');

        if (titleInput && contentTextarea && this.currentFile) {
            titleInput.value = this.currentFile.title || '';
            contentTextarea.value = this.currentFile.content || '';
            
            this.updateCharacterCount();
            this.updatePreview();
        }
    }

    // 현재 사용자 보안 등급 가져오기
    getCurrentUserClearance() {
        if (window.sessionManager) {
            return sessionManager.getCurrentUser()?.securityClearance || 1;
        }
        return 1;
    }

    // 로딩 상태 표시
    showLoading() {
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'SAVING...';
            saveBtn.disabled = true;
        }
    }

    // 로딩 상태 숨기기
    hideLoading() {
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'SAVE';
            saveBtn.disabled = false;
        }
    }

    // 성공 메시지 표시
    showSuccess(message) {
        if (window.terminalEffects) {
            terminalEffects.showSuccess(message);
        }
    }

    // 에러 메시지 표시
    showError(message) {
        if (window.terminalEffects) {
            terminalEffects.showError(message);
        }
    }

    // 컴포넌트 정리
    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// 전역 인스턴스 생성
window.wikiEditor = new WikiEditor(); 