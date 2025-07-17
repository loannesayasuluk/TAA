// 대시보드 모듈 컴포넌트들
class DashboardModules {
    constructor() {
        this.dashboardService = window.dashboardService;
    }

    // 모듈 1: 주요 정보 브리핑 렌더링
    async renderKeyIntelBriefing() {
        const container = document.getElementById('key-intel-content');
        if (!container) return;

        try {
            const intelData = await this.dashboardService.getKeyIntelBriefing();
            
            if (intelData.length === 0) {
                container.innerHTML = '<div class="no-data">추천된 게시물이 없습니다.</div>';
                return;
            }

            const html = `
                <ol>
                    ${intelData.map(item => `
                        <li>
                            <span class="intel-title">${this.escapeHtml(item.title)}</span>
                            <span class="intel-votes">▲${item.votes}</span>
                        </li>
                    `).join('')}
                </ol>
            `;
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error rendering key intel briefing:', error);
            container.innerHTML = '<div class="error-message">데이터 로딩 중 오류가 발생했습니다.</div>';
        }
    }

    // 모듈 2: 최신 수신 보고 렌더링
    async renderLatestIncomingReports() {
        const container = document.getElementById('latest-reports-content');
        if (!container) return;

        try {
            const reportsData = await this.dashboardService.getLatestIncomingReports();
            
            if (reportsData.length === 0) {
                container.innerHTML = '<div class="no-data">최신 보고가 없습니다.</div>';
                return;
            }

            const html = `
                <ul>
                    ${reportsData.map(item => `
                        <li>
                            <span class="report-type">${item.type}</span>
                            <span class="report-title">${this.escapeHtml(item.title)}</span>
                            <span class="report-time">${this.dashboardService.formatTime(item.createdAt)}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error rendering latest reports:', error);
            container.innerHTML = '<div class="error-message">데이터 로딩 중 오류가 발생했습니다.</div>';
        }
    }

    // 모듈 3: 오늘의 주요 파일 렌더링
    async renderFeaturedFile() {
        const container = document.getElementById('featured-file-content');
        if (!container) return;

        try {
            const featuredFile = await this.dashboardService.getFeaturedFile();
            
            if (!featuredFile) {
                container.innerHTML = `
                    <div class="no-data">
                        <p>오늘의 주요 파일이 설정되지 않았습니다.</p>
                        <p>관리자가 주요 파일을 지정하면 여기에 표시됩니다.</p>
                    </div>
                `;
                return;
            }

            // 내용 미리보기 생성 (첫 50자)
            const preview = featuredFile.content 
                ? featuredFile.content.substring(0, 50) + (featuredFile.content.length > 50 ? '...' : '')
                : '내용 없음';

            const html = `
                <div class="featured-file">
                    <div class="featured-file-title">${this.escapeHtml(featuredFile.title)}</div>
                    <div class="featured-file-preview">${this.escapeHtml(preview)}</div>
                    <a href="#" class="featured-file-link" onclick="router.navigate('/file/${featuredFile.id}')">
                        자세히 보기 →
                    </a>
                </div>
            `;
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error rendering featured file:', error);
            container.innerHTML = '<div class="error-message">데이터 로딩 중 오류가 발생했습니다.</div>';
        }
    }

    // 모듈 4: 아카이브 현황 렌더링
    async renderArchivesStatus() {
        const container = document.getElementById('archives-status-content');
        if (!container) return;

        try {
            const statusData = await this.dashboardService.getArchivesStatus();
            
            const html = `
                <div class="status-grid">
                    <div class="status-item">
                        <div class="status-label">총 파일 수</div>
                        <div class="status-value">${statusData.totalFiles.toLocaleString()}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">활동 에이전트</div>
                        <div class="status-value">${statusData.totalUsers.toLocaleString()}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">24시간 내 추가</div>
                        <div class="status-value">${statusData.recentActivity.toLocaleString()}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">시스템 상태</div>
                        <div class="status-value" style="color: #00FF00;">정상</div>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error rendering archives status:', error);
            container.innerHTML = '<div class="error-message">데이터 로딩 중 오류가 발생했습니다.</div>';
        }
    }

    // 모든 모듈 렌더링
    async renderAllModules() {
        try {
            // 모든 모듈을 병렬로 렌더링
            await Promise.all([
                this.renderKeyIntelBriefing(),
                this.renderLatestIncomingReports(),
                this.renderFeaturedFile(),
                this.renderArchivesStatus()
            ]);
        } catch (error) {
            console.error('Error rendering dashboard modules:', error);
        }
    }

    // HTML 이스케이프 헬퍼 함수
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 모듈 새로고침 (실시간 업데이트용)
    async refreshModules() {
        await this.renderAllModules();
    }
}

// 전역 인스턴스 생성
window.dashboardModules = new DashboardModules(); 