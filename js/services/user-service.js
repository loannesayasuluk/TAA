// User Service - 사용자 관리 및 중복 확인
class UserService {
    constructor() {
        this.usersCollection = 'users';
        this.agentIdsCollection = 'agent_ids'; // Agent ID 중복 확인용
    }

    // Agent ID 중복 확인 (실제 등록 로직과 동일하게)
    async checkAgentIdAvailability(agentId) {
        try {
            // Agent ID 컬렉션에서 확인
            const agentIdDoc = await db.collection(this.agentIdsCollection).doc(agentId).get();
            
            if (agentIdDoc.exists) {
                return {
                    available: false,
                    message: '이미 사용 중인 Agent ID입니다.'
                };
            }

            // 사용자 컬렉션에서도 확인 (이중 체크)
            const userSnapshot = await db.collection(this.usersCollection)
                .where('agentId', '==', agentId)
                .limit(1)
                .get();

            if (!userSnapshot.empty) {
                return {
                    available: false,
                    message: '이미 사용 중인 Agent ID입니다.'
                };
            }

            // 추가 검증: Agent ID 형식 확인
            if (!agentId || agentId.trim().length < 3) {
                return {
                    available: false,
                    message: 'Agent ID는 최소 3자 이상이어야 합니다.'
                };
            }

            // 특수문자 제한 (영문, 숫자, 언더스코어만 허용)
            const agentIdRegex = /^[a-zA-Z0-9_]+$/;
            if (!agentIdRegex.test(agentId)) {
                return {
                    available: false,
                    message: 'Agent ID는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.'
                };
            }

            return {
                available: true,
                message: '사용 가능한 Agent ID입니다.'
            };
        } catch (error) {
            console.error('Agent ID 중복 확인 오류:', error);
            return {
                available: false,
                message: '중복 확인 중 오류가 발생했습니다.'
            };
        }
    }

    // 이메일 중복 확인 (Firebase Auth 직접 확인)
    async checkEmailAvailability(email) {
        try {
            // Firebase Auth에서 이메일 중복 확인
            // 임시로 사용자를 생성해보고, 성공하면 즉시 삭제
            const tempPassword = 'tempPassword123!@#';
            
            try {
                // 임시 사용자 생성 시도
                const userCredential = await auth.createUserWithEmailAndPassword(email, tempPassword);
                
                // 성공하면 즉시 삭제 (이메일이 사용 가능함)
                await userCredential.user.delete();
                
                return {
                    available: true,
                    message: '사용 가능한 이메일입니다.'
                };
            } catch (authError) {
                // Firebase Auth 오류 코드 확인
                if (authError.code === 'auth/email-already-in-use') {
                    return {
                        available: false,
                        message: '이미 사용 중인 이메일입니다.'
                    };
                } else if (authError.code === 'auth/invalid-email') {
                    return {
                        available: false,
                        message: '올바르지 않은 이메일 형식입니다.'
                    };
                } else {
                    // 기타 오류는 사용 가능한 것으로 처리 (네트워크 오류 등)
                    console.warn('Firebase Auth 중복 확인 중 오류:', authError.code);
                    return {
                        available: true,
                        message: '사용 가능한 이메일입니다.'
                    };
                }
            }
        } catch (error) {
            console.error('이메일 중복 확인 오류:', error);
            return {
                available: false,
                message: '중복 확인 중 오류가 발생했습니다.'
            };
        }
    }

    // 사용자 등록
    async registerUser(userData) {
        try {
            const { agentId, email, password, clearance } = userData;

            // Firebase Auth로 사용자 생성 (이메일을 로그인용으로 사용)
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);

            // 사용자 프로필 데이터
            const profileData = {
                uid: userCredential.user.uid,
                agentId: agentId,
                email: email,
                displayName: agentId,
                securityClearance: clearance,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                createdBy: 'self'
            };

            // 사용자 프로필 저장
            await db.collection(this.usersCollection).doc(userCredential.user.uid).set(profileData);

            // Agent ID 중복 방지를 위한 레코드 생성
            await db.collection(this.agentIdsCollection).doc(agentId).set({
                uid: userCredential.user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                user: userCredential.user,
                message: '사용자 등록이 완료되었습니다.'
            };
        } catch (error) {
            console.error('사용자 등록 오류:', error);
            throw error;
        }
    }

    // Agent ID로 사용자 찾기
    async getUserByAgentId(agentId) {
        try {
            const userSnapshot = await db.collection(this.usersCollection)
                .where('agentId', '==', agentId)
                .limit(1)
                .get();

            if (userSnapshot.empty) {
                return null;
            }

            const userDoc = userSnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        } catch (error) {
            console.error('Agent ID로 사용자 찾기 오류:', error);
            return null;
        }
    }

