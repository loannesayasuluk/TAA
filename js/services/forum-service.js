// 포럼 서비스 - 대시보드용 데이터 제공
class ForumService {
    constructor() {
        this.db = firebase.firestore();
    }

    // 주요 정보 브리핑: 추천 수가 가장 높은 게시물 가져오기
    async getTopVotedThreads(limit = 5) {
        try {
            const threadsRef = this.db.collection('threads');
            const snapshot = await threadsRef
                .orderBy('votes', 'desc')
                .limit(limit)
                .get();

            const threads = [];
            snapshot.forEach(doc => {
                threads.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return threads;
        } catch (error) {
            console.error('Error fetching top voted threads:', error);
            return [];
        }
    }

    // 최신 포럼 게시물 가져오기
    async getLatestThreads(limit = 5) {
        try {
            const threadsRef = this.db.collection('threads');
            const snapshot = await threadsRef
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const threads = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                threads.push({
                    id: doc.id,
                    title: data.title,
                    createdAt: data.createdAt,
                    type: 'FORUM'
                });
            });

            return threads;
        } catch (error) {
            console.error('Error fetching latest threads:', error);
            return [];
        }
    }
}

// 전역 인스턴스 생성
window.forumService = new ForumService(); 