import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const indexHtml = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf-8');
const bodyHtml = indexHtml.slice(indexHtml.indexOf('<body'), indexHtml.lastIndexOf('</body>'));

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
];

// Carrega o script real do site sobre o HTML real e dispara o DOMContentLoaded, como o navegador faz.
async function loadSite() {
  vi.resetModules();
  document.head.innerHTML = '';
  document.body.innerHTML = bodyHtml.replace(/^<body[^>]*>/, '');
  await import('../js/script.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

function pressKey(code, key = code) {
  document.dispatchEvent(new KeyboardEvent('keydown', { code, key }));
}

// Contexto 2D de canvas sem efeito: qualquer método chamado não faz nada (o jsdom não desenha).
const fakeCanvasContext = new Proxy({}, {
  get: (target, property) => (property in target ? target[property] : () => {}),
});

// O document e o window do jsdom são os mesmos em todos os testes: os listeners que o script registra neles
// precisam sair ao fim de cada teste, senão um carregamento anterior reage aos eventos do próximo.
let trackedListeners;

function trackGlobalListeners() {
  trackedListeners = [];
  for (const target of [document, window]) {
    const original = target.addEventListener.bind(target);
    vi.spyOn(target, 'addEventListener').mockImplementation((type, listener, options) => {
      trackedListeners.push({ target, type, listener, options });
      original(type, listener, options);
    });
  }
}

function removeTrackedListeners() {
  for (const { target, type, listener, options } of trackedListeners) {
    target.removeEventListener(type, listener, options);
  }
}

// Exceções não tratadas que o jsdom reporta no window (equivalente ao console de erros do navegador).
let uncaughtErrors;
let errorListener;

beforeEach(() => {
  vi.useFakeTimers();
  // APIs de navegador que o jsdom não implementa: dublês mínimos, sem comportamento.
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('alert', vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCanvasContext);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  uncaughtErrors = [];
  errorListener = (event) => {
    uncaughtErrors.push(event.error);
    event.preventDefault();
  };
  window.addEventListener('error', errorListener);
  trackGlobalListeners();
});

afterEach(() => {
  window.removeEventListener('error', errorListener);
  removeTrackedListeners();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Regressão: initializeWebsite chamava initContactForm, que não existe. O ReferenceError interrompia a
// inicialização e tudo depois dele (tema, música ambiente, fundo animado) nunca rodava.
describe('initialization', () => {
  beforeEach(loadSite);

  it('domContentLoaded_InitializesWithoutUncaughtErrors', () => {
    expect(uncaughtErrors).toEqual([]);
  });

  it('logoClickedFiveTimes_TogglesSpecialMode', () => {
    const logo = document.querySelector('.nav-logo');

    for (let click = 0; click < 5; click++) {
      logo.click();
    }

    expect(document.body.classList.contains('special-mode')).toBe(true);
  });

  it('domContentLoaded_ShowsAmbientMusicControlAfterOneSecond', () => {
    vi.advanceTimersByTime(1000);

    expect(document.querySelector('.ambient-music-control').classList.contains('show')).toBe(true);
  });
});

describe('navigation', () => {
  beforeEach(loadSite);

  it('hamburgerClick_WhenMenuIsClosed_OpensMenuAndOverlay', () => {
    document.querySelector('.hamburger').click();

    expect(document.querySelector('.nav-menu').classList.contains('active')).toBe(true);
    expect(document.querySelector('.nav-overlay').classList.contains('active')).toBe(true);
  });

  it('escapeKey_WhenMenuIsOpen_ClosesMenu', () => {
    document.querySelector('.hamburger').click();

    pressKey('Escape');

    expect(document.querySelector('.nav-menu').classList.contains('active')).toBe(false);
    expect(document.querySelector('.hamburger').classList.contains('active')).toBe(false);
  });

  it('overlayClick_WhenMenuIsOpen_ClosesMenu', () => {
    document.querySelector('.hamburger').click();

    document.querySelector('.nav-overlay').click();

    expect(document.querySelector('.nav-menu').classList.contains('active')).toBe(false);
    expect(document.querySelector('.nav-overlay').classList.contains('active')).toBe(false);
  });

  it('internalLinkClick_WhenSectionExists_MarksOnlyThatLinkAsActive', () => {
    Element.prototype.scrollIntoView = vi.fn();
    const aboutLink = document.querySelector('.nav-link[href="#about"]');

    aboutLink.click();

    const activeLinks = [...document.querySelectorAll('.nav-link.active')];
    expect(activeLinks).toEqual([aboutLink]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});

describe('loading screen', () => {
  beforeEach(loadSite);

  it('domContentLoaded_ShowsLoadingScreen_AndRemovesItAfterThreeSeconds', () => {
    expect(document.getElementById('loading-screen')).not.toBeNull();

    vi.advanceTimersByTime(3000);

    expect(document.getElementById('loading-screen')).toBeNull();
  });
});

describe('secret mode', () => {
  beforeEach(loadSite);

  it('keydown_WhenKonamiCodeIsTyped_ActivatesSecretMode', () => {
    KONAMI_CODE.forEach((code) => pressKey(code));

    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Modo Desenvolvedor'));
  });

  it('keydown_WhenSequenceIsWrong_DoesNotActivateSecretMode', () => {
    [...KONAMI_CODE.slice(0, -1), 'KeyC'].forEach((code) => pressKey(code));

    expect(alert).not.toHaveBeenCalled();
  });
});