    // 이메일로 사용자 찾기
    async getUserByEmail(email) {
        try {
            const userSnapshot = await db.collection(this.usersCollection)
                .where('email', '==', email)
                .limit(1)
                .get();

            if (userSnapshot.empty) {
                return null;
            }

            const userDoc = userSnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        } catch (error) {
            console.error('이메일로 사용자 찾기 오류:', error);
            return null;
        }
    }

    // Agent ID 또는 이메일로 로그인
    async loginWithAgentIdOrEmail(identifier, password) {
        try {
            let user = null;
            let loginMethod = '';

            // 먼저 Agent ID로 사용자 찾기
            user = await this.getUserByAgentId(identifier);
            if (user) {
                loginMethod = 'agentId';
            }

            // Agent ID로 찾지 못했다면 이메일로 찾기
            if (!user) {
                user = await this.getUserByEmail(identifier);
                if (user) {
                    loginMethod = 'email';
                }
            }

            if (!user) {
                throw new Error('등록되지 않은 Agent ID 또는 이메일입니다.');
            }

            // 이메일로 Firebase Auth 로그인
            const userCredential = await auth.signInWithEmailAndPassword(user.email, password);

            // 마지막 로그인 시간 업데이트
            await db.collection(this.usersCollection).doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginMethod: loginMethod
            });

            return {
                success: true,
                user: userCredential.user,
                userData: user,
                loginMethod: loginMethod
            };
        } catch (error) {
            console.error('로그인 오류:', error);
            throw error;
        }
    }

    // 기존 Agent ID 로그인 (하위 호환성)
    async loginWithAgentId(agentId, password) {
        return this.loginWithAgentIdOrEmail(agentId, password);
    }

    // 사용자 프로필 업데이트
    async updateUserProfile(uid, updateData) {
        try {
            await db.collection(this.usersCollection).doc(uid).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('프로필 업데이트 오류:', error);
            throw error;
        }
    }

    // 사용자 비활성화
    async deactivateUser(uid) {
        try {
            await db.collection(this.usersCollection).doc(uid).update({
                isActive: false,
                deactivatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('사용자 비활성화 오류:', error);
            throw error;
        }
    }

    // 모든 사용자 목록 가져오기 (관리자용)
    async getAllUsers() {
        try {
            const snapshot = await db.collection(this.usersCollection).get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('사용자 목록 가져오기 오류:', error);
            throw error;
        }
    }

    // 기존 계정 마이그레이션 (Agent ID가 없는 계정에 Agent ID 생성)
    async migrateExistingAccounts() {
        try {
            const snapshot = await db.collection(this.usersCollection).get();
            let migratedCount = 0;

            for (const doc of snapshot.docs) {
                const userData = doc.data();
                
                // Agent ID가 없는 계정만 마이그레이션
                if (!userData.agentId && userData.email) {
                    // 이메일에서 Agent ID 생성 (이메일 앞부분 사용)
                    const emailPrefix = userData.email.split('@')[0];
                    let agentId = emailPrefix;
                    let counter = 1;

                    // 중복되지 않는 Agent ID 생성
                    while (true) {
                        const existingUser = await this.getUserByAgentId(agentId);
                        if (!existingUser) {
                            break;
                        }
                        agentId = `${emailPrefix}${counter}`;
                        counter++;
                    }

                    // 사용자 프로필 업데이트
                    await db.collection(this.usersCollection).doc(doc.id).update({
                        agentId: agentId,
                        displayName: agentId,
                        migratedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Agent ID 중복 방지 레코드 생성
                    await db.collection(this.agentIdsCollection).doc(agentId).set({
                        uid: doc.id,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        migrated: true
                    });

                    migratedCount++;
                    console.log(`마이그레이션 완료: ${userData.email} -> ${agentId}`);
                }
            }

            return {
                success: true,
                migratedCount: migratedCount,
                message: `${migratedCount}개의 계정이 마이그레이션되었습니다.`
            };
        } catch (error) {
            console.error('계정 마이그레이션 오류:', error);
            throw error;
        }
    }

    // 마이그레이션 상태 확인
    async checkMigrationStatus() {
        try {
            const snapshot = await db.collection(this.usersCollection).get();
            let totalUsers = 0;
            let usersWithAgentId = 0;
            let usersWithoutAgentId = 0;

            snapshot.docs.forEach(doc => {
                const userData = doc.data();
                totalUsers++;
                
                if (userData.agentId) {
                    usersWithAgentId++;
                } else {
                    usersWithoutAgentId++;
                }
            });

            return {
                totalUsers: totalUsers,
                usersWithAgentId: usersWithAgentId,
                usersWithoutAgentId: usersWithoutAgentId,
                migrationNeeded: usersWithoutAgentId > 0
            };
        } catch (error) {
            console.error('마이그레이션 상태 확인 오류:', error);
            throw error;
        }
    }
}

// 전역 인스턴스 생성
const userService = new UserService();

console.log('TAA Archives: User service initialized'); 