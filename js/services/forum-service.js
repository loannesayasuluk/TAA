// TAA Archives - Forum Service
// Firestore 기반 실시간 포럼 기능

class ForumService {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        this.currentUser = null;
        this.setupAuthListener();
    }

    // 인증 상태 리스너 설정
    setupAuthListener() {
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
            });
        }
    }

    // ===== 채널 관리 =====

    // 모든 채널 가져오기 (실시간)
    async getChannels() {
        try {
            const snapshot = await this.db.collection('forums')
                .orderBy('order', 'asc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching channels:', error);
            throw error;
        }
    }

    // 채널 실시간 리스너
    subscribeToChannels(callback) {
        return this.db.collection('forums')
            .orderBy('order', 'asc')
            .onSnapshot((snapshot) => {
                const channels = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(channels);
            }, (error) => {
                console.error('Error subscribing to channels:', error);
            });
    }

    // 새 채널 생성 (관리자용)
    async createChannel(channelData) {
        try {
            const docRef = await this.db.collection('forums').add({
                name: channelData.name,
                description: channelData.description,
                order: channelData.order || 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.currentUser?.uid || 'system'
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating channel:', error);
            throw error;
        }
    }

    // ===== 스레드 관리 =====

    // 채널의 스레드 목록 가져오기 (실시간)
    async getThreads(channelId) {
        try {
            const snapshot = await this.db.collection('threads')
                .where('channelId', '==', channelId)
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching threads:', error);
            throw error;
        }
    }

    // 스레드 실시간 리스너
    subscribeToThreads(channelId, callback) {
        return this.db.collection('threads')
            .where('channelId', '==', channelId)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const threads = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(threads);
            }, (error) => {
                console.error('Error subscribing to threads:', error);
            });
    }

    // 새 스레드 생성
    async createThread(threadData) {
        try {
            if (!this.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            const docRef = await this.db.collection('threads').add({
                channelId: threadData.channelId,
                title: threadData.title,
                content: threadData.content,
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || this.currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                votes: 0,
                commentCount: 0,
                isActive: true
            });

            // 감사 로그 기록
            await this.logAuditEvent('THREAD_CREATED', {
                threadId: docRef.id,
                channelId: threadData.channelId,
                title: threadData.title
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    // 스레드 상세 정보 가져오기
    async getThread(threadId) {
        try {
            const doc = await this.db.collection('threads').doc(threadId).get();
            if (!doc.exists) {
                throw new Error('스레드를 찾을 수 없습니다.');
            }
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error fetching thread:', error);
            throw error;
        }
    }

    // 스레드 추천
    async voteThread(threadId, voteType = 'up') {
        try {
            if (!this.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            const threadRef = this.db.collection('threads').doc(threadId);
            
            await this.db.runTransaction(async (transaction) => {
                const threadDoc = await transaction.get(threadRef);
                if (!threadDoc.exists) {
                    throw new Error('스레드를 찾을 수 없습니다.');
                }

                const currentVotes = threadDoc.data().votes || 0;
                const newVotes = voteType === 'up' ? currentVotes + 1 : Math.max(0, currentVotes - 1);

                transaction.update(threadRef, {
                    votes: newVotes,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            // 감사 로그 기록
            await this.logAuditEvent('THREAD_VOTED', {
                threadId: threadId,
                voteType: voteType
            });

        } catch (error) {
            console.error('Error voting thread:', error);
            throw error;
        }
    }

    // 조회수 증가
    async incrementViewCount(threadId) {
        try {
            await this.db.collection('threads').doc(threadId).update({
                viewCount: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    }

    // ===== 댓글 관리 =====

    // 댓글 목록 가져오기 (실시간)
    async getComments(threadId) {
        try {
            const snapshot = await this.db.collection('threads')
                .doc(threadId)
                .collection('comments')
                .orderBy('createdAt', 'asc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    }

    // 댓글 실시간 리스너
    subscribeToComments(threadId, callback) {
        return this.db.collection('threads')
            .doc(threadId)
            .collection('comments')
            .orderBy('createdAt', 'asc')
            .onSnapshot((snapshot) => {
                const comments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(comments);
            }, (error) => {
                console.error('Error subscribing to comments:', error);
            });
    }

    // 새 댓글 생성
    async createComment(threadId, commentData) {
        try {
            if (!this.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            const commentRef = await this.db.collection('threads')
                .doc(threadId)
                .collection('comments')
                .add({
                    content: commentData.content,
                    authorId: this.currentUser.uid,
                    authorName: this.currentUser.displayName || this.currentUser.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isActive: true
                });

            // 스레드의 댓글 수 증가
            await this.db.collection('threads').doc(threadId).update({
                commentCount: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 감사 로그 기록
            await this.logAuditEvent('COMMENT_CREATED', {
                threadId: threadId,
                commentId: commentRef.id
            });

            return commentRef.id;
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    // 댓글 수정
    async updateComment(threadId, commentId, content) {
        try {
            if (!this.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            await this.db.collection('threads')
                .doc(threadId)
                .collection('comments')
                .doc(commentId)
                .update({
                    content: content,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // 감사 로그 기록
            await this.logAuditEvent('COMMENT_UPDATED', {
                threadId: threadId,
                commentId: commentId
            });

        } catch (error) {
            console.error('Error updating comment:', error);
            throw error;
        }
    }

    // 댓글 삭제
    async deleteComment(threadId, commentId) {
        try {
            if (!this.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            await this.db.collection('threads')
                .doc(threadId)
                .collection('comments')
                .doc(commentId)
                .delete();

            // 스레드의 댓글 수 감소
            await this.db.collection('threads').doc(threadId).update({
                commentCount: firebase.firestore.FieldValue.increment(-1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 감사 로그 기록
            await this.logAuditEvent('COMMENT_DELETED', {
                threadId: threadId,
                commentId: commentId
            });

        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }

    // ===== 통계 및 검색 =====

    // 인기 스레드 가져오기 (추천 수 기준)
    async getTopVotedThreads(limit = 5) {
        try {
            const snapshot = await this.db.collection('threads')
                .orderBy('votes', 'desc')
                .limit(limit)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching top voted threads:', error);
            throw error;
        }
    }

    // 최신 스레드 가져오기
    async getLatestThreads(limit = 10) {
        try {
            const snapshot = await this.db.collection('threads')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching latest threads:', error);
            throw error;
        }
    }

    // 스레드 검색
    async searchThreads(query, channelId = null) {
        try {
            let queryRef = this.db.collection('threads');
            
            if (channelId) {
                queryRef = queryRef.where('channelId', '==', channelId);
            }
            
            const snapshot = await queryRef.get();
            const threads = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 클라이언트 사이드 검색 (Firestore의 텍스트 검색 제한 때문)
            return threads.filter(thread => 
                thread.title.toLowerCase().includes(query.toLowerCase()) ||
                thread.content.toLowerCase().includes(query.toLowerCase())
            );
        } catch (error) {
            console.error('Error searching threads:', error);
            throw error;
        }
    }

    // ===== 감사 로그 =====

    // 감사 이벤트 기록
    async logAuditEvent(eventType, details = null) {
        try {
            await this.db.collection('audit_logs').add({
                eventType: eventType,
                userId: this.currentUser?.uid || 'anonymous',
                userEmail: this.currentUser?.email || 'anonymous',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: details,
                module: 'forum'
            });
        } catch (error) {
            console.error('Error logging audit event:', error);
        }
    }

    // ===== 초기 데이터 생성 =====

    // 샘플 채널 생성
    async createSampleChannels() {
        const sampleChannels = [
            {
                name: '자유게시판',
                description: '일반적인 대화와 정보 공유',
                order: 1
            },
            {
                name: '정보분석실',
                description: '정보 분석 및 연구 결과 공유',
                order: 2
            },
            {
                name: '장비토론',
                description: '장비 및 기술 관련 토론',
                order: 3
            },
            {
                name: '임무보고',
                description: '현장 임무 보고 및 후기',
                order: 4
            },
            {
                name: '교육센터',
                description: '교육 자료 및 학습 내용 공유',
                order: 5
            }
        ];

        for (const channel of sampleChannels) {
            try {
                await this.createChannel(channel);
                console.log(`Sample channel created: ${channel.name}`);
            } catch (error) {
                console.error(`Error creating sample channel ${channel.name}:`, error);
            }
        }
    }

    // 샘플 스레드 생성
    async createSampleThreads() {
        const sampleThreads = [
            {
                channelId: '자유게시판',
                title: 'TAA 아카이브 사용법 가이드',
                content: '안녕하세요! TAA 아카이브를 처음 사용하시는 분들을 위한 가이드입니다.\n\n## 주요 기능\n- 문서 관리 및 편집\n- 실시간 협업\n- 포럼 시스템\n- 검색 기능\n\n## 사용 팁\n1. 위키 링크를 활용하세요\n2. 댓글을 통해 의견을 나누세요\n3. 추천 기능을 활용하세요',
                votes: 15
            },
            {
                channelId: '정보분석실',
                title: '최신 정보 분석 기법 연구',
                content: '최근 정보 분석 분야에서 주목받고 있는 새로운 기법들에 대한 연구 결과를 공유합니다.\n\n### 주요 내용\n- 머신러닝 기반 패턴 분석\n- 소셜 네트워크 분석\n- 데이터 시각화 기법\n\n이 연구는 향후 정보 수집 및 분석 작업에 큰 도움이 될 것으로 예상됩니다.',
                votes: 23
            },
            {
                channelId: '장비토론',
                title: '신형 감시 장비 리뷰',
                content: '최근 도입된 신형 감시 장비에 대한 실사용 후기를 공유합니다.\n\n## 장점\n- 고해상도 영상 품질\n- 야간 감시 능력 향상\n- 배터리 수명 연장\n\n## 개선점\n- 초기 설정 복잡성\n- 가격대비 성능\n\n전반적으로 만족스러운 성능을 보여주고 있습니다.',
                votes: 8
            }
        ];

        for (const thread of sampleThreads) {
            try {
                await this.createThread(thread);
                console.log(`Sample thread created: ${thread.title}`);
            } catch (error) {
                console.error(`Error creating sample thread ${thread.title}:`, error);
            }
        }
    }

    // 초기 데이터 설정 (개발용)
    async initializeSampleData() {
        try {
            console.log('Initializing sample forum data...');
            
            // 기존 데이터 확인
            const existingChannels = await this.getChannels();
            if (existingChannels.length === 0) {
                await this.createSampleChannels();
                console.log('Sample channels created successfully');
            } else {
                console.log('Channels already exist, skipping channel creation');
            }
            
            // 스레드 생성 (채널 ID를 실제 ID로 매핑)
            const channels = await this.getChannels();
            const channelMap = {};
            channels.forEach(channel => {
                channelMap[channel.name] = channel.id;
            });
            
            const sampleThreads = [
                {
                    channelId: channelMap['자유게시판'],
                    title: 'TAA 아카이브 사용법 가이드',
                    content: '안녕하세요! TAA 아카이브를 처음 사용하시는 분들을 위한 가이드입니다.\n\n## 주요 기능\n- 문서 관리 및 편집\n- 실시간 협업\n- 포럼 시스템\n- 검색 기능\n\n## 사용 팁\n1. 위키 링크를 활용하세요\n2. 댓글을 통해 의견을 나누세요\n3. 추천 기능을 활용하세요',
                    votes: 15
                },
                {
                    channelId: channelMap['정보분석실'],
                    title: '최신 정보 분석 기법 연구',
                    content: '최근 정보 분석 분야에서 주목받고 있는 새로운 기법들에 대한 연구 결과를 공유합니다.\n\n### 주요 내용\n- 머신러닝 기반 패턴 분석\n- 소셜 네트워크 분석\n- 데이터 시각화 기법\n\n이 연구는 향후 정보 수집 및 분석 작업에 큰 도움이 될 것으로 예상됩니다.',
                    votes: 23
                },
                {
                    channelId: channelMap['장비토론'],
                    title: '신형 감시 장비 리뷰',
                    content: '최근 도입된 신형 감시 장비에 대한 실사용 후기를 공유합니다.\n\n## 장점\n- 고해상도 영상 품질\n- 야간 감시 능력 향상\n- 배터리 수명 연장\n\n## 개선점\n- 초기 설정 복잡성\n- 가격대비 성능\n\n전반적으로 만족스러운 성능을 보여주고 있습니다.',
                    votes: 8
                }
            ];

            for (const thread of sampleThreads) {
                if (thread.channelId) {
                    try {
                        await this.createThread(thread);
                        console.log(`Sample thread created: ${thread.title}`);
                    } catch (error) {
                        console.error(`Error creating sample thread ${thread.title}:`, error);
                    }
                }
            }
            
            console.log('Sample forum data initialization completed');
        } catch (error) {
            console.error('Error initializing sample data:', error);
        }
    }
}

// 전역 인스턴스 생성
window.forumService = new ForumService();

console.log('TAA Archives: Forum service initialized'); 