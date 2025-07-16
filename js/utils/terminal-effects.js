// TAA Archives - Terminal Effects
// 터미널 특유의 시각적 효과 및 애니메이션

class TerminalEffects {
    constructor() {
        this.audioEnabled = true;
        this.initAudio();
    }

    // 오디오 초기화
    initAudio() {
        this.keyboardSound = document.getElementById('keyboard-sound');
        this.fanSound = document.getElementById('fan-sound');
        
        // 사용자 상호작용 후 오디오 활성화
        document.addEventListener('click', () => {
            if (this.fanSound) {
                this.fanSound.volume = 0.1;
                this.fanSound.play().catch(e => {
                    // 오디오 자동재생 차단 시 조용히 처리
                });
            }
        }, { once: true });
    }

    // 키보드 사운드 재생
    playKeyboardSound() {
        if (this.audioEnabled && this.keyboardSound) {
            this.keyboardSound.currentTime = 0;
            this.keyboardSound.volume = 0.3;
            this.keyboardSound.play().catch(e => {
                // 오디오 재생 실패 시 조용히 처리 (파일이 없거나 브라우저 정책 때문)
            });
        }
    }

    // 팬 소음 재생/정지
    toggleFanSound(play = true) {
        if (this.fanSound) {
            if (play) {
                this.fanSound.volume = 0.05;
                this.fanSound.play().catch(e => {
                    // 오디오 재생 실패 시 조용히 처리 (파일이 없거나 브라우저 정책 때문)
                });
            } else {
                this.fanSound.pause();
            }
        }
    }

    // 타이핑 효과
    typeText(element, text, speed = 50, callback = null) {
        let index = 0;
        element.textContent = '';
        
        const typeChar = () => {
            if (index < text.length) {
                element.textContent += text[index];
                this.playKeyboardSound();
                index++;
                setTimeout(typeChar, speed);
            } else {
                if (callback) callback();
            }
        };
        
        typeChar();
    }

    // 부팅 시퀀스 텍스트
    getBootSequence() {
        return [
            "INITIALIZING TAA ARCHIVES...",
            "LOADING SECURITY PROTOCOLS...",
            "ESTABLISHING SECURE CONNECTION...",
            "VERIFYING USER CREDENTIALS...",
            "ACCESSING CLASSIFIED DATABASE...",
            "LOADING ENCRYPTION MODULES...",
            "SYSTEM STATUS: OPERATIONAL",
            "WELCOME, AGENT.",
            "TAA ARCHIVES v1.0 READY FOR ACCESS."
        ];
    }

    // 부팅 시퀀스 실행
    async runBootSequence() {
        const bootText = document.getElementById('boot-text');
        const bootSequence = this.getBootSequence();
        
        for (let i = 0; i < bootSequence.length; i++) {
            await new Promise(resolve => {
                this.typeText(bootText, bootSequence[i], 80, () => {
                    setTimeout(() => {
                        bootText.textContent += '\n';
                        resolve();
                    }, 500);
                });
            });
        }
        
        // 부팅 완료 후 로그인 화면으로 전환
        setTimeout(() => {
            this.hideBootScreen();
            this.showLoginScreen();
        }, 2000);
    }

    // 부팅 화면 숨기기
    hideBootScreen() {
        const bootScreen = document.getElementById('boot-sequence');
        bootScreen.style.opacity = '0';
        setTimeout(() => {
            bootScreen.classList.add('hidden');
        }, 1000);
    }

