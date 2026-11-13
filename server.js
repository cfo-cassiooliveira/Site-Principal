const http = require('http');
const fs = require('fs');
const path = require('path');

// Só os tipos de arquivo que o site realmente publica.
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.webmanifest': 'application/manifest+json',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.vcf': 'text/vcard'
};

// Os mesmos controles da meta CSP do index.html, mais o que só funciona por cabeçalho (frame-ancestors, nosniff).
const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; "
        + "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; "
        + "base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/** Responde com os cabeçalhos de segurança em todo status (inclusive erros). */
function send(res, status, body, headers = {}) {
    res.writeHead(status, { ...securityHeaders, ...headers });
    res.end(body);
}

/**
 * Converte a URL da requisição em um arquivo dentro de root.
 * Devolve null quando o caminho sai de root ("../", inclusive codificado) ou passa por item oculto (.git, .env).
 * Lança URIError quando a URL tem codificação inválida.
 */
function resolveFilePath(root, requestUrl) {
    const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
    if (pathname.split(/[\\/]/).some(segment => segment.startsWith('.'))) {
        return null;
    }

    const rootPath = path.resolve(root);
    const filePath = path.resolve(rootPath, '.' + (pathname === '/' ? '/index.html' : pathname));
    return filePath.startsWith(rootPath + path.sep) ? filePath : null;
}

/** Cria o servidor de desenvolvimento que entrega os arquivos estáticos da pasta root. */
function createServer(root) {
    return http.createServer((req, res) => {
        let filePath;
        try {
            filePath = resolveFilePath(root, req.url);
        } catch {
            send(res, 400, '400 - Bad request');
            return;
        }
        // Caminho fora da raiz ou oculto: responde como inexistente, sem revelar se o arquivo existe.
        if (!filePath) {
            send(res, 404, '404 - File not found');
            return;
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (!error) {
                // Sem CORS: o site só é lido pela própria origem.
                send(res, 200, content, { 'Content-Type': contentType });
            } else if (error.code === 'ENOENT') {
                send(res, 404, '404 - File not found');
            } else {
                send(res, 500, '500 - Internal server error');
            }
        });
    });
}

module.exports = { createServer };

// Só escuta a porta quando executado direto (npm start); nos testes o servidor é criado sob demanda.
if (require.main === module) {
    const PORT = 8000;
    // Servidor de desenvolvimento: só na máquina local, nunca exposto à rede.
    createServer(__dirname).listen(PORT, '127.0.0.1', () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}
