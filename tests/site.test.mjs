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

});

describe('privacy and security', () => {
  const page = new DOMParser().parseFromString(indexHtml, 'text/html');

  // Regressão (LGPD): o Google Tag Manager gravava cookies de analytics sem consentimento.
  it('page_DoesNotLoadThirdPartyTrackers', () => {
    expect(indexHtml).not.toMatch(/googletagmanager|google-analytics|GTM-|gtag\(/i);
  });

  it('page_LoadsScriptsOnlyFromOwnOrigin', () => {
    const executable = [...page.querySelectorAll('script')].filter((s) => s.type !== 'application/ld+json');

    expect(executable.map((s) => s.getAttribute('src'))).toEqual(['js/script.js']);
  });

  // O GitHub Pages não aceita cabeçalhos próprios: a CSP precisa estar no HTML e negar scripts de fora.
  it('contentSecurityPolicy_IsDeclaredInHeadAndBlocksForeignScripts', () => {
    const csp = page.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') ?? '';

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('unsafe-inline');
    expect(page.querySelector('meta[name="referrer"]')?.getAttribute('content')).toBe('strict-origin-when-cross-origin');
  });
});

describe('color contrast (WCAG 1.4.3)', () => {
  const css = readFileSync(join(import.meta.dirname, '..', 'css', 'style.css'), 'utf-8');
  // Só o bloco :root do tema claro (o primeiro); o escuro vem no @media seguinte.
  const lightTokens = css.slice(css.indexOf(':root'), css.indexOf('@media (prefers-color-scheme: dark)'));
  const token = (name) => lightTokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const luminance = (color) => {
    const [r, g, b] = color.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };
  // Simula o color-mix(in srgb, cor X%, fundo) usado nos selos e cartões.
  const mix = (color, background, amount) => color.map((v, i) => Math.round(v * amount + background[i] * (1 - amount)));

  // Regressão: o selo "Disponível para novas oportunidades" tinha 3,75:1 sobre o próprio fundo tingido.
  it('statusBadge_TextOnTintedBackground_ReachesAA', () => {
    const water = rgb(token('water'));

    expect(ratio(water, mix(water, rgb(token('paper')), 0.14))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['ink', 'muted', 'accent'])('%s_OnPaperAndSurface_ReachesAA', (name) => {
    const color = rgb(token(name));

    expect(ratio(color, rgb(token('paper')))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(color, rgb(token('surface')))).toBeGreaterThanOrEqual(4.5);
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
