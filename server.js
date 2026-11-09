const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg'
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
