// 대시보드 서비스 - 종합 상황판 데이터 제공
class DashboardService {
    constructor() {
        this.db = firebase.firestore();
        this.fileService = window.fileService;
        this.forumService = window.forumService;
    }

    // 모듈 1: 주요 정보 브리핑 데이터 가져오기
    async getKeyIntelBriefing() {
        try {
            const topThreads = await this.forumService.getTopVotedThreads(5);
            return topThreads.map(thread => ({
                id: thread.id,
                title: thread.title,
                votes: thread.votes || 0
            }));
        } catch (error) {
            console.error('Error fetching key intel briefing:', error);
            return [];
        }
    }

    // 모듈 2: 최신 수신 보고 데이터 가져오기
    async getLatestIncomingReports() {
        try {
            // 최신 파일과 포럼 게시물 가져오기
            const [latestFiles, latestThreads] = await Promise.all([
                this.getLatestFiles(5),
                this.forumService.getLatestThreads(5)
            ]);

            // 두 결과를 합치고 시간순으로 정렬
            const allReports = [...latestFiles, ...latestThreads];
            allReports.sort((a, b) => {
                const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return timeB - timeA;
            });

            // 상위 5개만 반환
            return allReports.slice(0, 5);
        } catch (error) {
            console.error('Error fetching latest reports:', error);
            return [];
        }
    }

    // 최신 파일 가져오기 (헬퍼 함수)
    async getLatestFiles(limit = 5) {
        try {
            const filesRef = this.db.collection('files');
            const snapshot = await filesRef
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const files = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                files.push({
                    id: doc.id,
                    title: data.title,
                    createdAt: data.createdAt,
                    type: 'FILE'
                });
            });

            return files;
        } catch (error) {
            console.error('Error fetching latest files:', error);
            return [];
        }
    }

    // 모듈 3: 오늘의 주요 파일 데이터 가져오기
    async getFeaturedFile() {
        try {
            // site_config/dashboard 문서에서 featuredFileId 가져오기
            const configRef = this.db.collection('site_config').doc('dashboard');
            const configDoc = await configRef.get();

            if (!configDoc.exists) {
                // 설정이 없으면 기본값 설정
                await configRef.set({
                    featuredFileId: null,
                    lastUpdated: new Date()
                });
                return null;
            }

            const config = configDoc.data();
            const featuredFileId = config.featuredFileId;

            if (!featuredFileId) {
                return null;
            }

            // 해당 파일 정보 가져오기
            const fileRef = this.db.collection('files').doc(featuredFileId);
            const fileDoc = await fileRef.get();

            if (!fileDoc.exists) {
                return null;
            }

            const fileData = fileDoc.data();
            return {
                id: fileDoc.id,
                title: fileData.title,
                content: fileData.content,
                createdAt: fileData.createdAt
            };
        } catch (error) {
            console.error('Error fetching featured file:', error);
            return null;
        }
    }

    // 모듈 4: 아카이브 현황 데이터 가져오기
    async getArchivesStatus() {
        try {
            // 24시간 전 시간 계산
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            // 병렬로 모든 통계 데이터 가져오기
            const [
                totalFiles,
                totalUsers,
                recentFiles,
                recentThreads
            ] = await Promise.all([
                this.getTotalFiles(),
                this.getTotalUsers(),
                this.getRecentFilesCount(twentyFourHoursAgo),
                this.getRecentThreadsCount(twentyFourHoursAgo)
            ]);

            return {
                totalFiles,
                totalUsers,
                recentActivity: recentFiles + recentThreads
            };
        } catch (error) {
            console.error('Error fetching archives status:', error);
            return {
                totalFiles: 0,
                totalUsers: 0,
                recentActivity: 0
            };
        }
    }

    // 헬퍼 함수들
    async getTotalFiles() {
        try {
            const snapshot = await this.db.collection('files').get();
            return snapshot.size;
        } catch (error) {
            console.error('Error counting total files:', error);
            return 0;
        }
    }

    async getTotalUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.size;
        } catch (error) {
            console.error('Error counting total users:', error);
            return 0;
        }
    }

    async getRecentFilesCount(since) {
        try {
            const snapshot = await this.db.collection('files')
                .where('createdAt', '>=', since)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error counting recent files:', error);
            return 0;
        }
    }

    async getRecentThreadsCount(since) {
        try {
            const snapshot = await this.db.collection('threads')
                .where('createdAt', '>=', since)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error counting recent threads:', error);
            return 0;
        }
    }

    // 시간 포맷팅 헬퍼 함수
    formatTime(timestamp) {
        if (!timestamp) return '알 수 없음';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes < 1) return '방금 전';
        if (diffMinutes < 60) return `${diffMinutes}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        
        return date.toLocaleDateString('ko-KR');
    }
}

// 전역 인스턴스 생성
window.dashboardService = new DashboardService(); 