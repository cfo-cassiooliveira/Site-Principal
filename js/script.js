// ===== CONFIGURAÇÕES GERAIS =====
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
    initMusicMatrixBackground();
});

function initializeWebsite() {
    // Inicializar todos os componentes
    initNavigation();
    initParticles();
    initScrollAnimations();
    initTypingEffect();
    initSkillBars();
    initMusicPlayer();
    initContactForm();
    initFloatingElements();
    initThemeToggle();
    initAmbientMusic();
}

// ===== NAVEGAÇÃO =====
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navOverlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll da navegação
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.9)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Menu hambúrguer
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (navOverlay) {
                navOverlay.classList.toggle('active');
            }
        });
    }
    
    // Fechar menu ao clicar no overlay
    if (navOverlay) {
        navOverlay.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            navOverlay.classList.remove('active');
        });
    }
    
    // Fechar menu com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            if (navOverlay) {
                navOverlay.classList.remove('active');
            }
        }
    });

    // Smooth scrolling e link ativo
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Verificar se é um link interno (começa com #) ou externo
            if (href.startsWith('#')) {
                // É um link interno - aplicar smooth scrolling
                e.preventDefault();
                const targetSection = document.querySelector(href);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Fechar menu mobile
                    if (navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        hamburger.classList.remove('active');
                        if (navOverlay) {
                            navOverlay.classList.remove('active');
                        }
                    }
                    
                    // Atualizar link ativo
                    updateActiveNavLink(href);
                }
            } else {
                // É um link externo - permitir navegação normal
                // Fechar menu mobile se aberto
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                    if (navOverlay) {
                        navOverlay.classList.remove('active');
                    }
                }
            }
        });
    });

    // Atualizar link ativo no scroll
    window.addEventListener('scroll', updateActiveNavLinkOnScroll);
}

function updateActiveNavLink(targetId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });
}

function updateActiveNavLinkOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            updateActiveNavLink(`#${sectionId}`);
        }
    });
}

