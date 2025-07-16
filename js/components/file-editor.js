// File Editor Component
class FileEditor {
    constructor() {
        this.currentFile = null;
        this.isEditing = false;
        this.autoSaveInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 파일 생성 관련
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveFile());
        document.getElementById('preview-btn')?.addEventListener('click', () => this.previewFile());
        
        // 파일 편집 관련
        document.getElementById('edit-btn')?.addEventListener('click', () => this.startEditing());
        document.getElementById('save-edit-btn')?.addEventListener('click', () => this.saveEdit());
        document.getElementById('cancel-edit-btn')?.addEventListener('click', () => this.cancelEdit());
        
        // 자동 저장 설정
        this.setupAutoSave();
    }

    setupAutoSave() {
        const contentTextarea = document.getElementById('file-content');
        const editTextarea = document.getElementById('edit-content');
        
        [contentTextarea, editTextarea].forEach(textarea => {
            if (textarea) {
                textarea.addEventListener('input', () => {
                    this.scheduleAutoSave();
                });
            }
        });
    }

    scheduleAutoSave() {
        if (this.autoSaveInterval) {
            clearTimeout(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setTimeout(() => {
            if (this.isEditing) {
                this.saveEdit(true); // 자동 저장
            } else {
                this.saveFile(true); // 자동 저장
            }
        }, 30000); // 30초 후 자동 저장
    }

    async saveFile(isAutoSave = false) {
        const title = document.getElementById('file-title')?.value.trim();
        const content = document.getElementById('file-content')?.value.trim();
        
        if (!title || !content) {
            if (!isAutoSave) {
                showNotification('제목과 내용을 모두 입력해주세요.', 'error');
            }
            return;
        }

        try {
            const fileData = {
                title: title,
                content: content,
                author: authService.getCurrentUser()?.uid || 'anonymous',
                authorName: authService.getCurrentUser()?.displayName || 'Unknown Agent',
                createdAt: new Date(),
                updatedAt: new Date(),
                clearance: authService.getCurrentUser()?.clearance || 1,
                version: 1
            };

            const fileId = await fileService.createFile(fileData);
            
            if (!isAutoSave) {
                showNotification('파일이 성공적으로 저장되었습니다.', 'success');
                this.clearEditor();
                showView('file-view');
                this.loadFile(fileId);
            }
        } catch (error) {
            console.error('파일 저장 실패:', error);
            if (!isAutoSave) {
                showNotification('파일 저장에 실패했습니다.', 'error');
            }
        }
    }

    async previewFile() {
        const title = document.getElementById('file-title')?.value.trim();
        const content = document.getElementById('file-content')?.value.trim();
        
        if (!title || !content) {
            showNotification('미리보기를 위해 제목과 내용을 입력해주세요.', 'warning');
            return;
        }

        // 임시 파일 데이터 생성
        const tempFile = {
            title: title,
            content: content,
            author: authService.getCurrentUser()?.displayName || 'Unknown Agent',
            createdAt: new Date(),
            clearance: authService.getCurrentUser()?.clearance || 1
        };

        // 미리보기 모드로 파일 표시
        this.displayFile(tempFile, true);
        showView('file-view');
    }

    clearEditor() {
        document.getElementById('file-title').value = '';
        document.getElementById('file-content').value = '';
    }

    async startEditing() {
        if (!this.currentFile) return;

        this.isEditing = true;
        
        // 편집 모드로 전환
        document.getElementById('edit-title').value = this.currentFile.title;
        document.getElementById('edit-content').value = this.currentFile.content;
        
        showView('edit-view');
    }

    async saveEdit(isAutoSave = false) {
        if (!this.currentFile) return;

        const title = document.getElementById('edit-title')?.value.trim();
        const content = document.getElementById('edit-content')?.value.trim();
        
        if (!title || !content) {
            if (!isAutoSave) {
                showNotification('제목과 내용을 모두 입력해주세요.', 'error');
            }
            return;
        }

        try {
            const updatedData = {
                title: title,
                content: content,
                updatedAt: new Date(),
                version: this.currentFile.version + 1
            };

            await fileService.updateFile(this.currentFile.id, updatedData);
            
            if (!isAutoSave) {
                showNotification('파일이 성공적으로 업데이트되었습니다.', 'success');
                this.isEditing = false;
                this.loadFile(this.currentFile.id);
            }
        } catch (error) {
            console.error('파일 업데이트 실패:', error);
            if (!isAutoSave) {
                showNotification('파일 업데이트에 실패했습니다.', 'error');
            }
        }
    }

    cancelEdit() {
        this.isEditing = false;
        showView('file-view');
    }

    async loadFile(fileId) {
        try {
            const file = await fileService.getFile(fileId);
            if (file) {
                this.currentFile = file;
                this.displayFile(file);
            }
        } catch (error) {
            console.error('파일 로드 실패:', error);
            showNotification('파일을 불러오는데 실패했습니다.', 'error');
        }
    }

    displayFile(file, isPreview = false) {
        this.currentFile = file;
        
        // 파일 정보 표시
        document.getElementById('file-display-title').textContent = file.title;
        document.getElementById('file-author').textContent = `AUTHOR: ${file.authorName || file.author}`;
        document.getElementById('file-date').textContent = `CREATED: ${new Date(file.createdAt).toLocaleString()}`;
        document.getElementById('file-clearance').textContent = `CLEARANCE: ${file.clearance}`;

        // 파일 내용 파싱 및 표시
        const parsedContent = wikiParser.parse(file.content);
        document.getElementById('file-body').innerHTML = parsedContent.html;
        
        // 목차 생성
        this.generateTableOfContents(parsedContent.headings);
        
        // 댓글 로드
        if (!isPreview) {
            commentService.loadComments(file.id);
        }

        // 편집 버튼 권한 확인
        const canEdit = authService.canEditFile(file);
        document.getElementById('edit-btn').style.display = canEdit ? 'inline-block' : 'none';
    }

    generateTableOfContents(headings) {
        const toc = document.getElementById('table-of-contents');
        if (!headings || headings.length === 0) {
            toc.innerHTML = '';
            return;
        }

        let tocHtml = '<h3>TABLE OF CONTENTS</h3><ul>';
        headings.forEach(heading => {
            tocHtml += `<li><a href="#${heading.id}" class="toc-link">${heading.text}</a></li>`;
        });
        tocHtml += '</ul>';
        
        toc.innerHTML = tocHtml;
    }
}

// 전역 인스턴스 생성
const fileEditor = new FileEditor(); 