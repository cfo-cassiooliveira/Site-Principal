// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const { createServer } = createRequire(import.meta.url)('../server.js');

const SECRET = 'secret-outside-site-root';

let sandbox;
let server;
let port;

// Envia o caminho exatamente como recebido (sem normalizar "../"), como um atacante faria.
function get(rawPath) {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path: rawPath, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  // Pasta temporária: site/ é a raiz servida; o segredo fica fora dela.
  sandbox = mkdtempSync(join(tmpdir(), 'site-server-'));
  const root = join(sandbox, 'site');
  mkdirSync(join(root, 'css'), { recursive: true });
  mkdirSync(join(root, '.git'));
  writeFileSync(join(root, 'index.html'), '<h1>home</h1>');
  writeFileSync(join(root, 'css', 'style.css'), 'body {}');
  mkdirSync(join(root, 'images'));
  mkdirSync(join(root, 'curriculo'));
  writeFileSync(join(root, 'images', 'foto.jpg'), 'jpg');
  writeFileSync(join(root, 'curriculo', 'cv.pdf'), 'pdf');
  writeFileSync(join(root, 'data.bin'), 'bin');
  writeFileSync(join(root, 'favicon.svg'), '<svg/>');
  writeFileSync(join(root, 'contato.vcf'), 'BEGIN:VCARD');
  writeFileSync(join(root, '.git', 'config'), SECRET);
  writeFileSync(join(sandbox, 'secret.txt'), SECRET);

  server = createServer(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(sandbox, { recursive: true, force: true });
});

describe('static file server', () => {
  it('get_WhenRootPath_ServesIndexHtml', async () => {
    const response = await get('/');

    expect(response.status).toBe(200);
    expect(response.body).toBe('<h1>home</h1>');
    expect(response.headers['content-type']).toBe('text/html');
  });

  it('get_WhenFileExists_ServesItWithMimeType', async () => {
    const response = await get('/css/style.css');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/css');
  });

  // Regressão: .jpg era entregue como "image/jpg", tipo MIME inexistente.
  it('get_WhenJpgImage_ServesImageJpeg', async () => {
    const response = await get('/images/foto.jpg');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/jpeg');
  });

  it('get_WhenSvgFavicon_ServesImageSvgXml', async () => {
    const response = await get('/favicon.svg');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/svg+xml');
  });

  it('get_WhenContactCard_ServesTextVcard', async () => {
    const response = await get('/contato.vcf');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/vcard');
  });

  it('get_WhenResumePdf_ServesApplicationPdf', async () => {
    const response = await get('/curriculo/cv.pdf');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
  });

  it('get_WhenExtensionIsUnknown_ServesOctetStream', async () => {
    const response = await get('/data.bin');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/octet-stream');
  });

  it('get_WhenQueryStringIsPresent_IgnoresIt', async () => {
    const response = await get('/css/style.css?v=2');

    expect(response.status).toBe(200);
  });

  it('get_WhenFileDoesNotExist_Returns404', async () => {
    const response = await get('/missing.html');

    expect(response.status).toBe(404);
  });

  // Regressão: "../" no caminho lia arquivos fora da pasta do site (path traversal, OWASP A01).
  it.each([
    '/../secret.txt',
    '/css/../../secret.txt',
    '/%2e%2e/secret.txt',
    '/..%2fsecret.txt',
    '/..%5csecret.txt',
  ])('get_WhenPathEscapesRoot_Returns404WithoutContent (%s)', async (rawPath) => {
    const response = await get(rawPath);

    expect(response.status).toBe(404);
    expect(response.body).not.toContain(SECRET);
  });

  // Arquivos e pastas ocultos (.git, .env...) nunca são servidos.
  it('get_WhenPathHasHiddenSegment_Returns404', async () => {
    const response = await get('/.git/config');

    expect(response.status).toBe(404);
    expect(response.body).not.toContain(SECRET);
  });

  it('get_WhenPathIsMalformed_Returns400', async () => {
    const response = await get('/%E0%A4%A');

    expect(response.status).toBe(400);
  });

  // Regressão (Sonar S5122): o servidor liberava CORS para qualquer origem sem necessidade.
  it('get_WhenFileExists_DoesNotAllowCrossOriginReads', async () => {
    const response = await get('/');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it.each(['/', '/missing.html', '/%E0%A4%A'])('get_AnyResponse_SendsSecurityHeaders (%s)', async (rawPath) => {
    const response = await get(rawPath);

    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
