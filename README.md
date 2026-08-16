# Blog · Multimídia e Hipermídia

Blog feito por **Maria Eduarda e Júlia** para a matéria de Multimídia e Hipermídia.

- **Front-end:** HTML, CSS e JavaScript puro (sem framework)
- **Back-end:** Node.js + Express
- **Banco de dados:** PostgreSQL

Todo mundo pode ler o site livremente. Só quem sabe a senha da área restrita (`/admin.html`) consegue criar, editar ou apagar posts.

---

## 1. Pré-requisitos

- [Node.js](https://nodejs.org/) instalado (versão 18 ou mais recente)
- [PostgreSQL](https://www.postgresql.org/download/) instalado e rodando na sua máquina

## 2. Criar o banco de dados

Abra o terminal do PostgreSQL (ou use uma ferramenta visual como o pgAdmin / DBeaver) e crie um banco novo:

```sql
CREATE DATABASE blog_multimidia;
```

Depois, rode o arquivo `schema.sql` deste projeto para criar a tabela de posts:

```bash
psql -U postgres -d blog_multimidia -f schema.sql
```

(Troque `postgres` pelo seu usuário do Postgres, se for diferente.)

## 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Abra o `.env` e preencha:

- `DATABASE_URL` — string de conexão com o seu banco (usuário, senha, nome do banco)
- `ADMIN_PASSWORD` — a senha que você e a Júlia vão usar para entrar na área restrita
- `SESSION_SECRET` — um texto longo e aleatório (pode gerar com o comando abaixo)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Instalar as dependências e rodar

```bash
npm install
npm start
```

O site vai estar disponível em **http://localhost:3000**.

Se quiser que o servidor reinicie sozinho a cada alteração no código, use:

```bash
npm run dev
```

## 5. Como usar

- **Página inicial (`/`):** hero de abertura + últimos posts
- **Posts (`/posts.html`):** lista de todos os posts publicados
- **Sobre (`/sobre.html`):** projeto, disciplina e apresentação das alunas
- **Área restrita (`/admin.html`):** login com a senha do `.env`, e ali dá pra criar, editar e apagar posts

Cada post tem: título, introdução, até 2 vídeos, links organizados em três blocos (Mídia, Multimídia, Hipermídia), imagens, áudio/podcast, fontes tipográficas usadas e referências.

## 6. Estrutura de pastas

```
blog-multimidia/
├── server.js          → servidor Express + rotas da API
├── schema.sql          → script de criação da tabela no Postgres
├── .env.example         → modelo do arquivo de variáveis de ambiente
├── public/
│   ├── index.html        → página inicial
│   ├── posts.html        → listagem de posts
│   ├── post.html          → página de um post individual
│   ├── sobre.html          → página "Sobre"
│   ├── admin.html           → área restrita
│   ├── css/style.css         → toda a identidade visual do site
│   └── js/
│       ├── api.js              → funções compartilhadas (chamadas à API)
│       ├── home.js              → lógica da página inicial
│       ├── posts.js              → lógica da listagem de posts
│       ├── post.js                → lógica da página de um post
│       └── admin.js                → lógica da área restrita
```

## 7. Publicando o site (deixar acessível pra qualquer pessoa)

Pra colocar o site no ar de verdade, você precisa de um serviço que rode Node.js + PostgreSQL, como o [Render](https://render.com) ou o [Railway](https://railway.app) (ambos têm planos gratuitos). O passo geral é:

1. Suba o código para o GitHub (`git init`, `git add .`, `git commit`, `git push`)
2. Crie um banco PostgreSQL no serviço escolhido e rode o `schema.sql` nele
3. Crie um "Web Service" apontando para o seu repositório
4. Configure as mesmas variáveis do `.env` (`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`) no painel do serviço
5. O comando de start é `npm start`

Se quiser ajuda com esse passo quando chegar a hora, é só pedir!
