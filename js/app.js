// TAA Archives - Main Application
// 메인 애플리케이션 로직 및 이벤트 처리

class TAAApp {
    constructor() {
        this.currentView = 'home';
        this.currentFile = null;
        this.isEditing = false;
        this.initApp();
    }

    // 애플리케이션 초기화
    async initApp() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupSearch();
        this.setupFileEditor();
        this.setupComments();
        this.setupWikiLinks();
        
        // 마이그레이션 상태 확인 (로그인 후)
        if (window.authService && window.authService.getCurrentUser()) {
            await this.checkMigrationStatus();
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 네비게이션 버튼
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.navigateToView(view);
            });
        });

        // 검색 입력
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // 파일 생성 버튼
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveFile();
            });
        }

        // 파일 편집 버튼
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editFile();
            });
        }

        // 파일 히스토리 버튼
        const historyBtn = document.getElementById('history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                if (this.currentFile && window.router) {
                    window.router.navigate(`/history`);
                }
            });
        }

        // 파일 논의 버튼
        const discussionBtn = document.getElementById('discussion-btn');
        if (discussionBtn) {
            discussionBtn.addEventListener('click', () => {
                if (this.currentFile && window.router) {
                    window.router.navigate(`/discussion/${this.currentFile.id}`);
                }
            });
        }

        // 댓글 제출 버튼
        const submitCommentBtn = document.getElementById('submit-comment');
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener('click', () => {
                this.submitComment();
            });
        }

        // Enter 키로 댓글 제출
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

    // 네비게이션 설정
    setupNavigation() {
        // 네비게이션 버튼 활성화 상태 관리
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 모든 버튼에서 active 클래스 제거
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                // 클릭된 버튼에 active 클래스 추가
                e.target.classList.add('active');
            });
        });
    }

    // 라우터를 통한 뷰 네비게이션
    navigateToView(viewName) {
        if (window.router) {
            switch (viewName) {
                case 'home':
                    window.router.navigate('/');
                    break;
                case 'create':
                    window.router.navigate('/create');
                    break;
                case 'recent':
                    window.router.navigate('/recent');
                    break;
                case 'history':
                    window.router.navigate('/history');
                    break;
                default:
                    this.showView(viewName);
            }
        } else {
            this.showView(viewName);
        }
    }

    // 검색 설정
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 500);
            });
        }
    }

    // 파일 에디터 설정
    setupFileEditor() {
        const fileContent = document.getElementById('file-content');
        const editContent = document.getElementById('edit-content');
        
        if (fileContent) {
            fileContent.addEventListener('input', () => {
                this.updatePreview();
            });
        }
        
        if (editContent) {
            editContent.addEventListener('input', () => {
                this.updateEditPreview();
            });
        }
    }

    // 댓글 시스템 설정
    setupComments() {
        // 댓글 입력 필드 자동 크기 조절
        const commentInput = document.getElementById('comment-input');
        if (commentInput) {
            commentInput.addEventListener('input', () => {
                commentInput.style.height = 'auto';
                commentInput.style.height = commentInput.scrollHeight + 'px';
            });
        }
    }

    // 위키 링크 설정
    setupWikiLinks() {
        // 위키 링크 클릭 이벤트 위임
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('wiki-link')) {
                e.preventDefault();
                const pageName = e.target.dataset.page;
                this.handleWikiLink(pageName);
            }
        });
    }

    // 뷰 전환
    showView(viewName) {
        // 현재 뷰 숨기기
        const currentView = document.querySelector('.view.active');
        if (currentView) {
            currentView.classList.remove('active');
        }

        // 새 뷰 표시
        const newView = document.getElementById(`${viewName}-view`);
        if (newView) {
            newView.classList.add('active');
            this.currentView = viewName;
            
            // 현재 뷰를 세션에 저장
            if (window.sessionManager) {
                sessionManager.setCurrentView(viewName);
            }
            
            // 뷰별 초기화
            this.initializeView(viewName);
        }
    }

    // 라우터를 통한 뷰 전환 (URL 업데이트 없이)
    showViewWithoutRoute(viewName) {
        // 현재 뷰 숨기기
        const currentView = document.querySelector('.view.active');
        if (currentView) {
            currentView.classList.remove('active');
        }

        // 새 뷰 표시
        const newView = document.getElementById(`${viewName}-view`);
        if (newView) {
            newView.classList.add('active');
            this.currentView = viewName;
            
            // 현재 뷰를 세션에 저장
            if (window.sessionManager) {
                sessionManager.setCurrentView(viewName);
            }
            
            // 뷰별 초기화
            this.initializeView(viewName);
        }
    }

    // 뷰별 초기화
    initializeView(viewName) {
        switch (viewName) {
            case 'home':
                this.initializeHomeView();
                break;
            case 'recent':
                this.initializeRecentView();
                break;
            case 'create':
                this.initializeCreateView();
                break;
            case 'history':
                this.initializeHistoryView();
                break;
        }
    }

    // 홈 뷰 초기화
    async initializeHomeView() {
        // 최근 파일 목록 로드
        try {
            const recentFiles = await fileService.getFiles({ limit: 5 });
            this.displayRecentFiles(recentFiles);
        } catch (error) {
            console.error('Error loading recent files:', error);
        }
        

    }

    // 최근 파일 뷰 초기화
    async initializeRecentView() {
        try {
            const files = await fileService.getFiles({ limit: 20 });
            this.displayFilesList(files);
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    // 파일 생성 뷰 초기화
    initializeCreateView() {
        const fileTitle = document.getElementById('file-title');
        const fileContent = document.getElementById('file-content');
        
        if (fileTitle) fileTitle.value = '';
        if (fileContent) fileContent.value = '';
    }

    // 히스토리 뷰 초기화
    async initializeHistoryView() {
        if (this.currentFile) {
            try {
                const history = await fileService.getFileHistory(this.currentFile.id);
                this.displayFileHistory(history);
            } catch (error) {
                console.error('Error loading file history:', error);
            }
        }
    }

    // 파일 저장
    async saveFile() {
        const fileTitle = document.getElementById('file-title');
        const fileContent = document.getElementById('file-content');
        
        if (!fileTitle || !fileContent) return;
        
        const title = fileTitle.value.trim();
        const content = fileContent.value.trim();
        
        if (!title || !content) {
            terminalEffects.showError('Please enter both title and content');
            return;
        }
        
        try {
            terminalEffects.showLoading(document.getElementById('save-btn'), 'SAVING');
            
            const fileId = await fileService.createFile(title, content);
            
            // 파일 보기 화면으로 전환
            this.loadFile(fileId);
            this.showView('file');
            
            terminalEffects.showSuccess('File created successfully');
            
        } catch (error) {
            console.error('Error saving file:', error);
            terminalEffects.showError('Failed to save file');
        } finally {
            terminalEffects.hideLoading(document.getElementById('save-btn'));
        }
    }

    // 파일 로드
    async loadFile(fileId) {
        try {
            const file = await fileService.getFile(fileId);
            if (file) {
                this.currentFile = file;
                this.displayFile(file);
                
                // 라우터를 통해 URL 업데이트
                if (window.router) {
                    window.router.navigate(`/article/${fileId}`);
                } else {
                    this.showView('file');
                }
                
                // 댓글 시스템 설정
                if (window.commentService) {
                    commentService.setupFileComments(fileId);
                }
            } else {
                terminalEffects.showError('File not found');
            }
        } catch (error) {
            console.error('Error loading file:', error);
            terminalEffects.showError('Failed to load file');
        }
    }

    // 파일 표시
    displayFile(file) {
        // 파일 제목
        const fileDisplayTitle = document.getElementById('file-display-title');
        if (fileDisplayTitle) fileDisplayTitle.textContent = file.title;
        
        // 파일 메타데이터
        const fileAuthor = document.getElementById('file-author');
        const fileDate = document.getElementById('file-date');
        const fileClearance = document.getElementById('file-clearance');
        
        if (fileAuthor) fileAuthor.textContent = `Author: ${file.authorName}`;
        if (fileDate) fileDate.textContent = `Updated: ${this.formatDate(file.updatedAt)}`;
        if (fileClearance) fileClearance.textContent = `Clearance: ${file.requiredClearance}`;
        
        // 파일 내용 파싱 및 표시
        this.parseAndDisplayFileContent(file.content);
        
        // 목차 생성
        this.generateTableOfContents(file.content);
    }

    // 파일 내용 파싱 및 표시
    parseAndDisplayFileContent(content) {
        const fileBody = document.getElementById('file-body');
        if (!fileBody) return;
        
        // 마크다운 파싱
        let html = wikiParser.parseMarkdown(content);
        
        // 제목에 ID 추가
        const headings = wikiParser.extractHeadings(content);
        html = wikiParser.addHeadingIds(html, headings);
        
        fileBody.innerHTML = html;
        
        // 위키 링크 이벤트 추가
        this.setupWikiLinkEvents(fileBody);
    }

    // 목차 생성
    generateTableOfContents(content) {
        const toc = document.getElementById('table-of-contents');
        if (!toc) return;
        
        const headings = wikiParser.extractHeadings(content);
        const tocHtml = wikiParser.generateTableOfContents(headings);
        
        toc.innerHTML = tocHtml;
    }

    // 위키 링크 이벤트 설정
    setupWikiLinkEvents(container) {
        const links = container.querySelectorAll('.wiki-link');
        links.forEach(link => {
            terminalEffects.addLinkHoverEffect(link);
        });
    }

    // 파일 편집
    editFile() {
        if (!this.currentFile) return;
        
        this.isEditing = true;
        
        // 편집 화면으로 전환
        const editTitle = document.getElementById('edit-title');
        const editContent = document.getElementById('edit-content');
        
        if (editTitle) editTitle.value = this.currentFile.title;
        if (editContent) editContent.value = this.currentFile.content;
        
        // 라우터를 통해 편집 페이지로 이동
        if (window.router) {
            window.router.navigate(`/edit/${this.currentFile.id}`);
        } else {
            this.showView('edit');
        }
    }

    // 파일 편집 저장
    async saveFileEdit() {
        if (!this.currentFile) return;
        
        const editTitle = document.getElementById('edit-title');
        const editContent = document.getElementById('edit-content');
        
        if (!editTitle || !editContent) return;
        
        const title = editTitle.value.trim();
        const content = editContent.value.trim();
        
        if (!title || !content) {
            terminalEffects.showError('Please enter both title and content');
            return;
        }
        
        try {
            terminalEffects.showLoading(document.getElementById('save-edit-btn'), 'SAVING');
            
            await fileService.updateFile(this.currentFile.id, title, content);
            
            // 파일 다시 로드
            await this.loadFile(this.currentFile.id);
            this.showView('file');
            
            this.isEditing = false;
            terminalEffects.showSuccess('File updated successfully');
            
        } catch (error) {
            console.error('Error updating file:', error);
            terminalEffects.showError('Failed to update file');
        } finally {
            terminalEffects.hideLoading(document.getElementById('save-edit-btn'));
        }
    }

    // 댓글 제출
    async submitComment() {
        if (!this.currentFile) {
            terminalEffects.showError('No file selected');
            return;
        }
        
        const commentInput = document.getElementById('comment-input');
        if (!commentInput) return;
        
        const content = commentInput.value.trim();
        if (!content) {
            terminalEffects.showError('Please enter a comment');
            return;
        }
        
        try {
            await commentService.addComment(this.currentFile.id, content);
            commentInput.value = '';
            commentInput.style.height = 'auto';
            
        } catch (error) {
            console.error('Error submitting comment:', error);
            terminalEffects.showError('Failed to submit comment');
        }
    }

    // 검색 수행
    async performSearch(query) {
        if (!query.trim()) {
            this.showView('home');
            return;
        }
        
        try {
            const results = await fileService.searchFiles(query);
            this.displaySearchResults(results, query);
        } catch (error) {
            console.error('Error performing search:', error);
            terminalEffects.showError('Search failed');
        }
    }

    // 검색 결과 표시
    displaySearchResults(results, query) {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;
        
        let html = `
            <div class="search-results">
                <h2>SEARCH RESULTS FOR: "${query}"</h2>
                <p>Found ${results.length} results</p>
        `;
        
        if (results.length === 0) {
            html += '<p>No files found matching your search.</p>';
        } else {
            results.forEach(result => {
                const preview = fileService.generateFilePreview(result.content);
                html += `
                    <div class="search-result-item" onclick="app.loadFile('${result.id}')">
                        <h3>${result.title}</h3>
                        <p>${preview}</p>
                        <small>Updated: ${this.formatDate(result.updatedAt)}</small>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
        // 임시 뷰 생성
        const tempView = document.createElement('div');
        tempView.className = 'view active';
        tempView.innerHTML = html;
        
        // 기존 뷰 숨기기
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // 검색 결과 표시
        contentArea.appendChild(tempView);
    }

    // 위키 링크 처리
    async handleWikiLink(pageName) {
        try {
            // 페이지 존재 여부 확인
            const exists = wikiParser.pageExists(pageName);
            
            if (exists) {
                // 기존 페이지 검색
                const results = await fileService.searchFiles(pageName);
                if (results.length > 0) {
                    this.loadFile(results[0].id);
                    this.showView('file');
                }
            } else {
                // 새 페이지 생성 제안
                this.showCreatePageSuggestion(pageName);
            }
        } catch (error) {
            console.error('Error handling wiki link:', error);
        }
    }

    // 새 페이지 생성 제안
    showCreatePageSuggestion(pageName) {
        const suggestion = document.createElement('div');
        suggestion.className = 'link-suggestion';
        suggestion.innerHTML = `
            <h4>CREATE NEW PAGE</h4>
            <p>The page "${pageName}" does not exist. Would you like to create it?</p>
            <div class="suggestion-actions">
                <button class="terminal-btn" onclick="app.createNewPage('${pageName}')">CREATE PAGE</button>
                <button class="terminal-btn" onclick="this.parentElement.parentElement.remove()">CANCEL</button>
            </div>
        `;
        
        // 제안을 현재 뷰에 추가
        const currentView = document.querySelector('.view.active');
        if (currentView) {
            currentView.appendChild(suggestion);
        }
    }

    // 새 페이지 생성
    createNewPage(pageName) {
        // 파일 생성 화면으로 전환
        this.showView('create');
        
        // 제목 필드에 페이지 이름 설정
        const fileTitle = document.getElementById('file-title');
        if (fileTitle) {
            fileTitle.value = pageName;
        }
        
        // 제안 제거
        const suggestion = document.querySelector('.link-suggestion');
        if (suggestion) {
            suggestion.remove();
        }
    }

    // 파일 목록 표시
    displayFilesList(files) {
        const filesList = document.getElementById('recent-files-list');
        if (!filesList) return;
        
        filesList.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.onclick = () => {
                if (window.router) {
                    window.router.navigate(`/article/${file.id}`);
                } else {
                    this.loadFile(file.id);
                }
            };
            
            const preview = fileService.generateFilePreview(file.content);
            
            fileItem.innerHTML = `
                <h3>${file.title}</h3>
                <p>${preview}</p>
                <div class="file-meta">
                    <span>By: ${file.authorName}</span>
                    <span>Updated: ${this.formatDate(file.updatedAt)}</span>
                    <span>Clearance: ${file.requiredClearance}</span>
                </div>
            `;
            
            filesList.appendChild(fileItem);
        });
    }

    // 최근 파일 표시
    displayRecentFiles(files) {
        // 홈 화면의 최근 파일 섹션에 표시
        const recentSection = document.querySelector('#home-view .recent-files');
        if (!recentSection) return;
        
        recentSection.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.onclick = () => {
                if (window.router) {
                    window.router.navigate(`/article/${file.id}`);
                } else {
                    this.loadFile(file.id);
                }
            };
            
            const preview = fileService.generateFilePreview(file.content);
            
            fileItem.innerHTML = `
                <h3>${file.title}</h3>
                <p>${preview}</p>
                <small>Updated: ${this.formatDate(file.updatedAt)}</small>
            `;
            
            recentSection.appendChild(fileItem);
        });
    }

    // 파일 히스토리 표시
    displayFileHistory(history) {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        history.forEach(version => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            historyItem.innerHTML = `
                <h4>Version ${version.version} - ${version.action}</h4>
                <div class="history-meta">
                    <span>By: ${version.authorName}</span>
                    <span>Date: ${this.formatDate(version.timestamp)}</span>
                </div>
                <div class="history-actions">
                    <button class="terminal-btn small" onclick="app.restoreVersion('${version.id}')">RESTORE</button>
                    <button class="terminal-btn small" onclick="app.viewVersion('${version.id}')">VIEW</button>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    // 버전 복원
    async restoreVersion(versionId) {
        if (!this.currentFile) return;
        
        try {
            await fileService.restoreVersion(this.currentFile.id, versionId);
            await this.loadFile(this.currentFile.id);
            this.showView('file');
        } catch (error) {
            console.error('Error restoring version:', error);
            terminalEffects.showError('Failed to restore version');
        }
    }

    // 버전 보기
    async viewVersion(versionId) {
        try {
            const versionDoc = await db.collection('file_history').doc(versionId).get();
            if (versionDoc.exists) {
                const versionData = versionDoc.data();
                this.displayFile(versionData);
                this.showView('file');
            }
        } catch (error) {
            console.error('Error viewing version:', error);
            terminalEffects.showError('Failed to load version');
        }
    }

    // 날짜 포맷팅
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 애플리케이션 정리
    cleanup() {
        // 댓글 서비스 정리
        commentService.cleanup();
        
        // 유령 터미널 정리
        ghostTerminals.cleanup();
    }

    // 마이그레이션 상태 확인
    async checkMigrationStatus() {
        try {
            if (window.authService) {
                const status = await window.authService.checkMigrationStatus();
                if (status && status.migrationNeeded) {
                    console.log('마이그레이션이 필요한 계정이 있습니다:', status);
                }
            }
        } catch (error) {
            console.error('마이그레이션 상태 확인 오류:', error);
        }
    }


}

// 전역 인스턴스 생성
const taaApp = new TAAApp();
window.app = taaApp;
window.taaApp = taaApp;

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// 전역 함수들
window.showView = (viewName) => app.showView(viewName);
window.loadFile = (fileId) => app.loadFile(fileId);

console.log('TAA Archives: Main application initialized');

// 모든 스크립트 로드 완료 후 부팅 시퀀스 초기화
if (window.initializeBootSequence) {
    console.log('Initializing boot sequence from app.js');
    initializeBootSequence();
} else {
    console.error('initializeBootSequence function not found');
} 