// ===== PARTÍCULAS ANIMADAS =====
function initParticles() {
    // Verificar se é dispositivo móvel antes de inicializar partículas
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile && isTouchDevice) {
        console.log('Partículas desabilitadas para mobile');
        return;
    }
    
    const particlesContainer = document.getElementById('particles-container');
    if (!particlesContainer) return;
    
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 1}px;
        height: ${Math.random() * 4 + 1}px;
        background: ${getRandomColor()};
        border-radius: 50%;
        pointer-events: none;
        opacity: ${Math.random() * 0.8 + 0.2};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: particleFloat ${Math.random() * 20 + 10}s linear infinite;
    `;
    
    container.appendChild(particle);
    
    // Remove e recria a partícula após a animação
    setTimeout(() => {
        if (particle.parentNode) {
            particle.remove();
            createParticle(container);
        }
    }, (Math.random() * 20 + 10) * 1000);
}

function getRandomColor() {
    const colors = ['#00d4ff', '#ff6b6b', '#4ecdc4', '#ffffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Adicionar keyframes dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0% {
            transform: translateY(100vh) translateX(0px) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) translateX(${Math.random() * 200 - 100}px) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== ANIMAÇÕES DE SCROLL =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Animações específicas para skills
                if (entry.target.classList.contains('skill-category')) {
                    animateSkillBars(entry.target);
                }
                
                // Animação de contador para música stats
                if (entry.target.classList.contains('stat-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observar elementos para animação
    const elementsToAnimate = document.querySelectorAll(`
        .about-card,
        .skill-category,
        .project-card,
        .stat-item,
        .contact-item,
        .section-header
    `);

    elementsToAnimate.forEach(el => observer.observe(el));
}

// ===== EFEITO DE DIGITAÇÃO =====
function initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;

    const texts = [
        'Olá, eu sou',
        'Hello, I am',
        'Hola, soy',
        '你好，我是'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeText() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        if (!isDeleting && charIndex === currentText.length) {
            setTimeout(() => isDeleting = true, 2000);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
        }

        const speed = isDeleting ? 50 : 100;
        setTimeout(typeText, speed);
    }

    typeText();
}

// ===== BARRAS DE HABILIDADE =====
function initSkillBars() {
    // As barras serão animadas quando entrarem na tela via intersection observer
}

function animateSkillBars(skillCategory) {
    const skillBars = skillCategory.querySelectorAll('.skill-progress');
    
    skillBars.forEach((bar, index) => {
        setTimeout(() => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width;
        }, index * 200);
    });
}

// ===== PLAYER DE MÚSICA =====
function initMusicPlayer() {
    const playButton = document.querySelector('.btn-play');
    const prevButton = document.querySelector('.btn-prev');
    const nextButton = document.querySelector('.btn-next');
    const progressBar = document.querySelector('.progress');
    const vinylRecord = document.querySelector('.vinyl-record');
    const trackTitle = document.querySelector('.track-title');
    const trackArtist = document.querySelector('.track-artist');

    let isPlaying = false;
    let currentTrack = 0;
    
    const tracks = [
        { title: 'Digital Dreams', artist: 'by Cássio Oliveira' },
        { title: 'Code Symphony', artist: 'by Cássio Oliveira' },
        { title: 'Algorithmic Melody', artist: 'by Cássio Oliveira' },
        { title: 'Binary Beats', artist: 'by Cássio Oliveira' }
    ];

    if (playButton) {
        playButton.addEventListener('click', togglePlay);
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', previousTrack);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', nextTrack);
    }

    function togglePlay() {
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            playButton.innerHTML = '<i class="fas fa-pause"></i>';
            vinylRecord.style.animationPlayState = 'running';
            startProgressAnimation();
        } else {
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            vinylRecord.style.animationPlayState = 'paused';
            stopProgressAnimation();
        }
    }

    function previousTrack() {
        currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
        updateTrackInfo();
        resetProgress();
    }

    function nextTrack() {
        currentTrack = (currentTrack + 1) % tracks.length;
        updateTrackInfo();
        resetProgress();
    }

    function updateTrackInfo() {
        if (trackTitle && trackArtist) {
            trackTitle.textContent = tracks[currentTrack].title;
            trackArtist.textContent = tracks[currentTrack].artist;
        }
    }

    let progressInterval;

    function startProgressAnimation() {
        let width = 0;
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const intervalTime = isMobileDevice ? 200 : 100; // Menos frequente no mobile
        
        progressInterval = setInterval(() => {
            width += isMobileDevice ? 1 : 0.5; // Passos maiores no mobile
            if (progressBar) {
                progressBar.style.width = width + '%';
            }
            
            if (width >= 100) {
                nextTrack();
                width = 0;
            }
        }, intervalTime);
    }

    function stopProgressAnimation() {
        clearInterval(progressInterval);
    }

    function resetProgress() {
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        stopProgressAnimation();
        if (isPlaying) {
            startProgressAnimation();
        }
    }
}

// ===== CONTADOR ANIMADO =====
function animateCounter(statItem) {
    const numberElement = statItem.querySelector('.stat-number');
    if (!numberElement) return;

    const target = parseInt(numberElement.textContent);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        numberElement.textContent = Math.floor(current) + (numberElement.textContent.includes('+') ? '+' : '');
    }, 16);
}

// ===== ELEMENTOS FLUTUANTES =====
function initFloatingElements() {
    // Verificar se é dispositivo móvel antes de inicializar
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile && isTouchDevice) {
        console.log('Elementos flutuantes desabilitados para mobile');
        return;
    }
    
    console.log('Inicializando elementos flutuantes...');
    const floatingIcons = document.querySelectorAll('.floating-icon');
    console.log('Elementos flutuantes encontrados:', floatingIcons.length);
    
    floatingIcons.forEach(icon => {
        // Movimento suave baseado no mouse
        document.addEventListener('mousemove', (e) => {
            const speed = icon.dataset.speed || 1;
            const x = (e.clientX * speed) / 100;
            const y = (e.clientY * speed) / 100;
            
            icon.style.transform = `translate(${x}px, ${y}px)`;
        });
        
        // Efeito hover
        icon.addEventListener('mouseenter', () => {
            icon.style.transform += ' scale(1.2)';
            icon.style.color = getRandomColor();
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = icon.style.transform.replace(' scale(1.2)', '');
        });
    });
}

// ===== TOGGLE DE TEMA (EASTER EGG) =====
function initThemeToggle() {
    let clickCount = 0;
    const logo = document.querySelector('.nav-logo');
    
    if (logo) {
        logo.addEventListener('click', () => {
            clickCount++;
            
            if (clickCount === 5) {
                toggleSpecialMode();
                clickCount = 0;
            }
            
            setTimeout(() => {
                clickCount = 0;
            }, 2000);
        });
    }
}

function toggleSpecialMode() {
    document.body.classList.toggle('special-mode');
    
    // Adicionar estilos especiais se não existirem
    if (!document.querySelector('#special-styles')) {
        const specialStyles = document.createElement('style');
        specialStyles.id = 'special-styles';
        specialStyles.textContent = `
            .special-mode {
                filter: hue-rotate(180deg);
                animation: rainbow 2s linear infinite;
            }
            
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            
            .special-mode .floating-icon {
                animation: crazy-float 1s ease-in-out infinite;
            }
            
            @keyframes crazy-float {
                0%, 100% { transform: rotate(0deg) scale(1); }
                25% { transform: rotate(90deg) scale(1.2); }
                50% { transform: rotate(180deg) scale(0.8); }
                75% { transform: rotate(270deg) scale(1.1); }
            }
        `;
        document.head.appendChild(specialStyles);
    }
    
    // Criar confetes
    createConfetti();
    
    setTimeout(() => {
        document.body.classList.remove('special-mode');
    }, 5000);
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                top: -10px;
                left: ${Math.random() * 100}%;
                width: 10px;
                height: 10px;
                background: ${getRandomColor()};
                z-index: 10000;
                pointer-events: none;
                animation: confettiFall 3s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 100);
    }
}

// Adicionar keyframes para confetti
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(confettiStyle);

// ===== OTIMIZAÇÕES DE PERFORMANCE =====
function optimizePerformance() {
    // Throttle para eventos de scroll
    let ticking = false;
    
    function updateOnScroll() {
        updateActiveNavLinkOnScroll();
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    });
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <div class="loading-logo">
                <span class="logo-bracket">&lt;</span>
                <span class="logo-name">Cássio</span>
                <span class="logo-bracket">/&gt;</span>
            </div>
            <div class="loading-text">Carregando experiência...</div>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    `;
    
    // Estilos do loading
    const loadingStyles = document.createElement('style');
    loadingStyles.textContent = `
        #loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            transition: opacity 0.5s ease-out;
        }
        
        .loading-content {
            text-align: center;
        }
        
        .loading-logo {
            font-family: var(--font-code);
            font-size: 3rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        
        .loading-text {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
        
        .loading-bar {
            width: 300px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
        }
        
        .loading-progress {
            width: 0;
            height: 100%;
            background: var(--gradient-accent);
            border-radius: 2px;
            animation: loadingProgress 2s ease-in-out forwards;
        }
        
        @keyframes loadingProgress {
            to { width: 100%; }
        }
    `;
    document.head.appendChild(loadingStyles);
    document.body.appendChild(loadingScreen);
    
    // Remover loading após carregamento
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }, 2500);
    
    // Inicializar otimizações
    optimizePerformance();
});

