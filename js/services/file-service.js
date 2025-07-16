// TAA Archives - File Service
// 파일 생성, 편집, 조회 및 관리

class FileService {
    constructor() {
        this.currentFile = null;
        this.filesCache = new Map();
        this.initFileService();
    }

    // 파일 서비스 초기화
    initFileService() {
        // 기존 페이지 목록 로드
        this.loadExistingPages();
        
        // 실시간 파일 업데이트 감지
        this.setupRealtimeUpdates();
    }

    // 기존 페이지 목록 로드
    async loadExistingPages() {
        try {
            const snapshot = await db.collection('files').get();
            const pages = snapshot.docs.map(doc => doc.data().title);
            wikiParser.updateExistingPages(pages);
        } catch (error) {
            console.error('Error loading existing pages:', error);
        }
    }

    // 실시간 업데이트 설정
    setupRealtimeUpdates() {
        db.collection('files')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        this.filesCache.set(change.doc.id, {
                            id: change.doc.id,
                            ...change.doc.data()
                        });
                    } else if (change.type === 'removed') {
                        this.filesCache.delete(change.doc.id);
                    }
                });
                
                // 기존 페이지 목록 업데이트
                this.loadExistingPages();
            });
    }

    // 새 파일 생성
    async createFile(title, content, requiredClearance = 1) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        if (!authService.checkClearance(requiredClearance)) {
            throw new Error('Insufficient clearance level');
        }

        try {
            // 텍스트 정규화
            const normalizedContent = wikiParser.normalizeText(content);
            
            // 금지어 검사
            const forbiddenWords = wikiParser.checkForbiddenWords(normalizedContent);
            if (forbiddenWords.length > 0) {
                terminalEffects.showWarning(`Forbidden words detected: ${forbiddenWords.join(', ')}`);
                const maskedContent = wikiParser.maskForbiddenWords(normalizedContent);
                content = maskedContent;
            }

            // 파일 데이터 준비
            const fileData = {
                title: title.trim(),
                content: content,
                author: authService.getCurrentUser().uid,
                authorName: authService.getCurrentUser().displayName || authService.getCurrentUser().email,
                requiredClearance: requiredClearance,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: 1,
                isActive: true,
                keywords: wikiParser.extractKeywords(content),
                stats: wikiParser.generateTextStats(content),
                links: wikiParser.extractWikiLinks(content)
            };

            // 파일 저장
            const docRef = await db.collection('files').add(fileData);
            
            // 버전 히스토리 저장
            await this.saveVersionHistory(docRef.id, fileData, 'CREATE');

            terminalEffects.showSuccess('File created successfully');
            
            // 감사 로그 기록
            authService.logAuditEvent('FILE_CREATE', {
                fileId: docRef.id,
                title: title,
                clearance: requiredClearance
            });

            return docRef.id;
            
        } catch (error) {
            console.error('Error creating file:', error);
            terminalEffects.showError('Failed to create file');
            throw error;
        }
    }

    // 파일 업데이트
    async updateFile(fileId, title, content, requiredClearance = null) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const fileDoc = await db.collection('files').doc(fileId).get();
            if (!fileDoc.exists) {
                throw new Error('File not found');
            }

            const fileData = fileDoc.data();
            
            // 권한 확인
            if (!authService.checkClearance(fileData.requiredClearance)) {
                throw new Error('Insufficient clearance level');
            }

            // 텍스트 정규화
            const normalizedContent = wikiParser.normalizeText(content);
            
            // 금지어 검사
            const forbiddenWords = wikiParser.checkForbiddenWords(normalizedContent);
            if (forbiddenWords.length > 0) {
                terminalEffects.showWarning(`Forbidden words detected: ${forbiddenWords.join(', ')}`);
                const maskedContent = wikiParser.maskForbiddenWords(normalizedContent);
                content = maskedContent;
            }

            // 업데이트 데이터 준비
            const updateData = {
                title: title.trim(),
                content: content,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: fileData.version + 1,
                keywords: wikiParser.extractKeywords(content),
                stats: wikiParser.generateTextStats(content),
                links: wikiParser.extractWikiLinks(content)
            };

            if (requiredClearance !== null) {
                updateData.requiredClearance = requiredClearance;
            }

            // 파일 업데이트
            await db.collection('files').doc(fileId).update(updateData);
            
            // 버전 히스토리 저장
            await this.saveVersionHistory(fileId, { ...fileData, ...updateData }, 'UPDATE');

            terminalEffects.showSuccess('File updated successfully');
            
            // 감사 로그 기록
            authService.logAuditEvent('FILE_UPDATE', {
                fileId: fileId,
                title: title,
                version: updateData.version
            });

        } catch (error) {
            console.error('Error updating file:', error);
            terminalEffects.showError('Failed to update file');
            throw error;
        }
    }

    // 파일 조회
    async getFile(fileId) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const fileDoc = await db.collection('files').doc(fileId).get();
            
            if (!fileDoc.exists) {
                throw new Error('File not found');
            }

            const fileData = fileDoc.data();
            
            // 권한 확인
            if (!authService.checkClearance(fileData.requiredClearance)) {
                throw new Error('Insufficient clearance level');
            }

            // 조회 기록 저장
            await this.logFileAccess(fileId, 'VIEW');

            return {
                id: fileDoc.id,
                ...fileData
            };
            
        } catch (error) {
            console.error('Error getting file:', error);
            throw error;
        }
    }

    // 파일 목록 조회
    async getFiles(options = {}) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            let query = db.collection('files').where('isActive', '==', true);
            
            // 보안 등급 필터링
            if (options.maxClearance) {
                query = query.where('requiredClearance', '<=', options.maxClearance);
            }
            
            // 정렬
            if (options.sortBy === 'title') {
                query = query.orderBy('title');
            } else if (options.sortBy === 'updatedAt') {
                query = query.orderBy('updatedAt', 'desc');
            } else {
                query = query.orderBy('updatedAt', 'desc');
            }
            
            // 페이지네이션
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const snapshot = await query.get();
            const files = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return files;
            
        } catch (error) {
            console.error('Error getting files:', error);
            throw error;
        }
    }

    // 파일 검색
    async searchFiles(query, options = {}) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const files = await this.getFiles(options);
            const results = [];

            files.forEach(file => {
                const searchResult = wikiParser.searchInText(
                    file.title + ' ' + file.content, 
                    query
                );
                
                if (searchResult.found) {
                    results.push({
                        ...file,
                        searchExcerpt: searchResult.excerpt,
                        searchPosition: searchResult.position
                    });
                }
            });

            return results.sort((a, b) => a.searchPosition - b.searchPosition);
            
        } catch (error) {
            console.error('Error searching files:', error);
            throw error;
        }
    }

    // 파일 삭제 (비활성화)
    async deleteFile(fileId) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const fileDoc = await db.collection('files').doc(fileId).get();
            if (!fileDoc.exists) {
                throw new Error('File not found');
            }

            const fileData = fileDoc.data();
            
            // 권한 확인 (작성자 또는 관리자만)
            if (fileData.author !== authService.getCurrentUser().uid && 
                authService.getCurrentClearance() < 4) {
                throw new Error('Insufficient permissions');
            }

            await db.collection('files').doc(fileId).update({
                isActive: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: authService.getCurrentUser().uid
            });

            terminalEffects.showSuccess('File deleted successfully');
            
            // 감사 로그 기록
            authService.logAuditEvent('FILE_DELETE', {
                fileId: fileId,
                title: fileData.title
            });

        } catch (error) {
            console.error('Error deleting file:', error);
            terminalEffects.showError('Failed to delete file');
            throw error;
        }
    }

    // 버전 히스토리 저장
    async saveVersionHistory(fileId, fileData, action) {
        try {
            const historyData = {
                fileId: fileId,
                version: fileData.version,
                action: action,
                title: fileData.title,
                content: fileData.content,
                author: authService.getCurrentUser().uid,
                authorName: authService.getCurrentUser().displayName || authService.getCurrentUser().email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                requiredClearance: fileData.requiredClearance
            };

            await db.collection('file_history').add(historyData);
        } catch (error) {
            console.error('Error saving version history:', error);
        }
    }

    // 버전 히스토리 조회
    async getFileHistory(fileId) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const snapshot = await db.collection('file_history')
                .where('fileId', '==', fileId)
                .orderBy('timestamp', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('Error getting file history:', error);
            throw error;
        }
    }

    // 버전 복원
    async restoreVersion(fileId, versionId) {
        if (!authService.getCurrentUser()) {
            throw new Error('Authentication required');
        }

        try {
            const versionDoc = await db.collection('file_history').doc(versionId).get();
            if (!versionDoc.exists) {
                throw new Error('Version not found');
            }

            const versionData = versionDoc.data();
            
            // 현재 파일 조회
            const currentFile = await this.getFile(fileId);
            
            // 버전 복원
            await this.updateFile(
                fileId,
                versionData.title,
                versionData.content,
                versionData.requiredClearance
            );

            terminalEffects.showSuccess('Version restored successfully');
            
            // 감사 로그 기록
            authService.logAuditEvent('VERSION_RESTORE', {
                fileId: fileId,
                versionId: versionId,
                version: versionData.version
            });

        } catch (error) {
            console.error('Error restoring version:', error);
            terminalEffects.showError('Failed to restore version');
            throw error;
        }
    }

    // 파일 접근 로그
    async logFileAccess(fileId, action) {
        try {
            const logData = {
                fileId: fileId,
                userId: authService.getCurrentUser().uid,
                action: action,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            };

            await db.collection('file_access_logs').add(logData);
        } catch (error) {
            console.error('Error logging file access:', error);
        }
    }

    // 파일 통계 조회
    async getFileStats(fileId) {
        try {
            const file = await this.getFile(fileId);
            const history = await this.getFileHistory(fileId);
            const accessLogs = await this.getFileAccessLogs(fileId);

            return {
                file: file,
                history: history,
                accessLogs: accessLogs,
                totalViews: accessLogs.filter(log => log.action === 'VIEW').length,
                totalEdits: history.filter(h => h.action === 'UPDATE').length,
                lastModified: file.updatedAt,
                createdBy: file.authorName
            };
            
        } catch (error) {
            console.error('Error getting file stats:', error);
            throw error;
        }
    }

    // 파일 접근 로그 조회
    async getFileAccessLogs(fileId) {
        try {
            const snapshot = await db.collection('file_access_logs')
                .where('fileId', '==', fileId)
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('Error getting file access logs:', error);
            return [];
        }
    }

    // 파일 미리보기 생성
    generateFilePreview(content, maxLength = 200) {
        return wikiParser.generatePreview(content, maxLength);
    }

    // 파일 링크 유효성 검사
    validateFileLinks(content) {
        return wikiParser.validateLinks(content);
    }

    // 파일 키워드 추출
    extractFileKeywords(content) {
        return wikiParser.extractKeywords(content);
    }

    // 파일 제목 중복 확인
    async checkTitleExists(title) {
        try {
            const snapshot = await db.collection('files')
                .where('title', '==', title)
                .where('isActive', '==', true)
                .get();

            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking title existence:', error);
            return false;
        }
    }

    // 파일 권한 확인
    async checkFilePermissions(fileId) {
        try {
            const file = await this.getFile(fileId);
            const currentUser = authService.getCurrentUser();
            
            return {
                canView: authService.checkClearance(file.requiredClearance),
                canEdit: file.author === currentUser.uid || authService.getCurrentClearance() >= 3,
                canDelete: file.author === currentUser.uid || authService.getCurrentClearance() >= 4,
                isOwner: file.author === currentUser.uid
            };
        } catch (error) {
            console.error('Error checking file permissions:', error);
            return {
                canView: false,
                canEdit: false,
                canDelete: false,
                isOwner: false
            };
        }
    }
}

// 전역 인스턴스 생성
window.fileService = new FileService();

console.log('TAA Archives: File service initialized'); 