// TAA Archives - Admin Account Setup Script
// Firebase에 관리자 계정을 생성하는 유틸리티

class AdminSetup {
    constructor() {
        this.adminEmail = 'apostleloannes@internal.taa';
        this.adminPassword = 'qpwoei1029!';
        this.adminAgentId = 'apostleloannes';
    }

    // 관리자 계정 생성
    async createAdminAccount() {
        try {
            console.log('Creating admin account...');
            
            // 1. Firebase Auth에 사용자 생성
            const userCredential = await auth.createUserWithEmailAndPassword(
                this.adminEmail, 
                this.adminPassword
            );
            
            const user = userCredential.user;
            console.log('Admin user created in Auth:', user.uid);
            
            // 2. Firestore에 관리자 문서 생성
            await this.createAdminDocument(user.uid);
            
            console.log('Admin account setup completed successfully!');
            return {
                success: true,
                uid: user.uid,
                message: 'Admin account created successfully'
            };
            
        } catch (error) {
            console.error('Error creating admin account:', error);
            
            // 이미 존재하는 경우 처리
            if (error.code === 'auth/email-already-in-use') {
                console.log('Admin account already exists, checking Firestore document...');
                return await this.updateExistingAdminAccount();
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 기존 관리자 계정 업데이트
    async updateExistingAdminAccount() {
        try {
            // 기존 사용자 로그인
            const userCredential = await auth.signInWithEmailAndPassword(
                this.adminEmail, 
                this.adminPassword
            );
            
            const user = userCredential.user;
            
            // Firestore 문서 업데이트
            await this.createAdminDocument(user.uid);
            
            // 로그아웃
            await auth.signOut();
            
            console.log('Existing admin account updated successfully!');
            return {
                success: true,
                uid: user.uid,
                message: 'Existing admin account updated'
            };
            
        } catch (error) {
            console.error('Error updating existing admin account:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Firestore 관리자 문서 생성
    async createAdminDocument(uid) {
        const adminData = {
            email: this.adminEmail,
            agentId: this.adminAgentId,
            displayName: 'SYSTEM ADMINISTRATOR',
            role: 'admin',
            securityClearance: 5,
            isActive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: true,
            permissions: {
                canDeleteContent: true,
                canBanUsers: true,
                canManageUsers: true,
                canViewAllData: true
            }
        };

        await db.collection('users').doc(uid).set(adminData);
        console.log('Admin document created in Firestore');
    }

    // 관리자 계정 존재 여부 확인
    async checkAdminAccount() {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(
                this.adminEmail, 
                this.adminPassword
            );
            
            const user = userCredential.user;
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            // 로그아웃
            await auth.signOut();
            
            if (userDoc.exists && userDoc.data().role === 'admin') {
                return {
                    exists: true,
                    uid: user.uid,
                    data: userDoc.data()
                };
            } else {
                return {
                    exists: false,
                    message: 'Admin document not found or role is not admin'
                };
            }
            
        } catch (error) {
            return {
                exists: false,
                error: error.message
            };
        }
    }

    // 관리자 계정 삭제 (위험한 작업)
    async deleteAdminAccount() {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(
                this.adminEmail, 
                this.adminPassword
            );
            
            const user = userCredential.user;
            
            // Firestore 문서 삭제
            await db.collection('users').doc(user.uid).delete();
            
            // Auth 계정 삭제
            await user.delete();
            
            console.log('Admin account deleted successfully!');
            return {
                success: true,
                message: 'Admin account deleted'
            };
            
        } catch (error) {
            console.error('Error deleting admin account:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 전역 인스턴스 생성
const adminSetup = new AdminSetup();
window.adminSetup = adminSetup;

console.log('TAA Archives: Admin setup utility initialized');

// 개발용: 관리자 계정 생성 함수 (콘솔에서 실행 가능)
window.createAdminAccount = () => adminSetup.createAdminAccount();
window.checkAdminAccount = () => adminSetup.checkAdminAccount();
window.deleteAdminAccount = () => adminSetup.deleteAdminAccount(); 