// ===== EASTER EGGS E INTERAÇÕES ESPECIAIS =====

// Konami Code
let konamiSequence = [];
const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konamiSequence.push(e.code);
    
    if (konamiSequence.length > konamiCode.length) {
        konamiSequence.shift();
    }
    
    if (konamiSequence.join(',') === konamiCode.join(',')) {
        activateSecretMode();
        konamiSequence = [];
    }
});

function activateSecretMode() {
    alert('🎮 Modo Desenvolvedor Ativado! 🎮');
    
    // Ativar console especial
    console.log(`
    ╔══════════════════════════════════════╗
    ║          MODO DESENVOLVEDOR          ║
    ║                                      ║
    ║  Você encontrou o Easter Egg!        ║
    ║  Digite 'help()' para ver comandos   ║
    ╚══════════════════════════════════════╝
    `);
    
    // Adicionar comandos especiais ao console
    window.help = () => {
        console.log(`
        Comandos disponíveis:
        - rainbow(): Ativa modo arco-íris
        - matrix(): Efeito Matrix
        - disco(): Modo discoteca
        - normal(): Volta ao normal
        `);
    };
    
    window.rainbow = () => toggleSpecialMode();
    window.matrix = () => createMatrixEffect();
    window.disco = () => createDiscoEffect();
    window.normal = () => location.reload();
}

