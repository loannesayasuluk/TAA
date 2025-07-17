// TAA Archives - Ghost Terminals Component
// 유령 터미널 및 다른 요원 활동 시뮬레이션

class GhostTerminals {
    constructor() {
        this.terminals = [];
        this.isActive = false;
        this.activityFeed = [
            'Agent-007이 File #F-2259를 열람했습니다',
            'Agent-Smith가 #정보분석실에 새 글을 작성했습니다',
            'Agent-Johnson이 Surveillance Protocol을 업데이트했습니다',
            'Agent-Williams가 #기밀정보 채널에 접근했습니다',
            'Agent-Brown이 Field Report #R-4421을 제출했습니다',
            'Agent-Davis가 #임무보고서에 댓글을 남겼습니다',
            'Agent-Miller가 Intelligence Brief를 다운로드했습니다',
            'Agent-Wilson이 #기술지원에 질문을 올렸습니다',
            'Agent-Moore가 Evidence Package를 분석했습니다',
            'Agent-Taylor가 #에이전트교육 자료를 업로드했습니다',
            'Agent-Anderson이 Security Log를 검토했습니다',
            'Agent-Thomas가 #자유게시판에 토론을 시작했습니다',
            'Agent-Jackson이 Audio Recording을 처리했습니다',
            'Agent-White가 #기밀작전 채널에 참여했습니다',
            'Agent-Harris가 Database Records를 동기화했습니다'
        ];
        this.currentActivityIndex = 0;
        this.activityInterval = null;
        this.initGhostTerminals();
    }

    // 유령 터미널 초기화
    initGhostTerminals() {
        this.createTerminals();
        this.startAnimation();
    }

    // 터미널 생성
    createTerminals() {
        const ghostTerminalsContainer = document.getElementById('ghost-terminals');
        if (!ghostTerminalsContainer) return;

        // 기존 터미널 제거
        ghostTerminalsContainer.innerHTML = '';

        // 3개의 유령 터미널 생성
        for (let i = 0; i < 3; i++) {
            const terminal = this.createTerminalElement(i);
            ghostTerminalsContainer.appendChild(terminal);
            this.terminals.push(terminal);
        }
    }

    // 터미널 요소 생성
    createTerminalElement(index) {
        const terminal = document.createElement('div');
        terminal.className = 'ghost-terminal';
        terminal.id = `ghost-terminal-${index}`;
        
        const text = document.createElement('span');
        text.className = 'ghost-text';
        text.textContent = this.getRandomMessage();
        
        terminal.appendChild(text);
        
        // 각 터미널마다 다른 애니메이션 지연
        terminal.style.animationDelay = `${index * 2}s`;
        
        return terminal;
    }

    // 실시간 활동 메시지 가져오기
    getActivityMessage() {
        const message = this.activityFeed[this.currentActivityIndex];
        this.currentActivityIndex = (this.currentActivityIndex + 1) % this.activityFeed.length;
        return message;
    }

    // 랜덤 메시지 가져오기 (기존 호환성)
    getRandomMessage() {
        return this.getActivityMessage();
    }

    // 애니메이션 시작
    startAnimation() {
        this.isActive = true;
        this.startActivityFeed();
        this.animateTerminals();
    }

    // 실시간 활동 피드 시작
    startActivityFeed() {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
        }
        
