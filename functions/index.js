const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin 초기화
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// 문서 생성 함수
exports.createArticle = functions.https.onCall(async (data, context) => {
    try {
        // 인증 확인
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { title, content, requiredClearance = 1 } = data;
        const userId = context.auth.uid;

        // 입력 데이터 검증
        if (!title || !content) {
            throw new functions.https.HttpsError('invalid-argument', 'Title and content are required');
        }

        if (title.length < 1 || title.length > 200) {
            throw new functions.https.HttpsError('invalid-argument', 'Title must be between 1 and 200 characters');
        }

        if (content.length < 1 || content.length > 50000) {
            throw new functions.https.HttpsError('invalid-argument', 'Content must be between 1 and 50,000 characters');
        }

        if (requiredClearance < 1 || requiredClearance > 5) {
            throw new functions.https.HttpsError('invalid-argument', 'Security clearance must be between 1 and 5');
        }

        // 사용자 정보 가져오기
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }

        const userData = userDoc.data();

        // 사용자 권한 확인
        if (userData.securityClearance < requiredClearance) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient security clearance');
        }

        // 문서 생성
        const articleData = {
            title: title.trim(),
            content: content.trim(),
            authorId: userId,
            authorName: userData.displayName || userData.email,
            requiredClearance: requiredClearance,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            viewCount: 0,
            version: 1,
            isActive: true
        };

        const docRef = await db.collection('articles').add(articleData);

        // 히스토리 기록
        await db.collection('file_history').add({
            fileId: docRef.id,
            action: 'created',
            authorId: userId,
            authorName: articleData.authorName,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            version: 1,
            changes: {
                title: articleData.title,
                content: articleData.content
            }
        });

        // 감사 로그
        await db.collection('audit_logs').add({
            action: 'article_created',
            userId: userId,
            userEmail: userData.email,
            targetId: docRef.id,
            targetType: 'article',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: context.rawRequest.ip,
            userAgent: context.rawRequest.headers['user-agent']
        });

        return {
            success: true,
            articleId: docRef.id,
            message: 'Article created successfully'
        };

    } catch (error) {
        console.error('createArticle error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create article');
    }
});

// 문서 수정 함수
exports.updateArticle = functions.https.onCall(async (data, context) => {
    try {
        // 인증 확인
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { articleId, title, content, requiredClearance } = data;
        const userId = context.auth.uid;

        // 입력 데이터 검증
        if (!articleId) {
            throw new functions.https.HttpsError('invalid-argument', 'Article ID is required');
        }

        if (!title || !content) {
            throw new functions.https.HttpsError('invalid-argument', 'Title and content are required');
        }

        // 문서 존재 확인
        const articleDoc = await db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Article not found');
        }

        const articleData = articleDoc.data();

        // 권한 확인
        if (articleData.authorId !== userId && !context.auth.token.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Only the author can edit this article');
        }

        // 사용자 정보 가져오기
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // 보안 등급 확인
        if (requiredClearance && userData.securityClearance < requiredClearance) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient security clearance');
        }

        // 문서 업데이트
        const updateData = {
            title: title.trim(),
            content: content.trim(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            version: (articleData.version || 1) + 1
        };

        if (requiredClearance) {
            updateData.requiredClearance = requiredClearance;
        }

        await db.collection('articles').doc(articleId).update(updateData);

        // 히스토리 기록
        await db.collection('file_history').add({
            fileId: articleId,
            action: 'updated',
            authorId: userId,
            authorName: userData.displayName || userData.email,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            version: updateData.version,
            changes: {
                title: updateData.title,
                content: updateData.content
            }
        });

        // 감사 로그
        await db.collection('audit_logs').add({
            action: 'article_updated',
            userId: userId,
            userEmail: userData.email,
            targetId: articleId,
            targetType: 'article',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: context.rawRequest.ip,
            userAgent: context.rawRequest.headers['user-agent']
        });

        return {
            success: true,
            message: 'Article updated successfully'
        };

    } catch (error) {
        console.error('updateArticle error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update article');
    }
});

// 문서 삭제 함수
exports.deleteArticle = functions.https.onCall(async (data, context) => {
    try {
        // 인증 확인
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { articleId } = data;
        const userId = context.auth.uid;

        // 입력 데이터 검증
        if (!articleId) {
            throw new functions.https.HttpsError('invalid-argument', 'Article ID is required');
        }

        // 문서 존재 확인
        const articleDoc = await db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Article not found');
        }

        const articleData = articleDoc.data();

        // 권한 확인 (작성자 또는 관리자만)
        if (articleData.authorId !== userId && !context.auth.token.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Only the author or admin can delete this article');
        }

        // 사용자 정보 가져오기
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // 소프트 삭제 (실제 삭제 대신 비활성화)
        await db.collection('articles').doc(articleId).update({
            isActive: false,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            deletedBy: userId
        });

        // 감사 로그
        await db.collection('audit_logs').add({
            action: 'article_deleted',
            userId: userId,
            userEmail: userData.email,
            targetId: articleId,
            targetType: 'article',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: context.rawRequest.ip,
            userAgent: context.rawRequest.headers['user-agent']
        });

        return {
            success: true,
            message: 'Article deleted successfully'
        };

    } catch (error) {
        console.error('deleteArticle error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete article');
    }
});

// 댓글 생성 함수
exports.createComment = functions.https.onCall(async (data, context) => {
    try {
        // 인증 확인
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { articleId, content } = data;
        const userId = context.auth.uid;

        // 입력 데이터 검증
        if (!articleId || !content) {
            throw new functions.https.HttpsError('invalid-argument', 'Article ID and content are required');
        }

        if (content.length < 1 || content.length > 1000) {
            throw new functions.https.HttpsError('invalid-argument', 'Comment must be between 1 and 1,000 characters');
        }

        // 문서 존재 확인
        const articleDoc = await db.collection('articles').doc(articleId).get();
        if (!articleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Article not found');
        }

        // 사용자 정보 가져오기
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // 댓글 생성
        const commentData = {
            articleId: articleId,
            content: content.trim(),
            authorId: userId,
            authorName: userData.displayName || userData.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
        };

        const docRef = await db.collection('comments').add(commentData);

        return {
            success: true,
            commentId: docRef.id,
            message: 'Comment created successfully'
        };

    } catch (error) {
        console.error('createComment error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create comment');
    }
});

// 사용자 관리 함수
exports.manageUser = functions.https.onCall(async (data, context) => {
    try {
        // 관리자 권한 확인
        if (!context.auth || !context.auth.token.admin) {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required');
        }

        const { action, userId, userData } = data;
        const adminId = context.auth.uid;

        switch (action) {
            case 'update_clearance':
                await db.collection('users').doc(userId).update({
                    securityClearance: userData.securityClearance,
                    updatedBy: adminId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                break;

            case 'ban_user':
                await db.collection('users').doc(userId).update({
                    isBanned: true,
                    bannedBy: adminId,
                    bannedAt: admin.firestore.FieldValue.serverTimestamp(),
                    banReason: userData.banReason
                });
                break;

            case 'unban_user':
                await db.collection('users').doc(userId).update({
                    isBanned: false,
                    unbannedBy: adminId,
                    unbannedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                break;

            default:
                throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
        }

        // 감사 로그
        await db.collection('audit_logs').add({
            action: `user_${action}`,
            adminId: adminId,
            targetUserId: userId,
            targetType: 'user',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: userData
        });

        return {
            success: true,
            message: `User ${action} completed successfully`
        };

    } catch (error) {
        console.error('manageUser error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to manage user');
    }
}); 