function createMatrixEffect() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
    `;
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const drops = [];
    
    for (let x = 0; x < canvas.width / 10; x++) {
        drops[x] = 1;
    }
    
    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = '15px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = matrix[Math.floor(Math.random() * matrix.length)];
            ctx.fillText(text, i * 10, drops[i] * 10);
            
            if (drops[i] * 10 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    // Verificar se é mobile para ajustar performance
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const intervalTime = isMobileDevice ? 100 : 35; // Mais lento no mobile
    
    const matrixInterval = setInterval(drawMatrix, intervalTime);
    
    setTimeout(() => {
        clearInterval(matrixInterval);
        canvas.remove();
    }, 10000);
}

function createDiscoEffect() {
    document.body.style.animation = 'disco 0.5s infinite';
    
    const discoStyle = document.createElement('style');
    discoStyle.textContent = `
        @keyframes disco {
            0% { background: #ff0000; }
            14% { background: #ff7f00; }
            28% { background: #ffff00; }
            42% { background: #00ff00; }
            56% { background: #0000ff; }
            70% { background: #8b00ff; }
            84% { background: #ff1493; }
            100% { background: #ff0000; }
        }
    `;
    document.head.appendChild(discoStyle);
    
    setTimeout(() => {
        document.body.style.animation = '';
        discoStyle.remove();
    }, 5000);
}

// ===== DETECÇÃO DE DISPOSITIVO =====
function detectDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    console.log('🔍 DETECÇÃO DE DISPOSITIVO:');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('📱 É Mobile (UserAgent):', isMobile);
    console.log('📱 Tela Pequena (<= 768px):', isSmallScreen);
    console.log('📱 Suporte Touch:', isTouchDevice);
    console.log('📱 Largura da Tela:', window.innerWidth);
    console.log('📱 Altura da Tela:', window.innerHeight);
    
    // Adicionar classe mobile-device para CSS responsivo (apenas para telas pequenas)
    if (isSmallScreen) {
        document.body.classList.add('mobile-device');
    }
    
    // Aplicar otimizações de performance APENAS para dispositivos móveis REAIS (com touch)
    if (isMobile && isTouchDevice) {
        console.log('Aplicando otimizações para mobile real');
        document.body.classList.add('mobile-performance');
        
        // Ajustes específicos para dispositivos móveis touch
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            .mobile-performance .floating-elements {
                display: none !important;
            }
            
            .mobile-performance .audio-visualizer {
                opacity: 0.02 !important;
            }
            
            .mobile-performance #particles-container {
                opacity: 0.01 !important;
            }
            
            .mobile-performance #particles-container::before {
                animation: none !important;
                transform: none !important;
            }
            
            .mobile-performance .name-highlight {
                animation: none !important;
            }
            
            .mobile-performance .music-note {
                animation: none !important;
            }
            
            .mobile-performance .floating-icon {
                animation: none !important;
                transform: none !important;
            }
            
            .mobile-performance #music-matrix-bg {
                display: none !important;
            }
        `;
        document.head.appendChild(mobileStyles);
        
        // Melhorias específicas para controle de música mobile
        optimizeAmbientControlForMobile();
        
        // Desabilitar animações pesadas no mobile
        disableHeavyAnimationsOnMobile();
    }
}

function optimizeAmbientControlForMobile() {
    const ambientControl = document.querySelector('.ambient-music-control');
    let hideTimeout;
    let isInteracting = false;
    
    if (!ambientControl) return;
    
    // Auto-hide após inatividade
    function scheduleHide() {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            if (!isInteracting) {
                ambientControl.style.opacity = '0.3';
                ambientControl.style.transform += ' scale(0.8)';
            }
        }, 3000);
    }
    
    // Mostrar quando o usuário toca na tela
    function showControl() {
        ambientControl.style.opacity = '1';
        ambientControl.style.transform = ambientControl.style.transform.replace('scale(0.8)', 'scale(1)');
        scheduleHide();
    }
    
    // Event listeners para mobile
    ambientControl.addEventListener('touchstart', () => {
        isInteracting = true;
        showControl();
    });
    
    ambientControl.addEventListener('touchend', () => {
        isInteracting = false;
        scheduleHide();
    });
    
    // Mostrar controle quando usuário faz scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        showControl();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            scheduleHide();
        }, 1000);
    }, { passive: true });
    
    // Posicionamento inteligente para evitar sobreposição
    function adjustPosition() {
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        
        // Verificar se está muito próximo do navbar
        if (window.scrollY < 100) {
            ambientControl.style.top = `${navbarHeight + 10}px`;
            ambientControl.style.bottom = 'auto';
        } else {
            ambientControl.style.top = 'auto';
            ambientControl.style.bottom = '10px';
        }
    }
    
    window.addEventListener('scroll', adjustPosition, { passive: true });
    
    // Iniciar com controle semi-transparente
    scheduleHide();
}

