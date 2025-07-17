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
        
        // 예시 문서 생성 (개발 환경에서만)
        this.createSampleDocuments();
    }

    // 예시 문서 생성
    async createSampleDocuments() {
        try {
            const snapshot = await db.collection('files').get();
            if (snapshot.empty) {
                console.log('Creating sample documents...');
                await this.createSampleFiles();
            }
        } catch (error) {
            console.error('Error creating sample documents:', error);
        }
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

    // 예시 파일들 생성
    async createSampleFiles() {
        const sampleFiles = [
            {
                title: '감시 프로토콜 알파',
                content: `# 감시 프로토콜 알파

## 개요
이 문서는 TAA 아카이브의 기본 감시 프로토콜을 정의합니다.

## 주요 섹션

### 1. 감시 장비 설정
- CCTV 카메라 배치
- 음성 녹음 장비
- 모션 센서 설치

### 2. 데이터 수집 절차
1. 24시간 연속 모니터링
2. 이상 행동 패턴 감지
3. 데이터 백업 및 암호화

### 3. 분석 프로세스
[[인텔리전스 분석 가이드]]를 참조하여 수집된 데이터를 분석합니다.

## 관련 문서
- [[현장 임무 보고서]]
- [[보안 프로토콜 베타]]
- [[데이터 암호화 표준]]

## 최종 업데이트
2024년 1월 15일 - Agent_Alpha에 의해 업데이트됨`,
                author: 'Agent_Alpha',
                requiredClearance: 2,
                createdAt: new Date(Date.now() - 86400000 * 7) // 7일 전
            },
            {
                title: '현장 임무 보고서: 작전 나이트폴',
                content: `# 현장 임무 보고서: 작전 나이트폴

## 임무 개요
**작전명**: 나이트폴 (Nightfall)
**날짜**: 2024년 1월 10일
**위치**: 서울 강남구
**담당 에이전트**: Agent_Beta

## 임무 목표
1. 대상자의 일상 패턴 분석
2. 접촉자 네트워크 파악
3. 의심스러운 활동 증거 수집

## 임무 결과

### 성공 사항
- 대상자의 일일 루틴 완전 파악
- 주요 접촉자 5명 식별
- 의심스러운 만남 3건 기록

### 발견된 정보
- [[감시 프로토콜 알파]]에 따른 데이터 수집 완료
- 음성 녹음 파일 12개 확보
- 사진 자료 47장 촬영

## 결론
대상자는 [[보안 프로토콜 베타]]에서 정의된 위험 요소를 보여주고 있습니다. 추가 감시가 필요합니다.

## 다음 단계
1. 수집된 데이터의 [[인텔리전스 분석]]
2. 상급 기관에 보고서 제출
3. 후속 임무 계획 수립`,
                author: 'Agent_Beta',
                requiredClearance: 3,
                createdAt: new Date(Date.now() - 86400000 * 5) // 5일 전
            },
            {
                title: '시스템 유지보수 일정',
                content: `# 시스템 유지보수 일정

## 월간 점검 일정

### 1주차
- 서버 상태 점검
- 데이터베이스 백업
- 보안 로그 검토

### 2주차
- 네트워크 성능 모니터링
- 방화벽 설정 업데이트
- 사용자 접근 권한 검토

### 3주차
- [[감시 프로토콜 알파]] 시스템 점검
- CCTV 장비 유지보수
- 음성 녹음 시스템 테스트

### 4주차
- 전체 시스템 종합 점검
- 성능 최적화
- 다음 달 일정 계획

## 긴급 상황 대응
- 24시간 모니터링 센터 운영
- 자동 알림 시스템 활성화
- 백업 시스템 준비

## 담당자
- Agent_Gamma (시스템 관리자)
- Agent_Delta (보안 담당)

## 관련 문서
- [[보안 프로토콜 베타]]
- [[데이터 암호화 표준]]`,
                author: 'Agent_Gamma',
                requiredClearance: 1,
                createdAt: new Date(Date.now() - 86400000 * 3) // 3일 전
            },
            {
                title: '인텔리전스 브리핑: 섹터 7',
                content: `# 인텔리전스 브리핑: 섹터 7

## 섹터 개요
**위치**: 서울 서초구
**위험도**: 높음
**모니터링 레벨**: 최고

## 주요 관심 대상

### 대상 A
- **위치**: 강남대로 123번지
- **활동**: 의심스러운 만남 빈발
- **위험도**: 높음

### 대상 B
- **위치**: 서초구 역삼동
- **활동**: [[현장 임무 보고서: 작전 나이트폴]]과 연관
- **위험도**: 중간

## 최근 활동
1. [[감시 프로토콜 알파]]에 따른 24시간 감시
2. 음성 데이터 수집 및 분석
3. 접촉자 네트워크 매핑

## 분석 결과
- 대상자들의 활동이 [[보안 프로토콜 베타]] 위반 가능성
- 추가 감시 및 [[인텔리전스 분석]] 필요

## 권장 사항
1. 즉시 [[현장 임무 보고서]] 작성
2. 상급 기관에 긴급 보고
3. 추가 에이전트 배치 고려

## 관련 문서
- [[감시 프로토콜 알파]]
- [[현장 임무 보고서: 작전 나이트폴]]
- [[보안 프로토콜 베타]]`,
                author: 'Agent_Delta',
                requiredClearance: 4,
                createdAt: new Date(Date.now() - 86400000 * 2) // 2일 전
            },
            {
                title: '교육 세션 피드백',
                content: `# 교육 세션 피드백

## 세션 정보
**일자**: 2024년 1월 12일
**주제**: 고급 감시 기법
**강사**: Agent_Echo
**참석자**: 15명

## 세션 내용

### 1부: 이론 교육
- [[감시 프로토콜 알파]] 심화 학습
- 현대 감시 기술의 발전
- 법적 고려사항

### 2부: 실습
- [[현장 임무 보고서]] 작성법
- 데이터 수집 및 분석 실습
- [[인텔리전스 분석]] 기법

## 참석자 피드백

### 긍정적 평가
- 실무 중심의 교육 내용
- 실제 사례를 통한 학습
- [[시스템 유지보수 일정]]과의 연계성

### 개선 사항
- 더 많은 실습 시간 필요
- 개별 지도 시간 확대
- [[보안 프로토콜 베타]] 관련 추가 교육

## 다음 세션 계획
- 고급 암호화 기법
- [[데이터 암호화 표준]] 심화
- 현장 대응 훈련

## 결론
전반적으로 성공적인 교육 세션이었으며, 참석자들의 만족도가 높았습니다.`,
                author: 'Agent_Echo',
                requiredClearance: 1,
                createdAt: new Date(Date.now() - 86400000 * 1) // 1일 전
            },
            {
                title: '보안 프로토콜 베타',
                content: `# 보안 프로토콜 베타

## 개요
[[감시 프로토콜 알파]]의 확장된 보안 프로토콜입니다.

## 보안 레벨

### 레벨 1 (기본)
- 일반 문서 접근
- 기본 감시 활동
- [[시스템 유지보수 일정]] 확인

### 레벨 2 (중간)
- [[현장 임무 보고서]] 작성
- 감시 데이터 분석
- [[인텔리전스 분석]] 수행

### 레벨 3 (고급)
- [[인텔리전스 브리핑]] 작성
- 민감한 정보 접근
- 상급 기관 보고

### 레벨 4 (최고)
- 모든 문서 접근
- 시스템 관리
- 전략적 의사결정

## 데이터 보호
- [[데이터 암호화 표준]] 준수
- 접근 로그 기록
- 정기적인 보안 감사

## 관련 문서
- [[감시 프로토콜 알파]]
- [[현장 임무 보고서: 작전 나이트폴]]
- [[인텔리전스 브리핑: 섹터 7]]`,
                author: 'Agent_Alpha',
                requiredClearance: 3,
                createdAt: new Date(Date.now() - 86400000 * 6) // 6일 전
            },
            {
                title: '데이터 암호화 표준',
                content: `# 데이터 암호화 표준

## 암호화 알고리즘

### AES-256
- 모든 민감한 데이터에 적용
- 키 관리 시스템 사용
- 정기적인 키 로테이션

### RSA-4096
- 공개키 암호화
- 디지털 서명
- 인증서 관리

## 데이터 분류

### 공개 데이터
- [[시스템 유지보수 일정]]
- 기본 교육 자료
- 공개 문서

### 내부 데이터
- [[감시 프로토콜 알파]]
- [[보안 프로토콜 베타]]
- 일반 임무 보고서

### 기밀 데이터
- [[현장 임무 보고서: 작전 나이트폴]]
- [[인텔리전스 브리핑: 섹터 7]]
- 민감한 인텔리전스

### 최고 기밀
- 전략적 계획
- 상급 기관 보고서
- 특수 임무 정보

## 암호화 절차
1. 데이터 분류 확인
2. 적절한 알고리즘 선택
3. 키 생성 및 관리
4. 암호화 실행
5. 접근 권한 설정

## 관련 문서
- [[감시 프로토콜 알파]]
- [[보안 프로토콜 베타]]
- [[인텔리전스 분석 가이드]]`,
                author: 'Agent_Gamma',
                requiredClearance: 2,
                createdAt: new Date(Date.now() - 86400000 * 4) // 4일 전
            },
            {
                title: '인텔리전스 분석 가이드',
                content: `# 인텔리전스 분석 가이드

## 분석 프로세스

### 1단계: 데이터 수집
- [[감시 프로토콜 알파]]에 따른 데이터 수집
- [[현장 임무 보고서]] 검토
- 관련 문서 분석

### 2단계: 데이터 검증
- 출처 신뢰성 평가
- 정보 일관성 확인
- [[데이터 암호화 표준]] 준수 확인

### 3단계: 패턴 분석
- 행동 패턴 분석
- 접촉자 네트워크 매핑
- 시간대별 활동 분석

### 4단계: 위험도 평가
- [[보안 프로토콜 베타]] 기준 적용
- 위험 요소 식별
- 대응 방안 수립

### 5단계: 보고서 작성
- [[인텔리전스 브리핑]] 형식 준수
- 명확한 결론 제시
- 권장 사항 포함

## 분석 도구
- 데이터 시각화 소프트웨어
- 패턴 인식 알고리즘
- [[시스템 유지보수 일정]] 관리 도구

## 품질 관리
- 동료 검토 시스템
- 정기적인 방법론 업데이트
- 지속적인 교육 훈련

## 관련 문서
- [[감시 프로토콜 알파]]
- [[현장 임무 보고서: 작전 나이트폴]]
- [[인텔리전스 브리핑: 섹터 7]]`,
                author: 'Agent_Delta',
                requiredClearance: 3,
                createdAt: new Date(Date.now() - 86400000 * 3) // 3일 전
            },
            {
                title: '고급 감시 기법 매뉴얼',
                content: `# 고급 감시 기법 매뉴얼

## 개요
[[감시 프로토콜 알파]]를 기반으로 한 고급 감시 기법을 다룹니다.

## 기술적 감시

### 1. 전자 감시
- 전화 감청 기술
- 이메일 모니터링
- 소셜 미디어 추적

### 2. 물리적 감시
- [[현장 임무 보고서]] 작성법
- 은밀한 사진 촬영
- 음성 녹음 기법

### 3. 사이버 감시
- 네트워크 침투
- 데이터 추출
- [[데이터 암호화 표준]] 우회 기법

## 위험 관리
- [[보안 프로토콜 베타]] 준수
- 법적 고려사항
- 윤리적 가이드라인

## 분석 및 보고
- [[인텔리전스 분석 가이드]] 적용
- [[인텔리전스 브리핑]] 작성법
- 상급 기관 보고 절차

## 교육 및 훈련
- [[교육 세션 피드백]] 반영
- 실습 중심 교육
- 지속적인 기술 개발

## 관련 문서
- [[감시 프로토콜 알파]]
- [[현장 임무 보고서: 작전 나이트폴]]
- [[인텔리전스 분석 가이드]]`,
                author: 'Agent_Echo',
                requiredClearance: 3,
                createdAt: new Date(Date.now() - 86400000 * 2) // 2일 전
            },
            {
                title: '에이전트 행동 강령',
                content: `# 에이전트 행동 강령

## 기본 원칙

### 1. 비밀 유지
- 모든 임무 정보는 절대 기밀
- [[데이터 암호화 표준]] 준수
- 무단 정보 유출 금지

### 2. 전문성
- [[감시 프로토콜 알파]] 준수
- [[보안 프로토콜 베타]] 적용
- 지속적인 교육 훈련

### 3. 윤리성
- 법적 한계 준수
- 인권 존중
- 책임감 있는 행동

## 임무 수행

### 준비 단계
- [[현장 임무 보고서]] 작성 준비
- [[시스템 유지보수 일정]] 확인
- 장비 점검 및 테스트

### 실행 단계
- [[인텔리전스 분석 가이드]] 적용
- 안전 우선 원칙
- 지속적인 상황 평가

### 보고 단계
- [[인텔리전스 브리핑]] 작성
- 정확한 정보 전달
- 시의적절한 보고

## 교육 및 개발
- [[교육 세션 피드백]] 반영
- 고급 기술 습득
- 동료와의 협력

## 관련 문서
- [[감시 프로토콜 알파]]
- [[보안 프로토콜 베타]]
- [[고급 감시 기법 매뉴얼]]`,
                author: 'Agent_Alpha',
                requiredClearance: 1,
                createdAt: new Date(Date.now() - 86400000 * 1) // 1일 전
            },
            {
                title: '긴급 상황 대응 매뉴얼',
                content: `# 긴급 상황 대응 매뉴얼

## 긴급 상황 분류

### 레벨 1 (경미)
- 일반적인 시스템 오류
- [[시스템 유지보수 일정]] 조정
- 기본적인 문제 해결

### 레벨 2 (중간)
- 보안 위반 의심
- [[보안 프로토콜 베타]] 활성화
- 추가 감시 필요

### 레벨 3 (심각)
- 확실한 보안 위반
- [[인텔리전스 브리핑]] 긴급 작성
- 즉시 대응 조치

### 레벨 4 (최고)
- 시스템 침투
- 모든 에이전트 동원
- 상급 기관 긴급 보고

## 대응 절차

### 1. 상황 평가
- [[감시 프로토콜 알파]] 적용
- 위험도 즉시 판단
- 대응 레벨 결정

### 2. 대응 조치
- [[현장 임무 보고서]] 작성
- 관련 에이전트 동원
- 시스템 보안 강화

### 3. 보고 및 기록
- [[인텔리전스 분석]] 수행
- 상세한 기록 작성
- 향후 대응 방안 수립

## 예방 조치
- 정기적인 [[시스템 유지보수 일정]] 점검
- [[데이터 암호화 표준]] 강화
- 지속적인 보안 교육

## 관련 문서
- [[감시 프로토콜 알파]]
- [[보안 프로토콜 베타]]
- [[인텔리전스 분석 가이드]]`,
                author: 'Agent_Gamma',
                requiredClearance: 2,
                createdAt: new Date(Date.now() - 86400000 * 1) // 1일 전
            },
            {
                title: 'TAA 아카이브 운영 가이드',
                content: `# TAA 아카이브 운영 가이드

## 시스템 개요
TAA 아카이브는 기밀 정보 관리 및 협업을 위한 통합 플랫폼입니다.

## 주요 기능

### 1. 문서 관리
- [[감시 프로토콜 알파]] 등 모든 문서 체계적 관리
- 버전 관리 및 히스토리 추적
- [[데이터 암호화 표준]] 적용

### 2. 협업 도구
- [[현장 임무 보고서]] 공동 작성
- [[인텔리전스 분석]] 협업
- 실시간 댓글 및 토론

### 3. 보안 시스템
- [[보안 프로토콜 베타]] 기반 접근 제어
- 다단계 인증
- 활동 로그 기록

### 4. 검색 및 분석
- 고급 검색 기능
- [[인텔리전스 브리핑]] 자동 생성
- 데이터 시각화

## 사용자 가이드

### 신규 사용자
1. [[에이전트 행동 강령]] 숙지
2. [[시스템 유지보수 일정]] 확인
3. 기본 교육 완료

### 일반 사용자
- [[교육 세션 피드백]] 참고
- 정기적인 보안 교육
- 지속적인 기술 개발

### 관리자
- [[고급 감시 기법 매뉴얼]] 숙지
- [[긴급 상황 대응 매뉴얼]] 준비
- 시스템 모니터링

## 관련 문서
- [[감시 프로토콜 알파]]
- [[보안 프로토콜 베타]]
- [[인텔리전스 분석 가이드]]`,
                author: 'Agent_Alpha',
                requiredClearance: 1,
                createdAt: new Date(Date.now() - 86400000 * 1) // 1일 전
            }
        ];

        // 각 예시 파일 생성
        for (const fileData of sampleFiles) {
            try {
                const docRef = await db.collection('files').add({
                    ...fileData,
                    author: fileData.author,
                    authorName: fileData.author,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    version: 1,
                    isActive: true,
                    keywords: wikiParser.extractKeywords(fileData.content),
                    stats: wikiParser.generateTextStats(fileData.content),
                    links: wikiParser.extractWikiLinks(fileData.content)
                });

                // 버전 히스토리 저장
                await this.saveVersionHistory(docRef.id, {
                    id: docRef.id,
                    ...fileData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    version: 1,
                    isActive: true
                }, 'CREATE');

                console.log(`Sample file created: ${fileData.title}`);
            } catch (error) {
                console.error(`Error creating sample file ${fileData.title}:`, error);
            }
        }

        console.log('All sample documents created successfully');
    }
}

// 전역 인스턴스 생성
window.fileService = new FileService();

console.log('TAA Archives: File service initialized'); 