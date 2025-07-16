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
}

// 전역 인스턴스 생성
window.commentService = new CommentService();

console.log('TAA Archives: Comment service initialized'); 