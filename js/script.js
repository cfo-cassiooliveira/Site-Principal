// Menu recolhível do celular: abre e fecha pelo botão, fecha com Esc e ao escolher uma seção.
function initMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) {
        return;
    }

    const setOpen = (open) => {
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));

    nav.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && nav.classList.contains('is-open')) {
            setOpen(false);
            toggle.focus();
        }
    });
}

// Marca no menu a seção que está na faixa central da tela, para o visitante saber onde está na página.
function initSectionTracking() {
    const links = [...document.querySelectorAll('#site-nav a[href^="#"]')];
    if (links.length === 0 || !('IntersectionObserver' in window)) {
        return;
    }

    const linkBySection = new Map(
        links
            .map((link) => [document.getElementById(link.getAttribute('href').slice(1)), link])
            .filter(([section]) => section),
    );

    const markCurrent = (currentLink) => {
        for (const link of links) {
            if (link === currentLink) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        }
    };

    // A faixa ignora o topo e a base da tela: só conta a seção que ocupa o meio da janela.
    const observer = new IntersectionObserver((entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
            markCurrent(linkBySection.get(visible.target));
        }
    }, { rootMargin: '-45% 0px -50% 0px' });

    for (const section of linkBySection.keys()) {
        observer.observe(section);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initSectionTracking();
});
