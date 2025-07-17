// TAA Archives - Article List Component
// 문서 목록을 관리하는 독립적인 컴포넌트

class ArticleList {
    constructor(containerId = 'recent-files-list') {
        this.containerId = containerId;
        this.container = null;
        this.articles = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.isLoading = false;
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`ArticleList: Container with id '${this.containerId}' not found`);
            return;
        }
        
        this.setupEventListeners();
        this.render();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 무한 스크롤 (필요시)
        if (this.container) {
            this.container.addEventListener('scroll', this.handleScroll.bind(this));
        }
    }

    // 스크롤 처리
    handleScroll(event) {
        const { scrollTop, scrollHeight, clientHeight } = event.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && !this.isLoading) {
            this.loadMore();
        }
    }

    // 문서 목록 로드
    async loadArticles(options = {}) {
        try {
            this.isLoading = true;
            this.showLoading();

            const { limit = this.itemsPerPage, orderBy = 'updatedAt', orderDirection = 'desc' } = options;
            
            // Firestore에서 문서 가져오기
            const articlesRef = db.collection('articles');
            const query = articlesRef
                .orderBy(orderBy, orderDirection)
                .limit(limit);

            const snapshot = await query.get();
            this.articles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.render();
        } catch (error) {
            console.error('ArticleList: Error loading articles:', error);
            this.showError('문서 목록을 불러오는데 실패했습니다.');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // 더 많은 문서 로드
    async loadMore() {
        if (this.isLoading) return;
        
        this.currentPage++;
        const additionalArticles = await this.loadArticles({
            limit: this.itemsPerPage,
            skip: (this.currentPage - 1) * this.itemsPerPage
        });
        
        if (additionalArticles && additionalArticles.length > 0) {
            this.articles = [...this.articles, ...additionalArticles];
            this.render();
        }
    }

    // 문서 목록 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (this.articles.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.articles.forEach(article => {
            const articleElement = this.createArticleElement(article);
            this.container.appendChild(articleElement);
        });
    }

    // 개별 문서 요소 생성
    createArticleElement(article) {
        const articleDiv = document.createElement('div');
        articleDiv.className = 'file-item';
        articleDiv.dataset.articleId = article.id;

        const preview = this.generatePreview(article.content);
        const formattedDate = this.formatDate(article.updatedAt);

        articleDiv.innerHTML = `
            <div class="article-header">
                <h3 class="article-title">${article.title}</h3>
                <span class="article-clearance">Level ${article.requiredClearance || 1}</span>
            </div>
            <p class="article-preview">${preview}</p>
            <div class="article-meta">
                <span class="article-author">By: ${article.authorName || 'Unknown'}</span>
                <span class="article-date">Updated: ${formattedDate}</span>
                <span class="article-views">Views: ${article.viewCount || 0}</span>
            </div>
        `;

        // 클릭 이벤트 추가
        articleDiv.addEventListener('click', () => {
            this.handleArticleClick(article);
        });

        return articleDiv;
    }

    // 빈 상태 렌더링
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>No documents found</h3>
                <p>No documents have been created yet.</p>
                <button class="terminal-btn" onclick="router.navigate('/create')">
                    Create First Document
                </button>
            </div>
        `;
    }

    // 문서 클릭 처리
    handleArticleClick(article) {
        // 라우터를 통한 네비게이션
        if (window.router) {
            window.router.navigate(`/article/${article.id}`);
        } else {
            // 폴백: 직접 파일 로드
            if (window.taaApp) {
                window.taaApp.loadFile(article.id);
            }
        }

        // 클릭 효과
        this.addClickEffect(article.id);
    }

    // 클릭 효과 추가
    addClickEffect(articleId) {
        const articleElement = document.querySelector(`[data-article-id="${articleId}"]`);
        if (articleElement) {
            articleElement.style.transform = 'scale(0.98)';
            articleElement.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                articleElement.style.transform = '';
            }, 100);
        }
    }

    // 미리보기 생성
    generatePreview(content) {
        if (!content) return 'No content available';
        
        // HTML 태그 제거
        const plainText = content.replace(/<[^>]*>/g, '');
        
        // 첫 150자만 표시
        return plainText.length > 150 
            ? plainText.substring(0, 150) + '...' 
            : plainText;
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

    // 로딩 상태 표시
    showLoading() {
        if (this.container) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.innerHTML = `
                <div class="loading-spinner"></div>
                <span>Loading documents...</span>
            `;
            this.container.appendChild(loadingDiv);
        }
    }

    // 로딩 상태 숨기기
    hideLoading() {
        const loadingIndicator = this.container.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
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
                    <button class="terminal-btn" onclick="this.loadArticles()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // 문서 검색
    searchArticles(query) {
        if (!query.trim()) {
            this.render();
            return;
        }

        const filteredArticles = this.articles.filter(article => 
            article.title.toLowerCase().includes(query.toLowerCase()) ||
            article.content.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFiltered(filteredArticles);
    }

    // 필터링된 문서 렌더링
    renderFiltered(articles) {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (articles.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try different search terms.</p>
                </div>
            `;
            return;
        }

        articles.forEach(article => {
            const articleElement = this.createArticleElement(article);
            this.container.appendChild(articleElement);
        });
    }

    // 컴포넌트 정리
    cleanup() {
        if (this.container) {
            this.container.removeEventListener('scroll', this.handleScroll.bind(this));
        }
    }
}

// 전역 인스턴스 생성
window.articleList = new ArticleList(); 