        // 3-5초마다 새로운 활동 메시지 추가
        this.activityInterval = setInterval(() => {
            if (this.isActive) {
                this.addNewActivity();
            }
        }, 3000 + Math.random() * 2000);
    }

    // 새로운 활동 추가
    addNewActivity() {
        const newActivity = this.getActivityMessage();
        
        // 활동 피드에 새 메시지 추가 (실제로는 API에서 가져옴)
        this.activityFeed.push(newActivity);
        
        // 최대 20개까지만 유지
        if (this.activityFeed.length > 20) {
            this.activityFeed.shift();
        }
        
        // 터미널 업데이트
        this.updateRandomTerminal(newActivity);
    }

    // 랜덤 터미널 업데이트
    updateRandomTerminal(message) {
        if (this.terminals.length === 0) return;
        
        const randomTerminal = this.terminals[Math.floor(Math.random() * this.terminals.length)];
        this.updateTerminalMessage(randomTerminal, message);
    }

    // 터미널 애니메이션
    animateTerminals() {
        if (!this.isActive) return;

        this.terminals.forEach((terminal, index) => {
            setTimeout(() => {
                this.updateTerminalMessage(terminal);
            }, (index * 3000) + Math.random() * 2000);
        });

        // 다음 애니메이션 사이클
        setTimeout(() => {
            if (this.isActive) {
                this.animateTerminals();
            }
        }, 8000 + Math.random() * 4000);
    }

    // 터미널 메시지 업데이트
    updateTerminalMessage(terminal, customMessage = null) {
        const textElement = terminal.querySelector('.ghost-text');
        if (!textElement) return;

        // 페이드 아웃
        terminal.style.opacity = '0';
        
        setTimeout(() => {
            // 새 메시지 설정
            const message = customMessage || this.getRandomMessage();
            textElement.textContent = message;
            
            // 페이드 인
            terminal.style.opacity = '1';
            
            // 긴급 메시지 효과 (10% 확률)
            if (Math.random() < 0.1) {
                this.showUrgentMessage(terminal);
            }
        }, 500);
    }

    // 긴급 메시지 표시
    showUrgentMessage(terminal) {
        const urgentMessages = [
            "URGENT: Security Breach Detected",
            "ALERT: Unauthorized Access Attempt",
            "CRITICAL: System Intrusion Detected",
            "EMERGENCY: Data Breach in Progress",
            "WARNING: Suspicious Activity Detected"
        ];

        const textElement = terminal.querySelector('.ghost-text');
        const originalText = textElement.textContent;
        const urgentText = urgentMessages[Math.floor(Math.random() * urgentMessages.length)];

        // 긴급 메시지로 변경
        textElement.textContent = urgentText;
        terminal.style.borderColor = '#FF6B6B';
        terminal.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        terminal.style.animation = 'urgentBlink 0.5s ease-in-out 6';

        // 3초 후 원래 메시지로 복원
        setTimeout(() => {
            textElement.textContent = originalText;
            terminal.style.borderColor = '';
            terminal.style.backgroundColor = '';
            terminal.style.animation = '';
        }, 3000);
    }

    // 시스템 상태 메시지
    showSystemStatus() {
        const statusMessages = [
            "SYSTEM: All agents online",
            "STATUS: Database synchronized",
            "MONITOR: Network traffic normal",
            "SECURITY: Firewall active",
            "BACKUP: Data integrity verified"
        ];

        this.terminals.forEach((terminal, index) => {
            setTimeout(() => {
                const textElement = terminal.querySelector('.ghost-text');
                textElement.textContent = statusMessages[index % statusMessages.length];
                terminal.style.borderColor = '#4ECDC4';
                terminal.style.backgroundColor = 'rgba(78, 205, 196, 0.1)';
            }, index * 1000);
        });

        // 5초 후 원래 상태로 복원
        setTimeout(() => {
            this.terminals.forEach(terminal => {
                terminal.style.borderColor = '';
                terminal.style.backgroundColor = '';
            });
        }, 5000);
    }

    // 파일 접근 시뮬레이션
    simulateFileAccess(fileTitle) {
        const accessMessages = [
            `ACCESSING: ${fileTitle}`,
            `READING: ${fileTitle}`,
            `ANALYZING: ${fileTitle}`,
            `PROCESSING: ${fileTitle}`,
            `UPDATING: ${fileTitle}`
        ];

        const randomTerminal = this.terminals[Math.floor(Math.random() * this.terminals.length)];
        const textElement = randomTerminal.querySelector('.ghost-text');
        const originalText = textElement.textContent;
        const accessText = accessMessages[Math.floor(Math.random() * accessMessages.length)];

        // 접근 메시지 표시
        textElement.textContent = accessText;
        randomTerminal.style.borderColor = '#FFD93D';
        randomTerminal.style.backgroundColor = 'rgba(255, 217, 61, 0.1)';

        // 2초 후 원래 메시지로 복원
        setTimeout(() => {
            textElement.textContent = originalText;
            randomTerminal.style.borderColor = '';
            randomTerminal.style.backgroundColor = '';
        }, 2000);
    }

    // 에러 메시지 시뮬레이션
    simulateError() {
        const errorMessages = [
            "ERROR: Connection timeout",
            "FAILED: Authentication denied",
            "ERROR: Database connection lost",
            "FAILED: File access denied",
            "ERROR: Network unreachable"
        ];

        const randomTerminal = this.terminals[Math.floor(Math.random() * this.terminals.length)];
        const textElement = randomTerminal.querySelector('.ghost-text');
        const originalText = textElement.textContent;
        const errorText = errorMessages[Math.floor(Math.random() * errorMessages.length)];

        // 에러 메시지 표시
        textElement.textContent = errorText;
        randomTerminal.style.borderColor = '#FF6B6B';
        randomTerminal.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        randomTerminal.style.animation = 'errorBlink 0.3s ease-in-out 4';

        // 3초 후 원래 메시지로 복원
        setTimeout(() => {
            textElement.textContent = originalText;
            randomTerminal.style.borderColor = '';
            randomTerminal.style.backgroundColor = '';
            randomTerminal.style.animation = '';
        }, 3000);
    }

    // 성공 메시지 시뮬레이션
    simulateSuccess() {
        const successMessages = [
            "SUCCESS: Operation completed",
            "COMPLETE: Data uploaded",
            "SUCCESS: File saved",
            "COMPLETE: Analysis finished",
            "SUCCESS: Report generated"
        ];

        const randomTerminal = this.terminals[Math.floor(Math.random() * this.terminals.length)];
        const textElement = randomTerminal.querySelector('.ghost-text');
        const originalText = textElement.textContent;
        const successText = successMessages[Math.floor(Math.random() * successMessages.length)];

        // 성공 메시지 표시
        textElement.textContent = successText;
        randomTerminal.style.borderColor = '#4ECDC4';
        randomTerminal.style.backgroundColor = 'rgba(78, 205, 196, 0.1)';
        randomTerminal.style.animation = 'successPulse 0.5s ease-in-out 2';

        // 2초 후 원래 메시지로 복원
        setTimeout(() => {
            textElement.textContent = originalText;
            randomTerminal.style.borderColor = '';
            randomTerminal.style.backgroundColor = '';
            randomTerminal.style.animation = '';
        }, 2000);
    }

    // 터미널 수 변경
    setTerminalCount(count) {
        const ghostTerminalsContainer = document.getElementById('ghost-terminals');
        if (!ghostTerminalsContainer) return;

        // 기존 터미널 제거
        ghostTerminalsContainer.innerHTML = '';
        this.terminals = [];

        // 새 터미널 생성
        for (let i = 0; i < count; i++) {
            const terminal = this.createTerminalElement(i);
            ghostTerminalsContainer.appendChild(terminal);
            this.terminals.push(terminal);
        }
    }

    // 애니메이션 속도 조절
    setAnimationSpeed(speed) {
        this.terminals.forEach(terminal => {
            terminal.style.animationDuration = `${speed}s`;
        });
    }

    // 애니메이션 일시정지
    pauseAnimation() {
        this.isActive = false;
        this.terminals.forEach(terminal => {
            terminal.style.animationPlayState = 'paused';
        });
    }

    // 애니메이션 재개
    resumeAnimation() {
        this.isActive = true;
        this.terminals.forEach(terminal => {
            terminal.style.animationPlayState = 'running';
        });
        this.animateTerminals();
    }

    // 애니메이션 중지
    stopAnimation() {
        this.isActive = false;
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
            this.activityInterval = null;
        }
        this.terminals.forEach(terminal => {
            terminal.style.animation = 'none';
        });
    }

    // 커스텀 메시지 추가
    addCustomMessage(message) {
        this.terminalMessages.push(message);
    }

    // 메시지 목록 가져오기
    getMessages() {
        return [...this.terminalMessages];
    }

    // 터미널 상태 가져오기
    getStatus() {
        return {
            isActive: this.isActive,
            terminalCount: this.terminals.length,
            currentMessages: this.terminals.map(terminal => {
                const textElement = terminal.querySelector('.ghost-text');
                return textElement ? textElement.textContent : '';
            })
        };
    }

    // 터미널 클릭 이벤트
    setupClickEvents() {
        this.terminals.forEach((terminal, index) => {
            terminal.addEventListener('click', () => {
                this.onTerminalClick(index);
            });
        });
    }

    // 터미널 클릭 핸들러
    onTerminalClick(index) {
        const terminal = this.terminals[index];
        const textElement = terminal.querySelector('.ghost-text');
        
        // 클릭 효과
        terminal.style.transform = 'scale(1.05)';
        terminal.style.boxShadow = '0 0 20px rgba(255, 191, 0, 0.5)';
        
        setTimeout(() => {
            terminal.style.transform = '';
            terminal.style.boxShadow = '';
        }, 200);

        // 클릭 시 메시지 변경
        textElement.textContent = this.getRandomMessage();
        
        // 클릭 이벤트 로그
        console.log(`Ghost terminal ${index} clicked: ${textElement.textContent}`);
    }

    // 터미널 정리
    cleanup() {
        this.isActive = false;
        this.terminals = [];
    }
}

// 전역 인스턴스 생성
window.ghostTerminals = new GhostTerminals();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 클릭 이벤트 설정
    setTimeout(() => {
        ghostTerminals.setupClickEvents();
    }, 1000);
});

console.log('TAA Archives: Ghost terminals component initialized'); 