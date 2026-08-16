const telaLogin = document.getElementById("tela-login");
const telaLista = document.getElementById("tela-lista");
const telaForm = document.getElementById("tela-form");

const formLogin = document.getElementById("form-login");
const btnSair = document.getElementById("btn-sair");
const btnNovoPost = document.getElementById("btn-novo-post");
const btnCancelarForm = document.getElementById("btn-cancelar-form");
const listaPosts = document.getElementById("lista-posts");
const formPost = document.getElementById("form-post");
const tituloForm = document.getElementById("titulo-form");

let editandoSlug = null; // null = criando um post novo

function mostrarTela(tela) {
  [telaLogin, telaLista, telaForm].forEach((t) => t.classList.add("escondido"));
  tela.classList.remove("escondido");
}

// ---------- Login ----------
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const senha = document.getElementById("campo-senha").value;
  try {
    await api("/api/auth/login", { method: "POST", body: JSON.stringify({ senha }) });
    formLogin.reset();
    await abrirLista();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
});

btnSair.addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  mostrarTela(telaLogin);
});

// ---------- Lista de posts ----------
async function abrirLista() {
  mostrarTela(telaLista);
  await carregarListaPosts();
}

async function carregarListaPosts() {
  listaPosts.innerHTML = "Carregando...";
  try {
    const posts = await api("/api/posts");
    if (posts.length === 0) {
      listaPosts.innerHTML = `<div class="empty-state">Nenhum post ainda. Clica em "Novo post" pra criar o primeiro!</div>`;
      return;
    }
    listaPosts.innerHTML = posts
      .map(
        (p) => `
      <div class="admin-post-row" data-slug="${p.slug}">
        <div class="info">
          <strong>${escapeHTML(p.titulo)}</strong>
          <span>${formatarData(p.data)} · ${escapeHTML(p.autoria)}</span>
        </div>
        <div class="row-actions">
          <button class="btn btn-outline btn-editar" data-slug="${p.slug}">Editar</button>
          <button class="btn btn-danger btn-apagar" data-slug="${p.slug}">Apagar</button>
        </div>
      </div>`
      )
      .join("");
  } catch (err) {
    listaPosts.innerHTML = `<div class="empty-state">Não deu pra carregar os posts.</div>`;
  }
}

listaPosts.addEventListener("click", async (e) => {
  const slug = e.target.dataset.slug;
  if (!slug) return;

  if (e.target.classList.contains("btn-editar")) {
    abrirFormEdicao(slug);
  }

  if (e.target.classList.contains("btn-apagar")) {
    if (!confirm("Tem certeza que quer apagar esse post? Essa ação não tem volta.")) return;
    try {
      await api(`/api/posts/${encodeURIComponent(slug)}`, { method: "DELETE" });
      mostrarToast("Post apagado.");
      carregarListaPosts();
    } catch (err) {
      mostrarToast(err.message, "erro");
    }
  }
});

// ---------- Upload de áudio ----------
const campoAudioArquivo = document.getElementById("campo-audio-arquivo");
const statusUploadAudio = document.getElementById("status-upload-audio");

campoAudioArquivo.addEventListener("change", async () => {
  const arquivo = campoAudioArquivo.files[0];
  if (!arquivo) return;

  statusUploadAudio.textContent = "Enviando...";
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || "Erro ao enviar o arquivo.");

    formPost.audio.value = dados.url;
    statusUploadAudio.textContent = `✓ Enviado: ${arquivo.name}`;
    mostrarToast("Áudio enviado!");
  } catch (err) {
    statusUploadAudio.textContent = "";
    mostrarToast(err.message, "erro");
  }
});

// ---------- Formulário (criar/editar) ----------
btnNovoPost.addEventListener("click", () => abrirFormNovo());
btnCancelarForm.addEventListener("click", () => abrirLista());

function abrirFormNovo() {
  editandoSlug = null;
  tituloForm.textContent = "Novo post";
  formPost.reset();
  document.getElementById("grupos-links").innerHTML = "";
  adicionarGrupo();
  document.getElementById("campo-imagens").value = "";
  document.getElementById("campo-audio-arquivo").value = "";
  document.getElementById("status-upload-audio").textContent = "";
  atualizarListaCategorias();
  mostrarTela(telaForm);
}

async function atualizarListaCategorias() {
  try {
    const posts = await api("/api/posts");
    const categorias = [...new Set(posts.map((p) => p.categoria).filter(Boolean))];
    const datalist = document.getElementById("lista-categorias");
    datalist.innerHTML = categorias.map((c) => `<option value="${escapeHTML(c)}"></option>`).join("");
  } catch {
    // silencioso — não é crítico se não carregar as sugestões
  }
}

