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
            res.writeHead(400);
            res.end('400 - Bad request');
            return;
        }
        // Caminho fora da raiz ou oculto: responde como inexistente, sem revelar se o arquivo existe.
        if (!filePath) {
            res.writeHead(404);
            res.end('404 - File not found');
            return;
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if(error.code == 'ENOENT') {
                    res.writeHead(404);
                    res.end('404 - File not found');
                } else {
                    res.writeHead(500);
                    res.end('500 - Internal server error');
                }
            } else {
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(content, 'utf-8');
            }
        });
    });
}

module.exports = { createServer };

// Só escuta a porta quando executado direto (npm start); nos testes o servidor é criado sob demanda.
if (require.main === module) {
    const PORT = 8000;
    createServer(__dirname).listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}
