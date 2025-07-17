// Notification System
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // 알림 컨테이너 생성
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        // 사용자 프로필 관련 알림은 표시하지 않음
        if (message.includes('사용자 프로필') || message.includes('프로필')) {
            return null;
        }
        
        // 중복 알림 방지 (같은 메시지가 3초 내에 있으면 무시)
        const now = Date.now();
        const recentNotification = this.notifications.find(n => 
            n.message === message && 
            n.type === type && 
            (now - n.timestamp.getTime()) < 3000
        );
        
        if (recentNotification) {
            return recentNotification.id;
        }
        
        const notification = {
            id: Date.now() + Math.random(),
            message: message,
            type: type,
            timestamp: new Date()
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // 자동 제거
        setTimeout(() => {
            this.remove(notification.id);
        }, duration);

        return notification.id;
    }

    renderNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.id = notification.id;
        
        element.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${notification.message}</span>
                <button class="notification-close" onclick="notificationSystem.remove(${notification.id})">×</button>
            </div>
            <div class="notification-progress"></div>
        `;

        this.container.appendChild(element);

        // 애니메이션 효과
        setTimeout(() => {
            element.classList.add('show');
        }, 100);

        // 프로그레스 바 애니메이션
        const progress = element.querySelector('.notification-progress');
        progress.style.transition = 'width 5s linear';
        setTimeout(() => {
            progress.style.width = '0%';
        }, 100);
    }

    remove(id) {
        const element = this.container.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                element.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    // 타입별 알림 메서드
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// 전역 인스턴스 생성
const notificationSystem = new NotificationSystem();

// 전역 함수로 노출
function showNotification(message, type = 'info', duration = 5000) {
    return notificationSystem.show(message, type, duration);
}

// 전역 에러 핸들러
let lastErrorTime = 0;
const ERROR_COOLDOWN = 3000; // 3초 쿨다운

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // 중복 에러 방지 (3초 내 같은 에러는 무시)
    const now = Date.now();
    if (now - lastErrorTime < ERROR_COOLDOWN) {
        return;
    }
    lastErrorTime = now;
    
    // 무시할 에러들 (일반적인 개발 중 에러들)
    if (event.error && event.error.message) {
        const errorMsg = event.error.message.toLowerCase();
        
        // 개발 중 발생하는 일반적인 에러들은 무시
        if (errorMsg.includes('script error') ||
            errorMsg.includes('syntax error') ||
            errorMsg.includes('unexpected token') ||
            errorMsg.includes('cannot read property') ||
            errorMsg.includes('is not defined') ||
            errorMsg.includes('is not a function') ||
            errorMsg.includes('firebase') ||  // Firebase 관련 에러는 개발 중 무시
            errorMsg.includes('auth') ||      // Auth 관련 에러는 개발 중 무시
            errorMsg.includes('database')) {  // Database 관련 에러는 개발 중 무시
            return;
        }
    }
    
    // 실제 중요한 에러만 사용자에게 표시
    let errorMessage = null;
    
    if (event.error && event.error.message) {
        const errorMsg = event.error.message.toLowerCase();
        
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
        } else if (errorMsg.includes('permission') || errorMsg.includes('access')) {
            errorMessage = '접근 권한이 없습니다.';
        }
    }
    
    // 중요한 에러만 표시
    if (errorMessage) {
        showNotification(errorMessage, 'error');
    }
});

// 네트워크 상태 모니터링 (중복 방지)
let lastNetworkStatus = navigator.onLine;
window.addEventListener('online', () => {
    if (!lastNetworkStatus) {
        showNotification('인터넷 연결이 복구되었습니다.', 'success');
        lastNetworkStatus = true;
    }
});

window.addEventListener('offline', () => {
    if (lastNetworkStatus) {
        showNotification('인터넷 연결이 끊어졌습니다.', 'warning');
        lastNetworkStatus = false;
    }
});

// 재시도 로직을 위한 유틸리티 함수
window.retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // 지수 백오프
            const waitTime = delay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}; 