# Espada & vazio

Site do sistema de RPG de mesa **Espada & vazio** (Bleach, obra de fã sem fins lucrativos): livro de regras com busca, e em breve fichas, campanhas e ferramentas do Mestre.

## Rodar

```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase
npm run dev
```

## Scripts

- `npm run dev` — servidor local
- `npm run build` — build de produção
- `npm run typecheck` — checagem de tipos
- `npm run livro` — regenera os capítulos (`src/content/livro`) a partir do PDF

## Pilha

React + TypeScript + Vite, Supabase (banco e contas), Vercel (hospedagem).
