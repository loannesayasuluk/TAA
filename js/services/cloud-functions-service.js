// TAA Archives - Cloud Functions Service
// Firebase Cloud Functions를 호출하는 서비스

class CloudFunctionsService {
    constructor() {
        this.functions = null;
        this.init();
    }

    // 초기화
    init() {
        if (typeof firebase !== 'undefined' && firebase.functions) {
            this.functions = firebase.functions();
        } else {
            console.warn('Firebase Functions not available');
        }
    }

    // 문서 생성
    async createArticle(articleData) {
        try {
            if (!this.functions) {
                throw new Error('Cloud Functions not initialized');
            }

            const createArticleFunction = this.functions.httpsCallable('createArticle');
            const result = await createArticleFunction(articleData);

            return result.data;
        } catch (error) {
            console.error('Cloud Functions: Error creating article:', error);
            throw this.handleFunctionError(error);
        }
    }

    // 문서 수정
    async updateArticle(articleData) {
        try {
            if (!this.functions) {
                throw new Error('Cloud Functions not initialized');
            }

            const updateArticleFunction = this.functions.httpsCallable('updateArticle');
            const result = await updateArticleFunction(articleData);

            return result.data;
        } catch (error) {
            console.error('Cloud Functions: Error updating article:', error);
            throw this.handleFunctionError(error);
        }
    }

    // 문서 삭제
    async deleteArticle(articleId) {
        try {
            if (!this.functions) {
                throw new Error('Cloud Functions not initialized');
            }

            const deleteArticleFunction = this.functions.httpsCallable('deleteArticle');
            const result = await deleteArticleFunction({ articleId });

            return result.data;
        } catch (error) {
            console.error('Cloud Functions: Error deleting article:', error);
            throw this.handleFunctionError(error);
        }
    }

    // 댓글 생성
    async createComment(commentData) {
        try {
            if (!this.functions) {
                throw new Error('Cloud Functions not initialized');
            }

            const createCommentFunction = this.functions.httpsCallable('createComment');
            const result = await createCommentFunction(commentData);

            return result.data;
        } catch (error) {
            console.error('Cloud Functions: Error creating comment:', error);
            throw this.handleFunctionError(error);
        }
    }

    // 사용자 관리
    async manageUser(managementData) {
        try {
            if (!this.functions) {
                throw new Error('Cloud Functions not initialized');
            }

            const manageUserFunction = this.functions.httpsCallable('manageUser');
            const result = await manageUserFunction(managementData);

            return result.data;
        } catch (error) {
            console.error('Cloud Functions: Error managing user:', error);
            throw this.handleFunctionError(error);
        }
    }

    // 함수 에러 처리
    handleFunctionError(error) {
        if (error.code === 'functions/unauthenticated') {
            return new Error('인증이 필요합니다. 다시 로그인해주세요.');
        } else if (error.code === 'functions/permission-denied') {
            return new Error('권한이 없습니다.');
        } else if (error.code === 'functions/invalid-argument') {
            return new Error('잘못된 입력입니다: ' + error.message);
        } else if (error.code === 'functions/not-found') {
            return new Error('요청한 리소스를 찾을 수 없습니다.');
        } else if (error.code === 'functions/already-exists') {
            return new Error('이미 존재하는 리소스입니다.');
        } else if (error.code === 'functions/resource-exhausted') {
            return new Error('리소스가 부족합니다. 잠시 후 다시 시도해주세요.');
        } else if (error.code === 'functions/failed-precondition') {
            return new Error('사전 조건이 충족되지 않았습니다.');
        } else if (error.code === 'functions/aborted') {
            return new Error('작업이 중단되었습니다.');
        } else if (error.code === 'functions/out-of-range') {
            return new Error('범위를 벗어난 요청입니다.');
        } else if (error.code === 'functions/unimplemented') {
            return new Error('구현되지 않은 기능입니다.');
        } else if (error.code === 'functions/internal') {
            return new Error('서버 내부 오류가 발생했습니다.');
        } else if (error.code === 'functions/unavailable') {
            return new Error('서비스가 일시적으로 사용할 수 없습니다.');
        } else if (error.code === 'functions/data-loss') {
            return new Error('데이터 손실이 발생했습니다.');
        } else {
            return new Error('알 수 없는 오류가 발생했습니다: ' + error.message);
        }
    }

    // 함수 상태 확인
    async checkFunctionStatus() {
        try {
            if (!this.functions) {
                return { available: false, message: 'Cloud Functions not initialized' };
            }

            // 간단한 테스트 함수 호출
            const testFunction = this.functions.httpsCallable('createArticle');
            await testFunction({ title: 'test', content: 'test' });
            
            return { available: true, message: 'Cloud Functions are available' };
        } catch (error) {
            if (error.code === 'functions/unauthenticated') {
                return { available: true, message: 'Cloud Functions available (auth required)' };
            }
            return { available: false, message: error.message };
        }
    }

    // 함수 로그 가져오기
    async getFunctionLogs(functionName, limit = 50) {
        try {
            if (!this.functions) {
                throw new Error('Cloud Functions not initialized');
            }

            // Firebase Console에서 로그를 확인하는 방법 안내
            console.log(`To view logs for ${functionName}, visit Firebase Console > Functions > Logs`);
            
            return {
                message: 'Logs are available in Firebase Console',
                consoleUrl: `https://console.firebase.google.com/project/${firebase.app().options.projectId}/functions/logs`
            };
        } catch (error) {
            console.error('Error getting function logs:', error);
            throw error;
        }
    }

    // 함수 성능 모니터링
    async getFunctionMetrics(functionName) {
        try {
            if (!this.functions) {
                throw new Error('Cloud Functions not initialized');
            }

            // Firebase Console에서 메트릭을 확인하는 방법 안내
            return {
                message: 'Metrics are available in Firebase Console',
                consoleUrl: `https://console.firebase.google.com/project/${firebase.app().options.projectId}/functions/usage`
            };
        } catch (error) {
            console.error('Error getting function metrics:', error);
            throw error;
        }
    }
}

// 전역 인스턴스 생성
window.cloudFunctionsService = new CloudFunctionsService(); 