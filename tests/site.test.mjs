import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const indexHtml = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf-8');
const bodyHtml = indexHtml.slice(indexHtml.indexOf('<body'), indexHtml.lastIndexOf('</body>'));

// Carrega o script real do site sobre o HTML real e dispara o DOMContentLoaded, como o navegador faz.
async function loadSite() {
  vi.resetModules();
  document.body.innerHTML = bodyHtml.replace(/^<body[^>]*>/, '');
  await import('../js/script.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

// O document do jsdom é o mesmo em todos os testes: os listeners que o script registra nele
// precisam sair ao fim de cada teste, senão um carregamento anterior reage aos eventos do próximo.
let trackedListeners;

beforeEach(() => {
  trackedListeners = [];
  const original = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
    trackedListeners.push({ type, listener, options });
    original(type, listener, options);
  });
});

afterEach(() => {
  for (const { type, listener, options } of trackedListeners) {
    document.removeEventListener(type, listener, options);
  }
  vi.restoreAllMocks();
});

const toggle = () => document.querySelector('.menu-toggle');
const nav = () => document.getElementById('site-nav');

describe('menu', () => {
  beforeEach(loadSite);

  it('toggleClick_WhenMenuIsClosed_OpensMenu', () => {
    toggle().click();

    expect(nav().classList.contains('is-open')).toBe(true);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });

  it('toggleClick_WhenMenuIsOpen_ClosesMenu', () => {
    toggle().click();

    toggle().click();

    expect(nav().classList.contains('is-open')).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('linkClick_WhenMenuIsOpen_ClosesMenu', () => {
    toggle().click();

    nav().querySelector('a[href="#projetos"]').click();

    expect(nav().classList.contains('is-open')).toBe(false);
  });

  it('navClickOutsideLinks_WhenMenuIsOpen_KeepsMenuOpen', () => {
    toggle().click();

    nav().click();

    expect(nav().classList.contains('is-open')).toBe(true);
  });

  it('escapeKey_WhenMenuIsOpen_ClosesMenuAndFocusesToggle', () => {
    toggle().click();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(nav().classList.contains('is-open')).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it('otherKey_WhenMenuIsOpen_KeepsMenuOpen', () => {
    toggle().click();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(nav().classList.contains('is-open')).toBe(true);
  });
});

describe('initialization', () => {
  it('domContentLoaded_WhenMenuIsMissing_DoesNotThrow', async () => {
    vi.resetModules();
    document.body.innerHTML = '<main></main>';
    await import('../js/script.js');

    expect(() => document.dispatchEvent(new Event('DOMContentLoaded'))).not.toThrow();
  });
});

describe('section tracking', () => {
  // Dublê do IntersectionObserver (ausente no jsdom) que guarda o callback para o teste disparar.
  let observer;

  beforeEach(async () => {
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback) {
        this.callback = callback;
        this.observed = [];
        observer = this;
      }

      observe(element) {
        this.observed.push(element);
      }
    });
    await loadSite();
  });

  afterEach(() => vi.unstubAllGlobals());

  const intersect = (id, isIntersecting = true) =>
    observer.callback([{ target: document.getElementById(id), isIntersecting }]);

  it('domContentLoaded_ObservesEverySectionLinkedInMenu', () => {
    expect(observer.observed.map((section) => section.id)).toEqual(
      ['experiencia', 'projetos', 'stack', 'formacao', 'contato'],
    );
  });

  it('sectionEntersView_MarksOnlyItsLinkAsCurrent', () => {
    intersect('experiencia');

    intersect('stack');

    const current = [...nav().querySelectorAll('[aria-current="true"]')].map((link) => link.getAttribute('href'));
    expect(current).toEqual(['#stack']);
  });

  it('sectionLeavesView_KeepsPreviousMark', () => {
    intersect('projetos');

    intersect('projetos', false);

    expect(nav().querySelector('a[href="#projetos"]').getAttribute('aria-current')).toBe('true');
  });
});

describe('seo', () => {
  const head = new DOMParser().parseFromString(indexHtml, 'text/html');
  const meta = (selector) => head.querySelector(selector)?.getAttribute('content');

  it('title_FitsInGoogleResults', () => {
    expect(head.title.length).toBeLessThanOrEqual(60);
  });

  it('description_FitsInGoogleResults', () => {
    const description = meta('meta[name="description"]');

    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('canonicalAndOpenGraphUrl_PointToProductionDomain', () => {
    expect(head.querySelector('link[rel="canonical"]').href).toBe('https://cassiofernandooliveira.com.br/');
    expect(meta('meta[property="og:url"]')).toBe('https://cassiofernandooliveira.com.br/');
  });

  it('shareImage_ExistsInRepository', () => {
    const imageUrl = new URL(meta('meta[property="og:image"]'));

    expect(existsSync(join(import.meta.dirname, '..', imageUrl.pathname))).toBe(true);
  });

  // O WhatsApp descarta a prévia quando a imagem passa de ~300 KB.
  it('shareImage_IsSmallEnoughForWhatsAppPreview', () => {
    const imageUrl = new URL(meta('meta[property="og:image"]'));
    const sizeInBytes = statSync(join(import.meta.dirname, '..', imageUrl.pathname)).size;

    expect(imageUrl.protocol).toBe('https:');
    expect(sizeInBytes).toBeLessThan(300 * 1024);
  });

  it('structuredData_IsValidJsonWithProfilePageAndPerson', () => {
    const jsonLd = JSON.parse(head.querySelector('script[type="application/ld+json"]').textContent);

    expect(jsonLd['@graph'].map((node) => node['@type'])).toEqual(
      expect.arrayContaining(['ProfilePage', 'Person', 'WebSite']),
    );
  });

  // Regressão: as tags do Google (Tag Manager no head e no noscript) devem permanecer no site.
  it('googleTagManager_IsPresentInHeadAndNoscript', () => {
    expect(head.head.innerHTML).toContain("'GTM-PZPBBTWJ'");
    expect(head.querySelector('noscript iframe').getAttribute('src')).toContain('id=GTM-PZPBBTWJ');
  });
});

describe('content', () => {
  beforeEach(loadSite);

  it('contactQrCode_IsStaticSvgWithoutScripts', () => {
    const src = document.querySelector('.contact-qr img').getAttribute('src');
    const svg = readFileSync(join(import.meta.dirname, '..', src), 'utf-8');

    expect(svg).toContain('viewBox=');
    expect(svg).not.toMatch(/<script|\son[a-z]+=|javascript:|<foreignObject/i);
  });

  // O cartão salvo na agenda precisa ter o mesmo WhatsApp e e-mail exibidos na página.
  it('contactCard_MatchesPhoneAndEmailShownOnPage', () => {
    const href = document.querySelector('.save-contact').getAttribute('href');
    const vcard = readFileSync(join(import.meta.dirname, '..', href), 'utf-8');
    const whatsappNumber = new URL(document.querySelector('.contacts a[href*="whatsapp"]').href).searchParams.get('phone');
    const email = document.querySelector('.contacts a[href^="mailto:"]').getAttribute('href').slice('mailto:'.length);

    expect(vcard).toMatch(/^BEGIN:VCARD\r\nVERSION:3\.0\r\n/);
    expect(vcard).toContain(`TEL;TYPE=CELL:+${whatsappNumber}`);
    expect(vcard).toMatch(new RegExp(`^EMAIL[^:\\r\\n]*:${email.replaceAll('.', '\\.')}\\r?$`, 'm'));
    expect(vcard.trimEnd().endsWith('END:VCARD')).toBe(true);
  });

  it('resumeLinks_PointToExistingPdf', () => {
    const links = [...document.querySelectorAll('a[download]')];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(existsSync(join(import.meta.dirname, '..', link.getAttribute('href'))), link.getAttribute('href')).toBe(true);
    }
  });

  it('internalNavLinks_PointToExistingSections', () => {
    const targets = [...nav().querySelectorAll('a[href^="#"]')].map((link) => link.getAttribute('href').slice(1));

    for (const id of targets) {
      expect(document.getElementById(id), `#${id}`).not.toBeNull();
    }
  });

  it('systemMapLinks_PointToRepositoriesOnGitHub', () => {
    const links = [...document.querySelectorAll('.system-map a.node')];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.href).toMatch(/^https:\/\/github\.com\/cfo-cassiooliveira\/[\w-]+$/);
    }
  });

  // Regressão da decisão de foco profissional: o site não mistura conteúdo musical.
  it('page_DoesNotMentionMusicContent', () => {
    expect(indexHtml.toLowerCase()).not.toMatch(/músic|music|suno/);
  });
});
