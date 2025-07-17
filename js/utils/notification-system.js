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
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // 사용자에게 친화적인 에러 메시지 표시
    let errorMessage = '시스템 오류가 발생했습니다.';
    
    if (event.error && event.error.message) {
        if (event.error.message.includes('network')) {
            errorMessage = '네트워크 연결을 확인해주세요.';
        } else if (event.error.message.includes('firebase')) {
            errorMessage = '데이터베이스 연결에 문제가 있습니다.';
        } else if (event.error.message.includes('auth')) {
            errorMessage = '인증에 문제가 있습니다. 다시 로그인해주세요.';
        }
    }
    
    showNotification(errorMessage, 'error');
});

// 네트워크 상태 모니터링
window.addEventListener('online', () => {
    showNotification('인터넷 연결이 복구되었습니다.', 'success');
});

window.addEventListener('offline', () => {
    showNotification('인터넷 연결이 끊어졌습니다.', 'warning');
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