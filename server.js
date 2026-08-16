require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Pasta de uploads (áudios, imagens enviados pela área restrita) ----------
const PASTA_UPLOADS = path.join(__dirname, "public", "uploads");
fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PASTA_UPLOADS),
  filename: (req, file, cb) => {
    const sufixo = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${sufixo}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const permitidos = /\.(mp3|wav|ogg|m4a|jpg|jpeg|png|gif|webp)$/i;
    if (!permitidos.test(file.originalname)) {
      return cb(new Error("Tipo de arquivo não permitido."));
    }
    cb(null, true);
  },
});

// ---------- Banco de dados ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------- Middlewares ----------
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "troque_essa_chave",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

function exigirAutenticacao(req, res, next) {
  if (req.session && req.session.autenticado) return next();
  return res.status(401).json({ erro: "Não autenticado." });
}

// ---------- Auth ----------
app.get("/api/auth/status", (req, res) => {
  res.json({ autenticado: !!(req.session && req.session.autenticado) });
});

app.post("/api/auth/login", (req, res) => {
  const { senha } = req.body || {};
  const esperada = process.env.ADMIN_PASSWORD;

  if (!esperada) {
    return res.status(500).json({ erro: "ADMIN_PASSWORD não configurada no servidor." });
  }
  if (senha === esperada) {
    req.session.autenticado = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ erro: "Senha incorreta." });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ---------- Upload de arquivos (só área restrita) ----------
app.post("/api/upload", exigirAutenticacao, (req, res) => {
  upload.single("arquivo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ erro: err.message || "Erro ao enviar o arquivo." });
    }
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }
    res.json({ ok: true, url: `/uploads/${req.file.filename}` });
  });
});

// ---------- Posts (leitura pública) ----------
app.get("/api/posts", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT slug, titulo, introducao, data, autoria, categoria, capa
       FROM posts ORDER BY data DESC, criado_em DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar posts." });
  }
});

app.get("/api/posts/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM posts WHERE slug = $1`, [
      req.params.slug,
    ]);
    if (rows.length === 0) return res.status(404).json({ erro: "Post não encontrado." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar o post." });
  }
});

// ---------- Posts (escrita — só área restrita) ----------
app.post("/api/posts", exigirAutenticacao, async (req, res) => {
  const p = req.body || {};
  if (!p.slug?.trim() || !p.titulo?.trim() || !p.introducao?.trim() || !p.referencias?.trim()) {
    return res
      .status(400)
      .json({ erro: "Slug, título, introdução e referências são obrigatórios." });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO posts
        (slug, titulo, introducao, data, autoria, categoria, capa, video1, video2,
         grupos_links, imagens, audio, fontes, referencias)
       VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE),$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING slug`,
      [
        p.slug.trim(),
        p.titulo,
        p.introducao,
        p.data || null,
        p.autoria || "Ambas",
        p.categoria?.trim() || "Geral",
        p.capa || null,
        p.video1 || null,
        p.video2 || null,
        JSON.stringify(p.grupos_links || []),
        JSON.stringify(p.imagens || []),
        p.audio || null,
        p.fontes || null,
        p.referencias,
      ]
    );
    res.status(201).json({ ok: true, slug: rows[0].slug });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ erro: "Já existe um post com esse slug." });
    }
    res.status(500).json({ erro: "Erro ao criar o post." });
  }
});

app.put("/api/posts/:slug", exigirAutenticacao, async (req, res) => {
  const p = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE posts SET
        slug = $1, titulo = $2, introducao = $3, data = $4, autoria = $5, categoria = $6,
        capa = $7, video1 = $8, video2 = $9, grupos_links = $10, imagens = $11,
        audio = $12, fontes = $13, referencias = $14, atualizado_em = now()
       WHERE slug = $15
       RETURNING slug`,
      [
        p.slug.trim(),
        p.titulo,
        p.introducao,
        p.data || null,
        p.autoria || "Ambas",
        p.categoria?.trim() || "Geral",
        p.capa || null,
        p.video1 || null,
        p.video2 || null,
        JSON.stringify(p.grupos_links || []),
        JSON.stringify(p.imagens || []),
        p.audio || null,
        p.fontes || null,
        p.referencias,
        req.params.slug,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ erro: "Post não encontrado." });
    res.json({ ok: true, slug: rows[0].slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar o post." });
  }
});

app.delete("/api/posts/:slug", exigirAutenticacao, async (req, res) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM posts WHERE slug = $1`, [
      req.params.slug,
    ]);
    if (rowCount === 0) return res.status(404).json({ erro: "Post não encontrado." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao apagar o post." });
  }
});

app.listen(PORT, () => {
  console.log(`Blog rodando em http://localhost:${PORT}`);
});