    // 로그인 화면 표시
    showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        loginScreen.classList.remove('hidden');
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.opacity = '1';
        }, 100);
    }

    // 메인 앱 표시
    showMainApp() {
        const mainApp = document.getElementById('main-app');
        const loginScreen = document.getElementById('login-screen');
        
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
            mainApp.style.opacity = '0';
            setTimeout(() => {
                mainApp.style.opacity = '1';
                this.toggleFanSound(true);
            }, 100);
        }, 500);
    }

    // 글로우 효과
    addGlowEffect(element, color = '#FFBF00') {
        element.classList.add('glow-effect');
        element.style.setProperty('--glow-color', color);
    }

    // 노이즈 효과
    addNoiseEffect(element) {
        element.classList.add('noise-effect');
    }

    // 스캔 라인 효과
    addScanlines(element) {
        element.classList.add('scanlines');
    }

    // CRT 곡률 효과
    addCRTCurve(element) {
        element.classList.add('crt-curve');
    }

    // 진동 효과
    vibrate(element) {
        element.classList.add('vibrate');
        setTimeout(() => {
            element.classList.remove('vibrate');
        }, 300);
    }

    // 경고 깜빡임
    warningBlink(element) {
        element.classList.add('warning-blink');
        setTimeout(() => {
            element.classList.remove('warning-blink');
        }, 1500);
    }

    // 성공 펄스
    successPulse(element) {
        element.classList.add('success-pulse');
        setTimeout(() => {
            element.classList.remove('success-pulse');
        }, 500);
    }

    // 페이드 인
    fadeIn(element) {
        element.classList.add('fade-in');
    }

    // 슬라이드 인
    slideInLeft(element) {
        element.classList.add('slide-in-left');
    }

    slideInRight(element) {
        element.classList.add('slide-in-right');
    }

    // 로딩 애니메이션
    showLoading(element, text = 'LOADING') {
        element.textContent = text;
        element.classList.add('loading-dots');
    }

    hideLoading(element) {
        element.classList.remove('loading-dots');
    }

    // 터미널 커서 생성
    createCursor() {
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        return cursor;
    }

    // 텍스트에 커서 추가
    addCursorToText(element) {
        const cursor = this.createCursor();
        element.appendChild(cursor);
    }

    // 커서 제거
    removeCursor(element) {
        const cursor = element.querySelector('.terminal-cursor');
        if (cursor) {
            cursor.remove();
        }
    }

    // 입력 필드 포커스 효과
    addInputFocusEffect(input) {
        input.addEventListener('focus', () => {
            this.addGlowEffect(input, '#FFD700');
        });
        
        input.addEventListener('blur', () => {
            input.classList.remove('glow-effect');
        });
    }

    // 버튼 클릭 효과
    addButtonClickEffect(button) {
        button.addEventListener('click', () => {
            this.playKeyboardSound();
            this.vibrate(button);
        });
    }

    // 링크 호버 효과
    addLinkHoverEffect(link) {
        link.addEventListener('mouseenter', () => {
            this.addNoiseEffect(link);
        });
        
        link.addEventListener('mouseleave', () => {
            link.classList.remove('noise-effect');
        });
    }

    // 시간 표시 업데이트
    updateTimeDisplay() {
        const timeDisplay = document.getElementById('current-time');
        if (timeDisplay) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timeDisplay.textContent = timeString;
        }
    }

    // 시간 표시 시작
    startTimeDisplay() {
        this.updateTimeDisplay();
        setInterval(() => {
            this.updateTimeDisplay();
        }, 1000);
    }

    // 시스템 메시지 표시
    showSystemMessage(message, type = 'info', duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `system-message ${type}`;
        messageDiv.textContent = message;
        
        // 스타일 적용
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(145deg, #000033, #191970);
            border: 1px solid #FFBF00;
            border-radius: 5px;
            padding: 15px 20px;
            color: #FFBF00;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 0 20px rgba(255, 191, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        // 애니메이션
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, duration);
    }

    // 에러 메시지
    showError(message) {
        this.showSystemMessage(message, 'error', 5000);
    }

    // 성공 메시지
    showSuccess(message) {
        this.showSystemMessage(message, 'success', 3000);
    }

    // 경고 메시지
    showWarning(message) {
        this.showSystemMessage(message, 'warning', 4000);
    }

    // 정보 메시지
    showInfo(message) {
        this.showSystemMessage(message, 'info', 3000);
    }

    // 화면 전환 효과
    transitionToView(fromView, toView) {
        fromView.style.opacity = '0';
        setTimeout(() => {
            fromView.classList.remove('active');
            toView.classList.add('active');
            toView.style.opacity = '0';
            setTimeout(() => {
                toView.style.opacity = '1';
            }, 100);
        }, 300);
    }

    // 랜덤 지연
    randomDelay(min = 100, max = 500) {
        return Math.random() * (max - min) + min;
    }

    // 텍스트 스크램블 효과
    scrambleText(element, finalText, duration = 1000) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        const originalText = element.textContent;
        const steps = 20;
        const stepDuration = duration / steps;
        let currentStep = 0;
        
        const scramble = () => {
            if (currentStep < steps) {
                element.textContent = finalText.split('').map((char, index) => {
                    if (index < currentStep) {
                        return finalText[index];
                    } else {
                        return chars[Math.floor(Math.random() * chars.length)];
                    }
                }).join('');
                currentStep++;
                setTimeout(scramble, stepDuration);
            } else {
                element.textContent = finalText;
            }
        };
        
        scramble();
    }
}

// 전역 인스턴스 생성
window.terminalEffects = new TerminalEffects();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 시간 표시 시작
    window.terminalEffects.startTimeDisplay();
    
    // 모든 입력 필드에 포커스 효과 추가
    document.querySelectorAll('.terminal-input').forEach(input => {
        window.terminalEffects.addInputFocusEffect(input);
    });
    
    // 모든 버튼에 클릭 효과 추가
    document.querySelectorAll('.terminal-btn').forEach(button => {
        window.terminalEffects.addButtonClickEffect(button);
    });
    
    // 모든 링크에 호버 효과 추가
    document.querySelectorAll('.wiki-link').forEach(link => {
        window.terminalEffects.addLinkHoverEffect(link);
    });
    
    console.log('TAA Archives: Terminal effects initialized');
}); 