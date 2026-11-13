# Site principal — portfólio profissional

Portfólio de **Cássio Fernando de Oliveira**, desenvolvedor full stack .NET (C#), Angular, Keycloak e RabbitMQ:
experiência, projetos do GitHub, stack, formação e contato.

**No ar em:** https://cassiofernandooliveira.com.br (GitHub Pages, publicado a partir da `master`).

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | Página única, sem framework, com SEO (Open Graph e JSON-LD `Person`) |
| `css/style.css` | Estilos com tokens de cor, modo escuro automático e layout responsivo |
| `js/script.js` | Único comportamento: menu recolhível no celular |
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

O GitHub Pages publica a branch `master`. O fluxo segue o ADR-0001 do Workspace: o desenvolvimento acontece em
`DEV-NNN` e chega à `master` por PR aprovado.