async function abrirFormEdicao(slug) {
  try {
    const post = await api(`/api/posts/${encodeURIComponent(slug)}`);
    editandoSlug = slug;
    tituloForm.textContent = `Editando: ${post.titulo}`;

    formPost.slug.value = post.slug;
    formPost.titulo.value = post.titulo;
    formPost.introducao.value = post.introducao;
    formPost.data.value = post.data ? post.data.substring(0, 10) : "";
    formPost.autoria.value = post.autoria;
    formPost.categoria.value = post.categoria || "";
    formPost.capa.value = post.capa || "";
    formPost.video1.value = post.video1 || "";
    formPost.video2.value = post.video2 || "";
    formPost.audio.value = post.audio || "";
    formPost.fontes.value = post.fontes || "";
    formPost.referencias.value = post.referencias;
    document.getElementById("campo-imagens").value = (post.imagens || []).join("\n");
    document.getElementById("campo-audio-arquivo").value = "";
    document.getElementById("status-upload-audio").textContent = "";

    const gruposContainer = document.getElementById("grupos-links");
    gruposContainer.innerHTML = "";
    const grupos = post.grupos_links || [];
    if (grupos.length === 0) {
      adicionarGrupo();
    } else {
      grupos.forEach((g) => adicionarGrupo(g.titulo, g.links || []));
    }

    atualizarListaCategorias();
    mostrarTela(telaForm);
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

let contadorGrupos = 0;

function adicionarGrupo(titulo = "", links = []) {
  contadorGrupos++;
  const id = `grupo-${contadorGrupos}`;
  const container = document.getElementById("grupos-links");

  const grupo = document.createElement("div");
  grupo.className = "eixo-editor grupo-links-item";
  grupo.dataset.grupoId = id;
  grupo.innerHTML = `
    <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.75rem">
      <input type="text" class="grupo-titulo" placeholder="Nome do grupo (ex: Mídia, Multimídia, Hipermídia...)" value="${escapeHTML(titulo)}" style="flex:1" />
      <button type="button" class="btn-remover-grupo" title="Remover grupo inteiro">✕</button>
    </div>
    <div class="grupo-links-rows"></div>
    <button type="button" class="btn btn-outline btn-add-link-grupo">+ Adicionar link</button>
  `;

  grupo.querySelector(".btn-remover-grupo").addEventListener("click", () => grupo.remove());
  grupo.querySelector(".btn-add-link-grupo").addEventListener("click", () =>
    adicionarLinkRow(grupo.querySelector(".grupo-links-rows"))
  );

  container.appendChild(grupo);

  const linhas = grupo.querySelector(".grupo-links-rows");
  if (links.length === 0) {
    adicionarLinkRow(linhas);
  } else {
    links.forEach((l) => adicionarLinkRow(linhas, l.titulo, l.url));
  }
}

document.getElementById("btn-add-grupo").addEventListener("click", () => adicionarGrupo());

function adicionarLinkRow(container, titulo = "", url = "") {
  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `
    <input type="text" placeholder="Título do link" class="link-titulo" value="${escapeHTML(titulo)}" />
    <input type="url" placeholder="https://..." class="link-url" value="${escapeHTML(url)}" />
    <button type="button" class="btn-remover-link" title="Remover">✕</button>
  `;
  row.querySelector(".btn-remover-link").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function coletarGruposLinks() {
  const grupos = [];
  document.querySelectorAll(".grupo-links-item").forEach((grupo) => {
    const titulo = grupo.querySelector(".grupo-titulo").value.trim();
    const links = [];
    grupo.querySelectorAll(".link-row").forEach((linha) => {
      const linkTitulo = linha.querySelector(".link-titulo").value.trim();
      const linkUrl = linha.querySelector(".link-url").value.trim();
      if (linkUrl) links.push({ titulo: linkTitulo || linkUrl, url: linkUrl });
    });
    if (titulo && links.length > 0) {
      grupos.push({ titulo, links });
    }
  });
  return grupos;
}

formPost.addEventListener("submit", async (e) => {
  e.preventDefault();

  const corpo = {
    slug: formPost.slug.value.trim(),
    titulo: formPost.titulo.value.trim(),
    introducao: formPost.introducao.value.trim(),
    data: formPost.data.value || null,
    autoria: formPost.autoria.value,
    categoria: formPost.categoria.value.trim() || "Geral",
    capa: formPost.capa.value.trim(),
    video1: formPost.video1.value.trim(),
    video2: formPost.video2.value.trim(),
    audio: formPost.audio.value.trim(),
    fontes: formPost.fontes.value.trim(),
    referencias: formPost.referencias.value.trim(),
    imagens: document
      .getElementById("campo-imagens")
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    grupos_links: coletarGruposLinks(),
  };

  try {
    if (editandoSlug) {
      await api(`/api/posts/${encodeURIComponent(editandoSlug)}`, {
        method: "PUT",
        body: JSON.stringify(corpo),
      });
      mostrarToast("Post atualizado!");
    } else {
      await api("/api/posts", { method: "POST", body: JSON.stringify(corpo) });
      mostrarToast("Post publicado!");
    }
    abrirLista();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
});

// ---------- Inicialização ----------
(async function iniciar() {
  try {
    const { autenticado } = await api("/api/auth/status");
    if (autenticado) {
      abrirLista();
    } else {
      mostrarTela(telaLogin);
    }
  } catch {
    mostrarTela(telaLogin);
  }
})();