// TAA Archives - Search Results Component
// 검색 결과를 표시하고 고급 필터링을 제공하는 컴포넌트

class SearchResults {
    constructor(containerId = 'search-results-view') {
        this.containerId = containerId;
        this.container = null;
        this.searchQuery = '';
        this.searchResults = [];
        this.filteredResults = [];
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        // 필터 옵션
        this.filters = {
            author: '',
            dateFrom: '',
            dateTo: '',
            clearance: 'all',
            type: 'all'
        };
        
        this.init();
    }

    // 컴포넌트 초기화
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`SearchResults: Container with id '${this.containerId}' not found`);
            return;
        }
        
        this.setupEventListeners();
        this.loadSearchParams();
    }

    // URL 파라미터에서 검색 조건 로드
    loadSearchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.searchQuery = urlParams.get('q') || '';
        this.filters.author = urlParams.get('author') || '';
        this.filters.dateFrom = urlParams.get('dateFrom') || '';
        this.filters.dateTo = urlParams.get('dateTo') || '';
        this.filters.clearance = urlParams.get('clearance') || 'all';
        this.filters.type = urlParams.get('type') || 'all';
        
        if (this.searchQuery) {
            this.performSearch();
        }
    }

    // 검색 수행
    async performSearch() {
        if (!this.searchQuery.trim()) {
            this.showView('home');
            return;
        }
        
        try {
            this.isLoading = true;
            this.showLoading();
            
            // 실제로는 API에서 검색 결과를 가져옴
            this.searchResults = await this.mockSearchResults();
            this.applyFilters();
            this.render();
            
        } catch (error) {
            console.error('SearchResults: Error performing search:', error);
            this.showError('검색에 실패했습니다');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // 목업 검색 결과 (실제로는 API 호출)
    async mockSearchResults() {
        // 실제 검색 로직 시뮬레이션
        const mockResults = [
            {
                id: 'file-1',
                title: 'Surveillance Protocol Alpha',
                content: 'This document contains the surveillance protocol for Alpha sector operations...',
                author: 'Agent_Alpha',
                type: 'file',
                clearance: 2,
                updatedAt: new Date(Date.now() - 3600000),
                score: 0.95
            },
            {
                id: 'file-2',
                title: 'Field Report: Operation Nightfall',
                content: 'Detailed field report from Operation Nightfall including intelligence gathered...',
                author: 'Agent_Beta',
                type: 'file',
                clearance: 3,
                updatedAt: new Date(Date.now() - 7200000),
                score: 0.87
            },
            {
                id: 'thread-1',
                title: 'New equipment deployment discussion',
                content: 'Discussion about the new surveillance equipment deployment in sector 7...',
                author: 'Agent_Gamma',
                type: 'thread',
                clearance: 1,
                updatedAt: new Date(Date.now() - 1800000),
                score: 0.76
            },
            {
                id: 'file-3',
                title: 'Training Manual: Advanced Surveillance',
                content: 'Comprehensive training manual for advanced surveillance techniques...',
                author: 'Agent_Delta',
                type: 'file',
                clearance: 2,
                updatedAt: new Date(Date.now() - 86400000),
                score: 0.82
            }
        ];

        // 검색어에 따른 필터링 시뮬레이션
        return mockResults.filter(result => 
            result.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            result.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            result.author.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    }

    // 필터 적용
    applyFilters() {
        this.filteredResults = this.searchResults.filter(result => {
            // 작성자 필터
            if (this.filters.author && !result.author.toLowerCase().includes(this.filters.author.toLowerCase())) {
                return false;
            }
            
            // 날짜 범위 필터
            if (this.filters.dateFrom) {
                const fromDate = new Date(this.filters.dateFrom);
                if (result.updatedAt < fromDate) return false;
            }
            
            if (this.filters.dateTo) {
                const toDate = new Date(this.filters.dateTo);
                if (result.updatedAt > toDate) return false;
            }
            
            // 보안 등급 필터
            if (this.filters.clearance !== 'all') {
                const clearance = parseInt(this.filters.clearance);
                if (result.clearance !== clearance) return false;
            }
            
            // 타입 필터
            if (this.filters.type !== 'all' && result.type !== this.filters.type) {
                return false;
            }
            
            return true;
        });
    }

    // 검색 결과 페이지 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="search-header">
                <h1>검색 결과</h1>
                <p>"${this.searchQuery}"에 대한 검색 결과 (${this.filteredResults.length}개)</p>
            </div>
            
            <div class="search-content">
                <div class="search-filters">
                    <h3>고급 필터</h3>
                    <div class="filter-group">
                        <label for="author-filter">작성자:</label>
                        <input type="text" id="author-filter" class="terminal-input" 
                               placeholder="에이전트 이름으로 필터링" 
                               value="${this.filters.author}">
                    </div>
                    
                    <div class="filter-group">
                        <label for="date-from">시작 날짜:</label>
                        <input type="date" id="date-from" class="terminal-input" 
                               value="${this.filters.dateFrom}">
                    </div>
                    
                    <div class="filter-group">
                        <label for="date-to">종료 날짜:</label>
                        <input type="date" id="date-to" class="terminal-input" 
                               value="${this.filters.dateTo}">
                    </div>
                    
                    <div class="filter-group">
                        <label for="clearance-filter">보안 등급:</label>
                        <select id="clearance-filter" class="terminal-input">
                            <option value="all" ${this.filters.clearance === 'all' ? 'selected' : ''}>모든 등급</option>
                            <option value="1" ${this.filters.clearance === '1' ? 'selected' : ''}>Level 1</option>
                            <option value="2" ${this.filters.clearance === '2' ? 'selected' : ''}>Level 2</option>
                            <option value="3" ${this.filters.clearance === '3' ? 'selected' : ''}>Level 3</option>
                            <option value="4" ${this.filters.clearance === '4' ? 'selected' : ''}>Level 4</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="type-filter">타입:</label>
                        <select id="type-filter" class="terminal-input">
                            <option value="all" ${this.filters.type === 'all' ? 'selected' : ''}>모든 타입</option>
                            <option value="file" ${this.filters.type === 'file' ? 'selected' : ''}>파일</option>
                            <option value="thread" ${this.filters.type === 'thread' ? 'selected' : ''}>스레드</option>
                        </select>
                    </div>
                    
                    <div class="filter-actions">
                        <button id="apply-filters-btn" class="terminal-btn">필터 적용</button>
                        <button id="clear-filters-btn" class="terminal-btn small">필터 초기화</button>
                    </div>
                </div>
                
                <div class="search-results">
                    ${this.renderSearchResults()}
                </div>
            </div>
        `;

        this.setupFilterEvents();
    }

    // 검색 결과 렌더링
    renderSearchResults() {
        if (this.filteredResults.length === 0) {
            return `
                <div class="no-results">
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 검색어나 필터를 시도해보세요.</p>
                </div>
            `;
        }

        return `
            <div class="results-list">
                ${this.filteredResults.map(result => this.createResultItem(result)).join('')}
            </div>
        `;
    }

    // 검색 결과 아이템 생성
    createResultItem(result) {
        const typeIcon = result.type === 'file' ? '📄' : '💬';
        const typeLabel = result.type === 'file' ? '파일' : '스레드';
        const scorePercent = Math.round(result.score * 100);
        
        return `
            <div class="search-result-item" data-result-id="${result.id}" data-result-type="${result.type}">
                <div class="result-header">
                    <div class="result-type">
                        <span class="type-icon">${typeIcon}</span>
                        <span class="type-label">${typeLabel}</span>
                    </div>
                    <div class="result-score">
                        <span class="score-label">관련도:</span>
                        <span class="score-value">${scorePercent}%</span>
                    </div>
                </div>
                
                <div class="result-content">
                    <h3 class="result-title">${result.title}</h3>
                    <p class="result-preview">${this.truncateText(result.content, 200)}</p>
                </div>
                
                <div class="result-meta">
                    <span class="result-author">작성자: ${result.author}</span>
                    <span class="result-date">업데이트: ${this.formatDate(result.updatedAt)}</span>
                    <span class="result-clearance">보안 등급: ${result.clearance}</span>
                </div>
            </div>
        `;
    }

    // 텍스트 자르기
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // 날짜 포맷팅
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '방금 전';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // 필터 이벤트 설정
    setupFilterEvents() {
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.updateFilters();
                this.applyFilters();
                this.updateURL();
                this.render();
            });
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
                this.applyFilters();
                this.updateURL();
                this.render();
            });
        }

        // 검색 결과 클릭 이벤트
        const resultItems = this.container.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const resultId = item.dataset.resultId;
                const resultType = item.dataset.resultType;
                this.navigateToResult(resultId, resultType);
            });
        });
    }

    // 필터 업데이트
    updateFilters() {
        const authorFilter = document.getElementById('author-filter');
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        const clearanceFilter = document.getElementById('clearance-filter');
        const typeFilter = document.getElementById('type-filter');
        
        this.filters.author = authorFilter ? authorFilter.value : '';
        this.filters.dateFrom = dateFrom ? dateFrom.value : '';
        this.filters.dateTo = dateTo ? dateTo.value : '';
        this.filters.clearance = clearanceFilter ? clearanceFilter.value : 'all';
        this.filters.type = typeFilter ? typeFilter.value : 'all';
    }

    // 필터 초기화
    clearFilters() {
        this.filters = {
            author: '',
            dateFrom: '',
            dateTo: '',
            clearance: 'all',
            type: 'all'
        };
    }

    // URL 업데이트
    updateURL() {
        const params = new URLSearchParams();
        params.set('q', this.searchQuery);
        
        if (this.filters.author) params.set('author', this.filters.author);
        if (this.filters.dateFrom) params.set('dateFrom', this.filters.dateFrom);
        if (this.filters.dateTo) params.set('dateTo', this.filters.dateTo);
        if (this.filters.clearance !== 'all') params.set('clearance', this.filters.clearance);
        if (this.filters.type !== 'all') params.set('type', this.filters.type);
        
        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newURL);
    }

    // 검색 결과로 이동
    navigateToResult(resultId, resultType) {
        if (resultType === 'file') {
            if (window.router) {
                window.router.navigate(`/files/${resultId}`);
            } else if (window.taaApp) {
                window.taaApp.loadFile(resultId);
            }
        } else if (resultType === 'thread') {
            if (window.router) {
                window.router.navigate(`/forums/thread/${resultId}`);
            }
        }
    }

    // 로딩 상태 표시
    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <span>검색 중...</span>
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

    // 에러 표시
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>오류 발생</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // 컴포넌트 정리
    cleanup() {
        // 이벤트 리스너 정리
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// 전역 인스턴스 생성
window.searchResults = new SearchResults(); 