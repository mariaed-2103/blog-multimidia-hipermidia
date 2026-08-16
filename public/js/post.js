function paraEmbedYoutube(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1);
    } else if (u.searchParams.get("v")) {
      id = u.searchParams.get("v");
    } else if (u.pathname.includes("/embed/")) {
      return url; // já é um link de embed
    }
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}

function blocoVideos(post) {
  const videos = [post.video1, post.video2].filter(Boolean);
  if (videos.length === 0) return "";
  return `
    <section>
      <h2 class="section-title">Vídeos</h2>
      <div class="videos-grid">
        ${videos
          .map(
            (v) => `
          <div class="video-embed">
            <iframe src="${paraEmbedYoutube(v)}" title="Vídeo do post" allowfullscreen loading="lazy"></iframe>
          </div>`
          )
          .join("")}
      </div>
    </section>`;
}

const ICONES_CONHECIDOS = {
  "mídia": "📡",
  "multimídia": "🎛️",
  "hipermídia": "🕸️",
};

function blocoGrupo(grupo, indice) {
  const cor = ["midia", "multimidia", "hipermidia"][indice % 3];
  const icone = ICONES_CONHECIDOS[grupo.titulo.trim().toLowerCase()] || "🔗";
  const lista = `<ul>${grupo.links
    .map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">↗ ${escapeHTML(l.titulo || l.url)}</a></li>`)
    .join("")}</ul>`;
  return `
    <div class="eixo-card ${cor}">
      <h3>${icone} ${escapeHTML(grupo.titulo)}</h3>
      ${lista}
    </div>`;
}

function blocoLinks(post) {
  const grupos = (post.grupos_links || []).filter((g) => g.links && g.links.length > 0);
  if (grupos.length === 0) return "";
  return `
    <section>
      <h2 class="section-title">Links por eixo</h2>
      <div class="eixos-grid">
        ${grupos.map((g, i) => blocoGrupo(g, i)).join("")}
      </div>
    </section>`;
}

function blocoImagens(post) {
  if (!post.imagens || post.imagens.length === 0) return "";
  return `
    <section>
      <h2 class="section-title">Imagens</h2>
      <div class="imagens-grid">
        ${post.imagens.map((src) => `<img src="${src}" alt="Imagem do post" loading="lazy" />`).join("")}
      </div>
    </section>`;
}

function blocoAudio(post) {
  if (!post.audio) return "";
  return `
    <section>
      <h2 class="section-title">Áudio / Podcast</h2>
      <audio controls src="${post.audio}"></audio>
    </section>`;
}

function blocoInfo(post) {
  const paraHTML = (texto) => escapeHTML(texto).replaceAll("\n", "<br>");
  const partes = [];
  if (post.fontes) {
    partes.push(`<p><strong>Fontes tipográficas:</strong><br>${paraHTML(post.fontes)}</p>`);
  }
  partes.push(`<p><strong>Referências:</strong><br>${paraHTML(post.referencias)}</p>`);
  partes.push(`<p><strong>Créditos:</strong> ${escapeHTML(post.autoria)}</p>`);
  return `
    <section>
      <h2 class="section-title">Referências e créditos</h2>
      <div class="info-box">${partes.join("")}</div>
    </section>`;
}

async function carregarPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const container = document.getElementById("post-container");

  if (!slug) {
    container.innerHTML = `<div class="empty-state">Post não encontrado. <a href="/posts.html">Voltar para os posts</a></div>`;
    return;
  }

  try {
    const post = await api(`/api/posts/${encodeURIComponent(slug)}`);
    document.title = `${post.titulo} · Blog Multimídia e Hipermídia`;

    container.innerHTML = `
      <div class="post-hero wrap">
        <span class="categoria-badge">${escapeHTML(post.categoria || "Geral")}</span>
        <h1>${escapeHTML(post.titulo)}</h1>
        <div class="meta-row">
          <span>${formatarData(post.data)} · por ${escapeHTML(post.autoria)}</span>
        </div>
      </div>
      ${post.capa ? `<div class="wrap"><div class="post-cover"><img src="${post.capa}" alt="Capa do post" /></div></div>` : ""}
      <div class="wrap"><div class="intro markdown-body">${marked.parse(post.introducao || "")}</div></div>
      <div class="wrap post-body">
        ${blocoVideos(post)}
        ${blocoLinks(post)}
        ${blocoImagens(post)}
        ${blocoAudio(post)}
        ${blocoInfo(post)}
        <p style="margin-top:2rem"><a class="btn btn-outline" href="/posts.html">← Ver todos os posts</a></p>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="wrap"><div class="empty-state">Não achamos esse post. <a href="/posts.html">Voltar para os posts</a></div></div>`;
  }
}

carregarPost();