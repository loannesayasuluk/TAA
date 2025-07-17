// TAA Archives - Comment Service
// 댓글 시스템 및 분석 기능

class CommentService {
    constructor() {
        this.currentFileId = null;
        this.commentsCache = new Map();
        this.initCommentService();
    }

    // 댓글 서비스 초기화
    initCommentService() {
        // 실시간 댓글 업데이트 감지
        this.setupRealtimeComments();
        
        // 예시 댓글 생성 (개발 환경에서만)
        this.createSampleComments();
    }

    // 예시 댓글 생성
    async createSampleComments() {
        try {
            const snapshot = await db.collection('comments').get();
            if (snapshot.empty) {
                console.log('Creating sample comments...');
                await this.createSampleCommentsForFiles();
            }
        } catch (error) {
            console.error('Error creating sample comments:', error);
        }
    }

    // 실시간 댓글 업데이트 설정
    setupRealtimeComments() {
        // 전역 댓글 리스너는 파일이 로드될 때 설정됨
    }

    // 파일별 댓글 리스너 설정
    setupFileComments(fileId) {
        this.currentFileId = fileId;
        
        // 기존 리스너 제거
        if (this.commentsUnsubscribe) {
            this.commentsUnsubscribe();
        }

        // 새 리스너 설정
        this.commentsUnsubscribe = db.collection('comments')
            .where('fileId', '==', fileId)
            .where('isActive', '==', true)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.commentsCache.set(change.doc.id, {
                            id: change.doc.id,
                            ...change.doc.data()
                        });
                    } else if (change.type === 'modified') {
                        this.commentsCache.set(change.doc.id, {
                            id: change.doc.id,
                            ...change.doc.data()
                        });
                    } else if (change.type === 'removed') {
                        this.commentsCache.delete(change.doc.id);
                    }
                });
                
                // UI 업데이트
                this.updateCommentsUI();
            });
    }

    // 댓글 추가
    async addComment(fileId, content, isAnonymous = true) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            // 금지어 검사
            const forbiddenWords = wikiParser.checkForbiddenWords(content);
            if (forbiddenWords.length > 0) {
                terminalEffects.showWarning(`Forbidden words detected: ${forbiddenWords.join(', ')}`);
                const maskedContent = wikiParser.maskForbiddenWords(content);
                content = maskedContent;
            }

            // 댓글 데이터 준비
            const commentData = {
                fileId: fileId,
                content: content,
                author: authService.getCurrentUser().uid,
                authorName: isAnonymous ? 'Anonymous Agent' : (authService.getCurrentUser().displayName || authService.getCurrentUser().email),
                isAnonymous: isAnonymous,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                recommendations: 0,
                recommendedBy: [],
                isHighlighted: false,
                keywords: wikiParser.extractKeywords(content),
                analysisType: this.detectAnalysisType(content)
            };

            // 댓글 저장
            const docRef = await db.collection('comments').add(commentData);

            terminalEffects.showSuccess('Analysis submitted successfully');
            
            // 감사 로그 기록
            authService.logAuditEvent('COMMENT_ADD', {
                fileId: fileId,
                commentId: docRef.id,
                isAnonymous: isAnonymous
            });

            return docRef.id;
            
        } catch (error) {
            console.error('Error adding comment:', error);
            terminalEffects.showError('Failed to submit analysis');
            throw error;
        }
    }

    // 댓글 업데이트
    async updateComment(commentId, content) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const commentDoc = await db.collection('comments').doc(commentId).get();
            if (!commentDoc.exists) {
                throw new Error('Comment not found');
            }

            const commentData = commentDoc.data();
            
            // 권한 확인 (작성자만)
            if (commentData.author !== authService.getCurrentUser().uid) {
                throw new Error('Insufficient permissions');
            }

            // 금지어 검사
            const forbiddenWords = wikiParser.checkForbiddenWords(content);
            if (forbiddenWords.length > 0) {
                terminalEffects.showWarning(`Forbidden words detected: ${forbiddenWords.join(', ')}`);
                const maskedContent = wikiParser.maskForbiddenWords(content);
                content = maskedContent;
            }

            // 업데이트 데이터
            const updateData = {
                content: content,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                keywords: wikiParser.extractKeywords(content),
                analysisType: this.detectAnalysisType(content)
            };

            await db.collection('comments').doc(commentId).update(updateData);

            terminalEffects.showSuccess('Analysis updated successfully');
            
            // 감사 로그 기록
            authService.logAuditEvent('COMMENT_UPDATE', {
                commentId: commentId,
                fileId: commentData.fileId
            });

        } catch (error) {
            console.error('Error updating comment:', error);
            terminalEffects.showError('Failed to update analysis');
            throw error;
        }
    }

    // 댓글 삭제 (비활성화)
    async deleteComment(commentId) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const commentDoc = await db.collection('comments').doc(commentId).get();
            if (!commentDoc.exists) {
                throw new Error('Comment not found');
            }

            const commentData = commentDoc.data();
            
            // 권한 확인 (작성자 또는 관리자만)
            if (commentData.author !== authService.getCurrentUser().uid && 
                authService.getCurrentClearance() < 3) {
                throw new Error('Insufficient permissions');
            }

            await db.collection('comments').doc(commentId).update({
                isActive: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: authService.getCurrentUser().uid
            });

            terminalEffects.showSuccess('Analysis deleted successfully');
            
            // 감사 로그 기록
            authService.logAuditEvent('COMMENT_DELETE', {
                commentId: commentId,
                fileId: commentData.fileId
            });

        } catch (error) {
            console.error('Error deleting comment:', error);
            terminalEffects.showError('Failed to delete analysis');
            throw error;
        }
    }

    // 댓글 추천
    async recommendComment(commentId) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const commentDoc = await db.collection('comments').doc(commentId).get();
            if (!commentDoc.exists) {
                throw new Error('Comment not found');
            }

            const commentData = commentDoc.data();
            const currentUserId = authService.getCurrentUser().uid;
            
            // 이미 추천했는지 확인
            if (commentData.recommendedBy && commentData.recommendedBy.includes(currentUserId)) {
                // 추천 취소
                const newRecommendedBy = commentData.recommendedBy.filter(id => id !== currentUserId);
                const newRecommendations = commentData.recommendations - 1;
                
                await db.collection('comments').doc(commentId).update({
                    recommendations: newRecommendations,
                    recommendedBy: newRecommendedBy,
                    isHighlighted: newRecommendations >= 5
                });

                terminalEffects.showInfo('Recommendation removed');
            } else {
                // 추천 추가
                const newRecommendedBy = commentData.recommendedBy || [];
                newRecommendedBy.push(currentUserId);
                const newRecommendations = commentData.recommendations + 1;
                
                await db.collection('comments').doc(commentId).update({
                    recommendations: newRecommendations,
                    recommendedBy: newRecommendedBy,
                    isHighlighted: newRecommendations >= 5
                });

                terminalEffects.showSuccess('Analysis recommended');
            }
            
        } catch (error) {
            console.error('Error recommending comment:', error);
            terminalEffects.showError('Failed to recommend analysis');
            throw error;
        }
    }

    // 댓글 목록 조회
    async getComments(fileId, options = {}) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            let query = db.collection('comments')
                .where('fileId', '==', fileId)
                .where('isActive', '==', true);
            
            // 정렬
            if (options.sortBy === 'recommendations') {
                query = query.orderBy('recommendations', 'desc');
            } else if (options.sortBy === 'createdAt') {
                query = query.orderBy('createdAt', 'desc');
            } else {
                query = query.orderBy('createdAt', 'desc');
            }
            
            // 페이지네이션
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const snapshot = await query.get();
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return comments;
            
        } catch (error) {
            console.error('Error getting comments:', error);
            throw error;
        }
    }

    // 댓글 검색
    async searchComments(fileId, query) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const comments = await this.getComments(fileId);
            const results = [];

            comments.forEach(comment => {
                const searchResult = wikiParser.searchInText(comment.content, query);
                
                if (searchResult.found) {
                    results.push({
                        ...comment,
                        searchExcerpt: searchResult.excerpt,
                        searchPosition: searchResult.position
                    });
                }
            });

            return results.sort((a, b) => a.searchPosition - b.searchPosition);
            
        } catch (error) {
            console.error('Error searching comments:', error);
            throw error;
        }
    }

    // 분석 유형 감지
    detectAnalysisType(content) {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('evidence') || lowerContent.includes('proof') || lowerContent.includes('fact')) {
            return 'EVIDENCE';
        } else if (lowerContent.includes('theory') || lowerContent.includes('hypothesis') || lowerContent.includes('speculation')) {
            return 'THEORY';
        } else if (lowerContent.includes('question') || lowerContent.includes('doubt') || lowerContent.includes('uncertainty')) {
            return 'QUESTION';
        } else if (lowerContent.includes('conclusion') || lowerContent.includes('summary') || lowerContent.includes('result')) {
            return 'CONCLUSION';
        } else if (lowerContent.includes('source') || lowerContent.includes('reference') || lowerContent.includes('citation')) {
            return 'SOURCE';
        } else {
            return 'ANALYSIS';
        }
    }

    // 댓글 통계 생성
    async getCommentStats(fileId) {
        try {
            const comments = await this.getComments(fileId);
            
            const stats = {
                total: comments.length,
                anonymous: comments.filter(c => c.isAnonymous).length,
                highlighted: comments.filter(c => c.isHighlighted).length,
                totalRecommendations: comments.reduce((sum, c) => sum + c.recommendations, 0),
                analysisTypes: {},
                recentActivity: comments.filter(c => {
                    const commentDate = c.createdAt?.toDate() || new Date();
                    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return commentDate > oneWeekAgo;
                }).length
            };

            // 분석 유형별 통계
            comments.forEach(comment => {
                const type = comment.analysisType || 'ANALYSIS';
                stats.analysisTypes[type] = (stats.analysisTypes[type] || 0) + 1;
            });

            return stats;
            
        } catch (error) {
            console.error('Error getting comment stats:', error);
            throw error;
        }
    }

    // 주요 분석 결과 추출
    async getHighlightedComments(fileId) {
        try {
            const comments = await this.getComments(fileId);
            return comments.filter(comment => comment.isHighlighted);
        } catch (error) {
            console.error('Error getting highlighted comments:', error);
            return [];
        }
    }

    // 댓글 UI 업데이트
    updateCommentsUI() {
        const commentsContainer = document.getElementById('comments-container');
        if (!commentsContainer || !this.currentFileId) return;

        const comments = Array.from(this.commentsCache.values())
            .filter(comment => comment.fileId === this.currentFileId)
            .sort((a, b) => {
                // 하이라이트된 댓글을 먼저 표시
                if (a.isHighlighted && !b.isHighlighted) return -1;
                if (!a.isHighlighted && b.isHighlighted) return 1;
                // 그 다음 추천 수로 정렬
                if (a.recommendations !== b.recommendations) {
                    return b.recommendations - a.recommendations;
                }
                // 마지막으로 생성 시간으로 정렬
                return b.createdAt?.toDate() - a.createdAt?.toDate();
            });

        commentsContainer.innerHTML = '';

        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });
    }

    // 댓글 요소 생성
    createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = `comment-item ${comment.isHighlighted ? 'highlighted' : ''}`;
        commentDiv.id = `comment-${comment.id}`;

        const isOwner = comment.author === authService.getCurrentUser()?.uid;
        const canDelete = isOwner || authService.getCurrentClearance() >= 3;

        commentDiv.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.authorName}</span>
                <span class="comment-date">${this.formatDate(comment.createdAt)}</span>
                <span class="comment-type">${comment.analysisType}</span>
                ${comment.isHighlighted ? '<span class="highlight-badge">[[주요 분석 결과]]</span>' : ''}
            </div>
            <div class="comment-content">${this.formatCommentContent(comment.content)}</div>
            <div class="comment-actions">
                <button class="recommend-btn ${comment.recommendedBy?.includes(authService.getCurrentUser()?.uid) ? 'recommended' : ''}" 
                        onclick="commentService.recommendComment('${comment.id}')">
                    RECOMMEND (${comment.recommendations})
                </button>
                ${isOwner ? `<button class="edit-btn" onclick="commentService.editComment('${comment.id}')">EDIT</button>` : ''}
                ${canDelete ? `<button class="delete-btn" onclick="commentService.deleteComment('${comment.id}')">DELETE</button>` : ''}
            </div>
        `;

        return commentDiv;
    }

    // 댓글 내용 포맷팅
    formatCommentContent(content) {
        // 마크다운 파싱
        let formatted = wikiParser.parseMarkdown(content);
        
        // 위키 링크 처리
        formatted = wikiParser.parseWikiLinks(formatted);
        
        return formatted;
    }

    // 날짜 포맷팅
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 1분 미만
            return 'Just now';
        } else if (diff < 3600000) { // 1시간 미만
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // 1일 미만
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // 댓글 편집 모드
    editComment(commentId) {
        const commentElement = document.getElementById(`comment-${commentId}`);
        const contentElement = commentElement.querySelector('.comment-content');
        const currentContent = commentElement.querySelector('.comment-content').textContent;
        
        // 편집 모드로 전환
        contentElement.innerHTML = `
            <textarea class="edit-comment-textarea">${currentContent}</textarea>
            <div class="edit-actions">
                <button onclick="commentService.saveCommentEdit('${commentId}')">SAVE</button>
                <button onclick="commentService.cancelCommentEdit('${commentId}')">CANCEL</button>
            </div>
        `;
    }

    // 댓글 편집 저장
    async saveCommentEdit(commentId) {
        const commentElement = document.getElementById(`comment-${commentId}`);
        const textarea = commentElement.querySelector('.edit-comment-textarea');
        const newContent = textarea.value.trim();
        
        if (!newContent) {
            terminalEffects.showError('Comment cannot be empty');
            return;
        }
        
        try {
            await this.updateComment(commentId, newContent);
            this.cancelCommentEdit(commentId);
        } catch (error) {
            console.error('Error saving comment edit:', error);
        }
    }

    // 댓글 편집 취소
    cancelCommentEdit(commentId) {
        const commentElement = document.getElementById(`comment-${commentId}`);
        const contentElement = commentElement.querySelector('.comment-content');
        const comment = this.commentsCache.get(commentId);
        
        if (comment) {
            contentElement.innerHTML = this.formatCommentContent(comment.content);
        }
    }

    // 댓글 정리
    cleanup() {
        if (this.commentsUnsubscribe) {
            this.commentsUnsubscribe();
        }
        this.commentsCache.clear();
        this.currentFileId = null;
    }

    // 예시 댓글들 생성
    async createSampleCommentsForFiles() {
        const sampleComments = [
            {
                fileId: 'sample-file-1',
                content: '이 프로토콜은 매우 체계적으로 작성되었습니다. 특히 감시 장비 설정 부분이 상세하게 설명되어 있어 현장에서 바로 적용할 수 있을 것 같습니다.',
                authorName: 'Agent_Beta',
                isAnonymous: false,
                recommendations: 5,
                createdAt: new Date(Date.now() - 86400000 * 2)
            },
            {
                fileId: 'sample-file-1',
                content: '데이터 수집 절차에서 암호화 부분을 더 강화하면 좋을 것 같습니다. [[데이터 암호화 표준]]과 연계하여 보안을 강화해보시기 바랍니다.',
                authorName: 'Agent_Gamma',
                isAnonymous: false,
                recommendations: 3,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-2',
                content: '작전 나이트폴의 결과가 매우 성공적이었습니다. 대상자의 패턴 분석이 정확했고, 수집된 증거도 품질이 높습니다. 추가 감시가 정말 필요해 보입니다.',
                authorName: 'Agent_Delta',
                isAnonymous: false,
                recommendations: 8,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-2',
                content: '접촉자 네트워크 매핑이 잘 되어 있습니다. 특히 5명의 주요 접촉자 식별은 중요한 성과입니다. 이 정보를 바탕으로 추가 조사를 진행해야겠습니다.',
                authorName: 'Agent_Echo',
                isAnonymous: false,
                recommendations: 4,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-3',
                content: '시스템 유지보수 일정이 잘 계획되어 있습니다. 4주차의 종합 점검 부분에서 성능 최적화 항목을 더 구체화하면 좋을 것 같습니다.',
                authorName: 'Agent_Alpha',
                isAnonymous: false,
                recommendations: 2,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-4',
                content: '섹터 7의 위험도가 높게 평가된 것이 정확합니다. 대상 A의 활동이 [[보안 프로토콜 베타]]에서 정의한 위험 요소와 일치합니다. 즉시 대응이 필요합니다.',
                authorName: 'Agent_Beta',
                isAnonymous: false,
                recommendations: 7,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-5',
                content: '교육 세션이 전반적으로 성공적이었습니다. 실습 중심의 교육 방식이 참석자들의 만족도를 높인 것 같습니다. 다음 세션에서 고급 암호화 기법을 다루는 것이 좋겠습니다.',
                authorName: 'Agent_Gamma',
                isAnonymous: false,
                recommendations: 6,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-6',
                content: '보안 프로토콜 베타의 4단계 보안 레벨 분류가 매우 체계적입니다. 각 레벨별 권한이 명확하게 정의되어 있어 접근 제어가 용이할 것 같습니다.',
                authorName: 'Agent_Delta',
                isAnonymous: false,
                recommendations: 4,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-7',
                content: '데이터 암호화 표준에서 AES-256과 RSA-4096의 조합이 적절합니다. 키 관리 시스템과 정기적인 키 로테이션 계획도 잘 수립되어 있습니다.',
                authorName: 'Agent_Echo',
                isAnonymous: false,
                recommendations: 5,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-8',
                content: '인텔리전스 분석 가이드의 5단계 프로세스가 논리적으로 잘 구성되어 있습니다. 특히 데이터 검증 단계에서 출처 신뢰성 평가가 중요한 포인트입니다.',
                authorName: 'Agent_Alpha',
                isAnonymous: false,
                recommendations: 3,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-9',
                content: '고급 감시 기법 매뉴얼의 기술적 감시 부분이 매우 상세합니다. 전자 감시, 물리적 감시, 사이버 감시의 균형이 잘 맞춰져 있습니다.',
                authorName: 'Agent_Beta',
                isAnonymous: false,
                recommendations: 4,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-10',
                content: '에이전트 행동 강령의 기본 원칙이 명확합니다. 비밀 유지, 전문성, 윤리성의 균형이 잘 잡혀있어 실제 임무 수행에 도움이 될 것 같습니다.',
                authorName: 'Agent_Gamma',
                isAnonymous: false,
                recommendations: 6,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-11',
                content: '긴급 상황 대응 매뉴얼의 4단계 분류가 실용적입니다. 각 레벨별 대응 절차가 명확하게 정의되어 있어 실제 상황에서 빠른 대응이 가능할 것 같습니다.',
                authorName: 'Agent_Delta',
                isAnonymous: false,
                recommendations: 5,
                createdAt: new Date(Date.now() - 86400000 * 1)
            },
            {
                fileId: 'sample-file-12',
                content: 'TAA 아카이브 운영 가이드가 시스템의 전체적인 구조를 잘 설명하고 있습니다. 신규 사용자부터 관리자까지 각 역할별 가이드가 체계적으로 정리되어 있습니다.',
                authorName: 'Agent_Echo',
                isAnonymous: false,
                recommendations: 4,
                createdAt: new Date(Date.now() - 86400000 * 1)
            }
        ];

        // 각 예시 댓글 생성
        for (const commentData of sampleComments) {
            try {
                const docRef = await db.collection('comments').add({
                    ...commentData,
                    author: commentData.authorName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isActive: true,
                    recommendedBy: [],
                    isHighlighted: false,
                    keywords: wikiParser.extractKeywords(commentData.content),
                    analysisType: this.detectAnalysisType(commentData.content)
                });

                console.log(`Sample comment created: ${commentData.content.substring(0, 50)}...`);
            } catch (error) {
                console.error(`Error creating sample comment:`, error);
            }
        }

        console.log('All sample comments created successfully');
    }
}

// 전역 인스턴스 생성
window.commentService = new CommentService();

console.log('TAA Archives: Comment service initialized'); 