// 포럼 서비스 - 포럼 기능 및 대시보드용 데이터 제공
class ForumService {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
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

    // 게시물(스레드) 생성
    async createThread(channelId, title, content, requiredClearance = 1) {
        if (!this.auth.currentUser) {
            throw new Error('Authentication required');
        }

        try {
            const user = this.auth.currentUser;
            
            // 게시물 데이터 준비
            const threadData = {
                channelId: channelId,
                title: title.trim(),
                content: content,
                authorId: user.uid,
                authorName: user.displayName || user.email,
                authorEmail: user.email,
                requiredClearance: requiredClearance,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                votes: 0,
                upvotes: 0,
                downvotes: 0,
                replies: 0,
                viewCount: 0,
                isValidated: false,
                status: 'active',
                isPinned: false,
                tags: this.extractTags(content),
                keywords: this.extractKeywords(content)
            };

            // Firestore에 저장
            const docRef = await this.db.collection('threads').add(threadData);
            
            console.log('Thread created successfully:', docRef.id);
            
            // 감사 로그 기록
            this.logAuditEvent('THREAD_CREATE', {
                threadId: docRef.id,
                channelId: channelId,
                title: title,
                clearance: requiredClearance
            });

            return docRef.id;
            
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    // 댓글 생성
    async createComment(threadId, content) {
        if (!this.auth.currentUser) {
            throw new Error('Authentication required');
        }

        try {
            const user = this.auth.currentUser;
            
            // 댓글 데이터 준비
            const commentData = {
                threadId: threadId,
                content: content.trim(),
                authorId: user.uid,
                authorName: user.displayName || user.email,
                authorEmail: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                votes: 0,
                upvotes: 0,
                downvotes: 0,
                isAgentComment: true,
                parentCommentId: null, // 대댓글 지원
                replies: 0
            };

            // Firestore에 저장
            const docRef = await this.db.collection('comments').add(commentData);
            
            // 스레드의 댓글 수 업데이트
            await this.db.collection('threads').doc(threadId).update({
                replies: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Comment created successfully:', docRef.id);
            
            return docRef.id;
            
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    // 특정 채널의 스레드 목록 가져오기 (실시간)
    getChannelThreads(channelId, callback) {
        const threadsRef = this.db.collection('threads')
            .where('channelId', '==', channelId)
            .where('status', '==', 'active')
            .orderBy('isPinned', 'desc')
            .orderBy('createdAt', 'desc');

        return threadsRef.onSnapshot((snapshot) => {
            const threads = [];
            snapshot.forEach(doc => {
                threads.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(threads);
        }, (error) => {
            console.error('Error fetching channel threads:', error);
            callback([]);
        });
    }

    // 특정 스레드의 댓글 목록 가져오기 (실시간)
    getThreadComments(threadId, callback) {
        const commentsRef = this.db.collection('comments')
            .where('threadId', '==', threadId)
            .where('parentCommentId', '==', null) // 최상위 댓글만
            .orderBy('createdAt', 'asc');

        return commentsRef.onSnapshot((snapshot) => {
            const comments = [];
            snapshot.forEach(doc => {
                comments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(comments);
        }, (error) => {
            console.error('Error fetching thread comments:', error);
            callback([]);
        });
    }

    // 스레드 정보 가져오기
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
            return null;
        }
    }

    // 투표 처리
    async voteThread(threadId, voteType) {
        if (!this.auth.currentUser) {
            throw new Error('Authentication required');
        }

        try {
            const user = this.auth.currentUser;
            const voteRef = this.db.collection('votes').doc(`${threadId}_${user.uid}`);
            
            const voteData = {
                threadId: threadId,
                userId: user.uid,
                voteType: voteType, // 'up' or 'down'
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await voteRef.set(voteData);
            
            // 스레드 투표 수 업데이트
            const updateData = {};
            if (voteType === 'up') {
                updateData.upvotes = firebase.firestore.FieldValue.increment(1);
                updateData.votes = firebase.firestore.FieldValue.increment(1);
            } else {
                updateData.downvotes = firebase.firestore.FieldValue.increment(1);
                updateData.votes = firebase.firestore.FieldValue.increment(-1);
            }
            
            await this.db.collection('threads').doc(threadId).update(updateData);
            
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

    // 헬퍼 함수들
    extractTags(content) {
        // #태그 패턴을 찾아서 태그 추출
        const tagRegex = /#(\w+)/g;
        const tags = [];
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }
        return tags;
    }

    extractKeywords(content) {
        // 간단한 키워드 추출 (실제로는 더 정교한 알고리즘 사용)
        const words = content.toLowerCase().split(/\s+/);
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return words.filter(word => 
            word.length > 3 && 
            !stopWords.includes(word) && 
            /^[a-zA-Z가-힣]+$/.test(word)
        ).slice(0, 10);
    }

    logAuditEvent(action, details) {
        try {
            this.db.collection('audit_logs').add({
                action: action,
                details: details,
                userId: this.auth.currentUser?.uid,
                userEmail: this.auth.currentUser?.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error logging audit event:', error);
        }
    }
}

// 전역 인스턴스 생성
window.forumService = new ForumService(); 