// Executar detecção na inicialização
detectDevice();

// ===== SEO E PERFORMANCE =====
function initSEOOptimizations() {
    // Lazy loading para imagens
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Preload de recursos críticos
    const criticalResources = [
        'css/style.css',
        'js/script.js'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = resource.includes('.css') ? 'style' : 'script';
        link.href = resource;
        document.head.appendChild(link);
    });
    
    // Adicionar breadcrumbs estruturados
    addBreadcrumbsSchema();
    
    // Monitoramento de Core Web Vitals
    measureCoreWebVitals();
    
    // Adicionar tags para seções visitadas
    trackSectionViews();
}

function addBreadcrumbsSchema() {
    const breadcrumbsSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://cassio-oliveira.dev"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Portfolio",
                "item": "https://cassio-oliveira.dev/#projects"
            }
        ]
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(breadcrumbsSchema);
    document.head.appendChild(script);
}

function measureCoreWebVitals() {
    // Monitorar Core Web Vitals para SEO
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log(`${entry.name}: ${entry.value}`);
            
            // Aqui você pode enviar dados para Google Analytics ou outro serviço
            if (typeof gtag !== 'undefined') {
                gtag('event', entry.name, {
                    'custom_parameter': entry.value
                });
            }
        }
    });
    
    try {
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (e) {
        console.log('Performance Observer não suportado');
    }
}

function trackSectionViews() {
    const sections = document.querySelectorAll('section[id]');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                
                // Atualizar meta description dinamicamente
                updateMetaDescription(sectionId);
                
                // Atualizar URL sem reload (para analytics)
                if (history.pushState) {
                    const newUrl = `${window.location.pathname}#${sectionId}`;
                    history.pushState(null, null, newUrl);
                }
                
                console.log(`Seção visualizada: ${sectionId}`);
            }
        });
    }, {
        threshold: 0.5
    });
    
    sections.forEach(section => sectionObserver.observe(section));
}

function updateMetaDescription(sectionId) {
    const descriptions = {
        'home': 'Desenvolvedor Full Stack especializado em desenvolvimento de Sistemas Web e Aplicações modernas utilizando tecnologias como JavaScript, .Net Core, Angular e SQL Server.',
        'about': 'Conheça Cássio Oliveira: Desenvolvedor Full Stack e músico que combina código e criatividade para criar soluções inovadoras.',
        'skills': 'Habilidades técnicas de Cássio Oliveira: JavaScript, Angular, .Net Core, SQL Server, Node.js, e muito mais.',
        'contact': 'Entre em contato com Cássio Oliveira para projetos de desenvolvimento web, colaborações musicais ou parcerias.'
    };
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && descriptions[sectionId]) {
        metaDesc.setAttribute('content', descriptions[sectionId]);
    }
}

// Adicionar ao DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    initSEOOptimizations();
    
    // Garantir que o áudio ambiente seja inicializado
    setTimeout(() => {
        if (typeof initAmbientMusic === 'function') {
            initAmbientMusic();
        }
    }, 100);
});

