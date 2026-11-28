# Site principal — portfólio profissional

Portfólio de **Cássio Fernando de Oliveira**, desenvolvedor full stack .NET (C#), Angular, Keycloak e RabbitMQ:
experiência, projetos do GitHub, stack, formação e contato.

**No ar em:** https://cassiofernandooliveira.com.br (GitHub Pages, publicado a partir da `master`).

## Destaques técnicos

- CSP e política de referência por `meta` (o GitHub Pages não aceita cabeçalhos próprios); scripts só da própria
  origem e sem rastreadores de terceiros.
- SEO com canonical, Open Graph e JSON-LD (`ProfilePage`, `Person`, `WebSite`); tamanho do título, da descrição e da
  imagem de compartilhamento conferido em teste.
- Acessibilidade: link para pular ao conteúdo, foco visível, menu com `aria-expanded` e fechamento por Esc,
  `prefers-reduced-motion` e contraste AA das principais cores de texto do tema claro testado.
- Sem framework: layout responsivo e tema escuro automático por tokens CSS.
- Servidor local bloqueia saída da pasta do site e arquivos ocultos, com testes de regressão.

## Uso de IA

Este projeto foi desenvolvido com auxílio de IA (**Claude Code**), na implementação e em code review. As mudanças
passam por testes automatizados e CI antes de entrar na `master`.

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | Página única, sem framework, com SEO (Open Graph e JSON-LD `ProfilePage`, `Person` e `WebSite`) |
| `css/style.css` | Estilos com tokens de cor, modo escuro automático e layout responsivo |
| `js/script.js` | Menu recolhível em telas estreitas e marcação, no menu, da seção visível |
| `server.js` | Servidor estático para desenvolvimento local (não é usado em produção) |
| `CNAME` | Domínio próprio do GitHub Pages |
| `tests/` | Testes do site e do servidor (Vitest + jsdom) |

## Rodar localmente

Pré-requisito: Node.js.

```bash
npm ci
npm start          # http://localhost:8000
```

## Testes e qualidade (SonarQube)

Os testes carregam o `js/script.js` real sobre o `index.html` em um DOM simulado. A cobertura vai para o
SonarQube local do projeto [sonarqube](https://github.com/cfo-cassiooliveira/sonarqube) (http://localhost:9001),
que exige 80% de cobertura em código novo.

```bash
npm test                              # testes
npm run test:coverage                 # testes + coverage/lcov.info
../sonarqube/scripts/scan.sh .        # análise e Quality Gate (rode depois do test:coverage)
```

Código novo em `js/` precisa vir com testes em `tests/`.

## Publicação

O GitHub Pages publica a branch `master`. O desenvolvimento acontece em `DEV-NNN` e chega à `master` por PR, com o
CI verde.
