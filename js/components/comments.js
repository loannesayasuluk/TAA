// Comments Component
class Comments {
    constructor() {
        this.currentFileId = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('submit-comment')?.addEventListener('click', () => this.submitComment());
        
        // 엔터키로 댓글 제출
        document.getElementById('comment-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.submitComment();
            }
        });
    }

    async submitComment() {
        const content = document.getElementById('comment-input')?.value.trim();
        
        if (!content) {
            showNotification('댓글 내용을 입력해주세요.', 'warning');
            return;
        }

        if (!this.currentFileId) {
            showNotification('파일이 로드되지 않았습니다.', 'error');
            return;
        }

        try {
            const commentData = {
                content: content,
                fileId: this.currentFileId,
                author: authService.getCurrentUser()?.uid || 'anonymous',
                authorName: authService.getCurrentUser()?.displayName || 'Unknown Agent',
                createdAt: new Date(),
                type: this.detectCommentType(content),
                isAnonymous: this.shouldBeAnonymous(content)
            };

            await commentService.addComment(commentData);
            
            // 입력 필드 초기화
            document.getElementById('comment-input').value = '';
            
            showNotification('댓글이 성공적으로 등록되었습니다.', 'success');
        } catch (error) {
            console.error('댓글 등록 실패:', error);
            showNotification('댓글 등록에 실패했습니다.', 'error');
        }
    }

    detectCommentType(content) {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('추천') || lowerContent.includes('좋음') || lowerContent.includes('👍')) {
            return 'recommendation';
        } else if (lowerContent.includes('비추') || lowerContent.includes('나쁨') || lowerContent.includes('👎')) {
            return 'dislike';
        } else if (lowerContent.includes('분석') || lowerContent.includes('검토') || lowerContent.includes('리뷰')) {
            return 'analysis';
        } else if (lowerContent.includes('질문') || lowerContent.includes('문의') || lowerContent.includes('?')) {
            return 'question';
        } else {
            return 'general';
        }
    }

    shouldBeAnonymous(content) {
        // 민감한 키워드가 포함된 경우 익명 처리
        const sensitiveKeywords = ['비밀', '기밀', '내부', '폭로', '고발', '의혹'];
        return sensitiveKeywords.some(keyword => content.includes(keyword));
    }

    setCurrentFile(fileId) {
        this.currentFileId = fileId;
    }

    displayComments(comments) {
        const container = document.getElementById('comments-container');
        if (!container) return;

        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="no-comments">아직 분석 기록이 없습니다.</p>';
            return;
        }

        let html = '';
        comments.forEach(comment => {
            html += this.renderComment(comment);
        });
        
        container.innerHTML = html;
        this.setupCommentInteractions();
    }

    renderComment(comment) {
        const commentClass = this.getCommentClass(comment.type);
        const authorName = comment.isAnonymous ? 'Anonymous Agent' : (comment.authorName || 'Unknown Agent');
        const date = new Date(comment.createdAt).toLocaleString();
        
        return `
            <div class="comment ${commentClass}" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${authorName}</span>
                    <span class="comment-date">${date}</span>
                    <span class="comment-type">[${this.getTypeLabel(comment.type)}]</span>
                </div>
                <div class="comment-content">${this.formatCommentContent(comment.content)}</div>
                <div class="comment-actions">
                    <button class="action-btn small" onclick="comments.toggleComment('${comment.id}')">TOGGLE</button>
                    ${this.canModifyComment(comment) ? 
                        `<button class="action-btn small" onclick="comments.editComment('${comment.id}')">EDIT</button>
                         <button class="action-btn small" onclick="comments.deleteComment('${comment.id}')">DELETE</button>` 
                        : ''
                    }
                </div>
            </div>
        `;
    }

    getCommentClass(type) {
        const classMap = {
            'recommendation': 'comment-recommendation',
            'dislike': 'comment-dislike',
            'analysis': 'comment-analysis',
            'question': 'comment-question',
            'general': 'comment-general'
        };
        return classMap[type] || 'comment-general';
    }

    getTypeLabel(type) {
        const labelMap = {
            'recommendation': 'RECOMMEND',
            'dislike': 'DISLIKE',
            'analysis': 'ANALYSIS',
            'question': 'QUESTION',
            'general': 'GENERAL'
        };
        return labelMap[type] || 'GENERAL';
    }

    formatCommentContent(content) {
        // 위키 링크 파싱
        content = content.replace(/\[\[([^\]]+)\]\]/g, '<a href="#" class="wiki-link" onclick="handleWikiLink(\'$1\')">$1</a>');
        
        // 줄바꿈 처리
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    canModifyComment(comment) {
        const currentUser = authService.getCurrentUser();
        return currentUser && (
            currentUser.uid === comment.author || 
            currentUser.clearance >= 5 // 관리자 권한
        );
    }

    setupCommentInteractions() {
        // 댓글 토글 기능
        document.querySelectorAll('.comment').forEach(comment => {
            comment.addEventListener('click', (e) => {
                if (!e.target.closest('.comment-actions')) {
                    comment.classList.toggle('collapsed');
                }
            });
        });
    }

    toggleComment(commentId) {
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (comment) {
            comment.classList.toggle('collapsed');
        }
    }

    async editComment(commentId) {
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!comment) return;

        const contentDiv = comment.querySelector('.comment-content');
        const currentContent = contentDiv.textContent;
        
        // 편집 모드로 전환
        contentDiv.innerHTML = `
            <textarea class="edit-comment-textarea">${currentContent}</textarea>
            <div class="edit-actions">
                <button class="action-btn small" onclick="comments.saveCommentEdit('${commentId}')">SAVE</button>
                <button class="action-btn small" onclick="comments.cancelCommentEdit('${commentId}')">CANCEL</button>
            </div>
        `;
    }

    async saveCommentEdit(commentId) {
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!comment) return;

        const textarea = comment.querySelector('.edit-comment-textarea');
        const newContent = textarea.value.trim();

        if (!newContent) {
            showNotification('댓글 내용을 입력해주세요.', 'warning');
            return;
        }

        try {
            await commentService.updateComment(commentId, { content: newContent });
            showNotification('댓글이 성공적으로 수정되었습니다.', 'success');
            
            // 댓글 목록 새로고침
            commentService.loadComments(this.currentFileId);
        } catch (error) {
            console.error('댓글 수정 실패:', error);
            showNotification('댓글 수정에 실패했습니다.', 'error');
        }
    }

    cancelCommentEdit(commentId) {
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!comment) return;

        // 원래 내용으로 복원
        commentService.loadComments(this.currentFileId);
    }

    async deleteComment(commentId) {
        if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

        try {
            await commentService.deleteComment(commentId);
            showNotification('댓글이 성공적으로 삭제되었습니다.', 'success');
            
            // 댓글 목록 새로고침
            commentService.loadComments(this.currentFileId);
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            showNotification('댓글 삭제에 실패했습니다.', 'error');
        }
    }
}

// 전역 인스턴스 생성
const comments = new Comments(); 