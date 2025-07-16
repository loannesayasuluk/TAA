// TAA Archives - Admin Account Setup
// Firebase에 관리자 계정을 생성하는 유틸리티

class AdminSetup {
    constructor() {
        this.adminEmail = 'apostleloannes@internal.taa';
        this.adminPassword = 'eoqusdls0823!';
        this.adminAgentId = 'apostleloannes';
    }

    // 관리자 계정 생성
    async createAdminAccount() {
        try {
            console.log('TAA Archives: Creating admin account...');

            // Firebase Auth로 사용자 생성
            const userCredential = await auth.createUserWithEmailAndPassword(
                this.adminEmail,
                this.adminPassword
            );

            const user = userCredential.user;

            // 관리자 프로필 데이터
            const adminProfile = {
                uid: user.uid,
                agentId: this.adminAgentId,
                email: this.adminEmail,
                displayName: 'System Administrator',
                securityClearance: 5,
                role: 'admin',
                permissions: {
                    canBanUsers: true,
                    canManageUsers: true,
                    canDeleteContent: true,
                    canViewAllData: true,
                    canAccessAdminPanel: true
                },
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system'
            };

            // Firestore에 관리자 프로필 저장
            await db.collection('users').doc(user.uid).set(adminProfile);

            // Agent ID 중복 방지 레코드 생성
            await db.collection('agent_ids').doc(this.adminAgentId).set({
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAdmin: true
            });

            console.log('TAA Archives: Admin account created successfully');
            console.log('Admin ID:', this.adminAgentId);
            console.log('Admin Email:', this.adminEmail);
            console.log('Admin Password:', this.adminPassword);

            return {
                success: true,
                message: '관리자 계정이 성공적으로 생성되었습니다.',
                adminData: {
                    agentId: this.adminAgentId,
                    email: this.adminEmail,
                    uid: user.uid
                }
            };

        } catch (error) {
            console.error('TAA Archives: Error creating admin account:', error);
            
            if (error.code === 'auth/email-already-in-use') {
                return {
                    success: false,
                    message: '관리자 계정이 이미 존재합니다.',
                    error: error.code
                };
            }
            
            return {
                success: false,
                message: '관리자 계정 생성 중 오류가 발생했습니다.',
                error: error.message
            };
        }
    }

    // 관리자 계정 존재 여부 확인
    async checkAdminAccount() {
        try {
            const userSnapshot = await db.collection('users')
                .where('role', '==', 'admin')
                .limit(1)
                .get();

            if (!userSnapshot.empty) {
                const adminDoc = userSnapshot.docs[0];
                const adminData = adminDoc.data();
                
                return {
                    exists: true,
                    adminData: {
                        uid: adminDoc.id,
                        ...adminData
                    }
                };
            }

            return {
                exists: false,
                adminData: null
            };

        } catch (error) {
            console.error('TAA Archives: Error checking admin account:', error);
            return {
                exists: false,
                error: error.message
            };
        }
    }

    // 관리자 계정 정보 출력
    async printAdminInfo() {
        const adminCheck = await this.checkAdminAccount();
        
        if (adminCheck.exists) {
            console.log('=== TAA ARCHIVES ADMIN ACCOUNT INFO ===');
            console.log('Agent ID:', adminCheck.adminData.agentId);
            console.log('Email:', adminCheck.adminData.email);
            console.log('Display Name:', adminCheck.adminData.displayName);
            console.log('Security Clearance:', adminCheck.adminData.securityClearance);
            console.log('Role:', adminCheck.adminData.role);
            console.log('UID:', adminCheck.adminData.uid);
            console.log('========================================');
        } else {
            console.log('TAA Archives: No admin account found');
        }
    }
}

// 전역 인스턴스 생성
const adminSetup = new AdminSetup();
window.adminSetup = adminSetup;

// 브라우저 콘솔에서 사용할 수 있는 전역 함수들
window.createAdminAccount = () => adminSetup.createAdminAccount();
window.checkAdminAccount = () => adminSetup.checkAdminAccount();
window.printAdminInfo = () => adminSetup.printAdminInfo();

// 페이지 로드 시 관리자 계정 확인
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase 초기화 대기
    setTimeout(async () => {
        if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
            console.log('TAA Archives: Checking admin account...');
            await adminSetup.printAdminInfo();
        }
    }, 2000);
});

console.log('TAA Archives: Admin setup utility initialized');
console.log('Available commands:');
console.log('- createAdminAccount() : 관리자 계정 생성');
console.log('- checkAdminAccount() : 관리자 계정 확인');
console.log('- printAdminInfo() : 관리자 계정 정보 출력'); 