# Cultiva — Deploy no Vercel (site único, com banco de dados)

Este projeto já está estruturado para subir como **um único projeto no Vercel**:
- O **frontend** (React/Vite) é publicado como site estático
- O **backend** (Express/Prisma) roda como **função serverless** na pasta `/api`
- O **banco de dados** é o **Vercel Postgres** (powered by Neon)

No final, você terá **um único link** (ex: `https://cultiva-suaempresa.vercel.app`) com tudo funcionando.

---

## Passo 1 — Subir o código para o GitHub

1. Crie um repositório novo no GitHub, por exemplo `cultiva`.
2. Faça upload de **todo o conteúdo desta pasta** (incluindo as pastas `api`, `src`, `prisma`, e os arquivos `package.json`, `vercel.json`, `index.html`, etc.) — pela interface web do GitHub ("Add file" → "Upload files") ou via `git push`.

   Não suba a pasta `node_modules` (já está no `.gitignore`).

---

## Passo 2 — Criar o projeto na Vercel

1. Acesse https://vercel.com e faça login com sua conta GitHub.
2. Clique em "Add New..." → "Project".
3. Selecione o repositório `cultiva` que você acabou de criar.
4. A Vercel deve detectar automaticamente o framework Vite. Não mude nada nas configurações de build (o `vercel.json` já define tudo).
5. Ainda não se preocupe se o primeiro deploy falhar — vamos criar o banco de dados no próximo passo e depois refazer o deploy.

---

## Passo 3 — Criar o banco de dados (Vercel Postgres)

1. No painel do seu projeto na Vercel, vá na aba "Storage".
2. Clique em "Create Database" → escolha "Postgres" (Neon).
3. Dê um nome (ex: `cultiva-db`) e clique em "Create".
4. Na tela seguinte, clique em "Connect" (ou "Connect Project") e selecione o seu projeto `cultiva` — isso adiciona automaticamente as variáveis `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (entre outras) ao seu projeto.

---

## Passo 4 — Configurar variáveis de ambiente

1. No painel do projeto, vá em Settings → Environment Variables.
2. Confirme que `DATABASE_URL` e `DATABASE_URL_UNPOOLED` já existem (criadas no passo 3). Se só existir `POSTGRES_URL` e `POSTGRES_URL_NON_POOLING`, adicione também:
   - `DATABASE_URL` = mesmo valor de `POSTGRES_URL`
   - `DATABASE_URL_UNPOOLED` = mesmo valor de `POSTGRES_URL_NON_POOLING`
3. Adicione mais duas variáveis (clique em "Add" para cada uma):
   - `JWT_SECRET` → cole uma string aleatória longa (40+ caracteres)
   - `SEED_SECRET` → outra string aleatória longa (vai ser usada uma única vez para popular o banco)
4. Clique em "Save".

---

## Passo 5 — Fazer o deploy

1. Vá na aba "Deployments".
2. Clique nos três pontinhos do último deploy → "Redeploy" (isso garante que ele rode com as variáveis novas).
3. Aguarde o build terminar (ícone verde "Ready"). Isso pode levar 2-4 minutos.
4. Clique no link gerado (algo como `https://cultiva-xxxx.vercel.app`) — você deve ver a tela de login do Cultiva.

---

## Passo 6 — Criar a estrutura do banco e os dados iniciais

O banco está vazio até aqui. Vamos rodar o seed (cria empresa, departamentos, usuários de teste, benefícios, OKRs, pesquisa e curso de exemplo) através do endpoint protegido `/api/seed`.

### Opção A — Pelo navegador (mais simples)

1. Acesse o site https://reqbin.com (ferramenta gratuita para enviar requisições HTTP).
2. Configure uma requisição:
   - Método: POST
   - URL: `https://SEU-PROJETO.vercel.app/api/seed`
   - Header: `x-seed-secret` = (o valor que você colocou em `SEED_SECRET`)
3. Envie. Deve retornar uma mensagem de sucesso.

### Opção B — Pelo terminal (curl)

Se tiver terminal disponível:

```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/seed -H "x-seed-secret: SEU_SEED_SECRET_AQUI"
```

Rode isso apenas uma vez. Rodar de novo não duplica dados (o seed usa upsert), mas não há necessidade de repetir.

Depois de rodar o seed, você pode remover a variável `SEED_SECRET` do projeto (Settings → Environment Variables → excluir) e fazer um novo deploy, para desativar o endpoint `/api/seed` permanentemente.

---

## Passo 7 — Acessar o Cultiva

Abra `https://SEU-PROJETO.vercel.app` e faça login com:

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | admin@cultiva.com | cultiva123 |
| RH | rh@cultiva.com | cultiva123 |
| Gestor | gestor@cultiva.com | cultiva123 |
| Colaborador | daniela@cultiva.com | cultiva123 |

Troque essas senhas depois do primeiro acesso (ou crie novos usuários e desative estes), já que o link é público.

---

## Estrutura do projeto (referência)

```
cultiva/
  api/
    index.js          - App Express, todas as rotas /api/*
    _lib/
      config/         - Conexao com o banco (Prisma)
      controllers/     - Logica de cada modulo
      middleware/       - Autenticacao JWT
      routes/            - Definicao das rotas por modulo
  prisma/
    schema.prisma      - Modelo de dados (34 tabelas)
    seed.js             - Script de seed (CLI)
    seedLogic.js          - Logica de seed compartilhada
  src/                     - Frontend React
  vercel.json              - Configuracao de build/rotas da Vercel
  package.json
```

## Atualizações futuras

Sempre que você alterar o código e enviar (push) para o GitHub, a Vercel faz o deploy automático da nova versão. Se você alterar o `schema.prisma` (adicionar campos/tabelas), será necessário sincronizar o banco — me peça ajuda quando isso for necessário.

## Desenvolvimento local (opcional)

Se quiser rodar localmente para testes antes de subir:

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```