function disableHeavyAnimationsOnMobile() {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
        // Reduzir ou desabilitar animações que consomem muito CPU
        const particlesContainer = document.getElementById('particles-container');
        if (particlesContainer) {
            particlesContainer.style.display = 'none';
        }
        
        // Reduzir frequência de atualizações de animações
        const audioVisualizer = document.querySelector('.audio-visualizer');
        if (audioVisualizer) {
            audioVisualizer.style.opacity = '0.05';
        }
        
        // Desabilitar elementos flutuantes
        const floatingElements = document.querySelector('.floating-elements');
        if (floatingElements) {
            floatingElements.style.display = 'none';
        }
        
        // Aplicar transform3d para otimizar renderização
        document.body.style.transform = 'translateZ(0)';
    }
}

// ===== MÚSICA AMBIENTE =====
// ===== MÚSICA AMBIENTE =====
function initAmbientMusic() {
    console.log('Inicializando música ambiente...');
    const ambientControl = document.querySelector('.ambient-music-control');
    const ambientToggle = document.getElementById('ambient-toggle');
    const ambientVolume = document.getElementById('ambient-volume');
    const ambientPrev = document.getElementById('ambient-prev');
    const ambientNext = document.getElementById('ambient-next');
    
    console.log('Elementos encontrados:', {
        ambientControl: !!ambientControl,
        ambientToggle: !!ambientToggle,
        ambientVolume: !!ambientVolume,
        ambientPrev: !!ambientPrev,
        ambientNext: !!ambientNext
    });
    
    let audioElement = null;
    let isPlaying = false;
    const audioFiles = [
        'audio/Eu sei que errei.mp3',
        'audio/Felicidade é meu Lugar.mp3',
        'audio/Dias Melhores.mp3'
    ];
    let currentTrackIndex = 0;
    
    // Mostrar controles após 1 segundo
    setTimeout(() => {
        if (ambientControl) {
            console.log('Mostrando controle de música ambiente');
            ambientControl.classList.add('show');
        } else {
            console.log('Elemento ambientControl não encontrado - tentando encontrar novamente');
            const retryControl = document.querySelector('.ambient-music-control');
            if (retryControl) {
                retryControl.classList.add('show');
                console.log('Controle encontrado na segunda tentativa');
            }
        }
    }, 1000);
    
    // Criar elemento de áudio
    function createAudioElement() {
        if (audioElement) return;
        
        audioElement = new Audio();
        audioElement.loop = false; // Loop manual para trocar de faixa
        audioElement.volume = 0.3; // Volume inicial
        audioElement.preload = 'auto';
        
        // Carregar primeira faixa
        audioElement.src = audioFiles[currentTrackIndex];
        
        // Event listeners para controle do áudio
        audioElement.addEventListener('ended', () => {
            // Se não estiver em loop, vai para próxima faixa
            nextTrack();
        });
        
        audioElement.addEventListener('error', (e) => {
            console.error('Erro ao carregar áudio:', audioElement.src, e);
            // Tentar próximo arquivo se houver erro
            nextTrack();
        });
        
        audioElement.addEventListener('loadstart', () => {
            console.log('Carregando áudio:', audioElement.src);
        });
        
        audioElement.addEventListener('canplaythrough', () => {
            console.log('Áudio pronto para reprodução');
        });
    }
    
    // Função para mudar de faixa
    function nextTrack() {
        if (audioFiles.length > 1) {
            currentTrackIndex = (currentTrackIndex + 1) % audioFiles.length;
            if (audioElement) {
                audioElement.src = audioFiles[currentTrackIndex];
                if (isPlaying) {
                    audioElement.play().catch(console.error);
                }
            }
        }
    }

    function previousTrack() {
        if (audioFiles.length > 1) {
            currentTrackIndex = (currentTrackIndex - 1 + audioFiles.length) % audioFiles.length;
            if (audioElement) {
                audioElement.src = audioFiles[currentTrackIndex];
                if (isPlaying) {
                    audioElement.play().catch(console.error);
                }
            }
        }
    }
    
    // Função para tocar/pausar áudio real
    function toggleAmbientMusic() {
        if (!audioElement) {
            createAudioElement();
        }
        
        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
            ambientToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            ambientControl.classList.remove('playing');
        } else {
            audioElement.play()
                .then(() => {
                    isPlaying = true;
                    ambientToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
                    ambientControl.classList.add('playing');
                })
                .catch(error => {
                    console.error('Erro ao reproduzir áudio:', error);
                });
        }
    }
    
    // Função para controlar volume
    function setAmbientVolume(value) {
        if (audioElement) {
            audioElement.volume = value / 100;
        }
    }
    
    // Event listeners
    if (ambientToggle) {
        ambientToggle.addEventListener('click', toggleAmbientMusic);
    }

    if (ambientPrev) {
        ambientPrev.addEventListener('click', previousTrack);
    }

    if (ambientNext) {
        ambientNext.addEventListener('click', nextTrack);
    }
    
    if (ambientVolume) {
        ambientVolume.addEventListener('input', (e) => {
            setAmbientVolume(e.target.value);
        });
    }
    
    // Inicializar áudio ao carregar a página
    console.log('Inicializando sistema de áudio ambiente...');
    createAudioElement();
}

