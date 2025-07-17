// TAA Archives - Forum Service
// 포럼 기능을 위한 Firestore 데이터 구조 및 CRUD 기능

class ForumService {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // 포럼 채널 목록 가져오기 (order 기준 정렬)
    async getForums() {
        try {
            const snapshot = await this.db.collection('forums')
                .orderBy('order', 'asc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching forums:', error);
            throw error;
        }
    }

    // 특정 채널의 스레드 목록 가져오기 (실시간)
    getThreadsByChannel(channelId, callback) {
        return this.db.collection('threads')
            .where('channelId', '==', channelId)
            .orderBy('lastUpdatedAt', 'desc')
            .onSnapshot((snapshot) => {
                const threads = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(threads);
            }, (error) => {
                console.error('Error fetching threads:', error);
            });
    }

    // 특정 스레드 가져오기
    async getThread(threadId) {
        try {
            const doc = await this.db.collection('threads').doc(threadId).get();
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching thread:', error);
            throw error;
        }
    }

    // 스레드 생성
    async createThread(channelId, title, content) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const threadData = {
                channelId,
                title,
                content,
                authorId: user.uid,
                authorName: user.displayName || user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                votes: 0,
                commentCount: 0
            };

            const docRef = await this.db.collection('threads').add(threadData);
            return docRef.id;
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    // 특정 스레드의 댓글 목록 가져오기 (실시간)
    getCommentsByThread(threadId, callback) {
        return this.db.collection('comments')
            .where('threadId', '==', threadId)
            .orderBy('createdAt', 'asc')
            .onSnapshot((snapshot) => {
                const comments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(comments);
            }, (error) => {
                console.error('Error fetching comments:', error);
            });
    }

    // 댓글 생성
    async createComment(threadId, content) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const commentData = {
                threadId,
                content,
                authorId: user.uid,
                authorName: user.displayName || user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // 댓글 생성
            await this.db.collection('comments').add(commentData);

            // 스레드의 댓글 수와 마지막 업데이트 시간 업데이트
            const threadRef = this.db.collection('threads').doc(threadId);
            await threadRef.update({
                commentCount: firebase.firestore.FieldValue.increment(1),
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    // 스레드 추천/비추천
    async toggleVote(threadId) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const threadRef = this.db.collection('threads').doc(threadId);
            await threadRef.update({
                votes: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error toggling vote:', error);
            throw error;
        }
    }

    // 초기 포럼 데이터 생성 (개발용)
    async initializeForums() {
        try {
            const forums = [
                {
                    id: 'general',
                    name: '자유 토론',
                    description: '모든 주제에 대해 자유롭게 이야기하는 공간입니다.',
                    order: 1
                },
                {
                    id: 'tech-discussion',
                    name: '기술 논의',
                    description: '최신 기술과 장비에 대한 논의 공간입니다.',
                    order: 2
                },
                {
                    id: 'mission-briefing',
                    name: '임무 브리핑',
                    description: '중요한 임무와 작전에 대한 브리핑 공간입니다.',
                    order: 3
                },
                {
                    id: 'classified',
                    name: '기밀 정보',
                    description: '최고 보안 등급의 기밀 정보 공유 공간입니다.',
                    order: 4
                }
            ];

            for (const forum of forums) {
                await this.db.collection('forums').doc(forum.id).set(forum);
            }

            console.log('Forums initialized successfully');
        } catch (error) {
            console.error('Error initializing forums:', error);
        }
    }
}

// 전역 인스턴스 생성
window.forumService = new ForumService();

console.log('TAA Archives: Forum service initialized'); 