function syncAudioVisualizer(isActive) {
    const bars = document.querySelectorAll('.audio-visualizer .bar');
    
    if (isActive) {
        bars.forEach((bar, index) => {
            bar.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            bar.style.opacity = '0.3';
        });
    } else {
        bars.forEach(bar => {
            bar.style.animationDuration = '2s';
            bar.style.opacity = '0.1';
        });
    }
}

// ===== FUNDO MUSICAL ELEGANTE =====
function initMusicMatrixBackground() {
    // Verificar se é dispositivo móvel antes de inicializar
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile && isTouchDevice) {
        console.log('Fundo Matrix desabilitado para mobile');
        return;
    }
    
    console.log('Inicializando fundo musical Matrix...');
    const canvas = document.createElement('canvas');
    canvas.id = 'music-matrix-bg';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
        pointer-events: none;
        opacity: 0.15;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Partículas musicais minimalistas
    const particles = [];
    const maxParticles = 15;
    
    // Criar partículas iniciais
    for (let i = 0; i < maxParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            symbol: ['♪', '♫', '♬'][Math.floor(Math.random() * 3)],
            size: Math.random() * 20 + 15,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3,
            drift: Math.random() * 0.02 - 0.01
        });
    }

    // Linhas da pauta musical
    let pautaOffset = 0;
    
    function drawStaff() {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Desenhar 5 linhas da pauta em diferentes alturas
        for (let section = 0; section < 3; section++) {
            const startY = height * 0.2 + (section * height * 0.3);
            
            for (let line = 0; line < 5; line++) {
                const y = startY + (line * 20);
                ctx.beginPath();
                ctx.moveTo(-50, y);
                ctx.lineTo(width + 50, y);
                ctx.stroke();
            }
        }
    }

    function drawWaves() {
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.08)';
        ctx.lineWidth = 2;
        
        // Ondas sonoras sutis
        for (let wave = 0; wave < 3; wave++) {
            ctx.beginPath();
            const amplitude = 30;
            const frequency = 0.005;
            const yOffset = height * (0.3 + wave * 0.2);
            
            for (let x = 0; x <= width; x += 5) {
                const y = yOffset + Math.sin(x * frequency + pautaOffset + wave * Math.PI / 3) * amplitude;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
    }

    function drawParticles() {
        particles.forEach(particle => {
            ctx.font = `${particle.size}px Arial`;
            ctx.fillStyle = `rgba(0, 212, 255, ${particle.opacity})`;
            ctx.textAlign = 'center';
            ctx.fillText(particle.symbol, particle.x, particle.y);
            
            // Movimento da partícula
            particle.y -= particle.speed;
            particle.x += particle.drift * 50;
            particle.opacity *= 0.999;
            
            // Reset da partícula quando sai da tela
            if (particle.y < -50 || particle.opacity < 0.1) {
                particle.x = Math.random() * width;
                particle.y = height + 50;
                particle.opacity = Math.random() * 0.5 + 0.3;
                particle.symbol = ['♪', '♫', '♬'][Math.floor(Math.random() * 3)];
            }
        });
    }

    function animate() {
        // Limpar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Desenhar elementos
        drawStaff();
        drawWaves();
        drawParticles();
        
        // Animar offset das ondas
        pautaOffset += 0.01;
        
        requestAnimationFrame(animate);
    }
    
    // Iniciar animação
    animate();

    // Redimensionar canvas
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });
    
    console.log('Fundo musical elegante iniciado!');
}