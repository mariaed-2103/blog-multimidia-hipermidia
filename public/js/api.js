// Funções compartilhadas: chamadas à API e pedacinhos de HTML reutilizáveis

async function api(caminho, opcoes = {}) {
  const res = await fetch(caminho, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...opcoes,
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(dados.erro || "Algo deu errado. Tenta de novo.");
  }
  return dados;
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const d = new Date(dataISO + (dataISO.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function resumoSemMarkdown(texto = "") {
  return texto
    .replace(/^#{1,6}\s+/gm, "") // títulos
    .replace(/\*\*(.*?)\*\*/g, "$1") // negrito
    .replace(/\*(.*?)\*/g, "$1") // itálico
    .replace(/^[-*]\s+/gm, "") // marcadores de lista
    .replace(/\n+/g, " ") // quebras de linha viram espaço
    .trim();
}

function cardPost(post) {
  const capa = post.capa
    ? `style="background-image:url('${post.capa}')"`
    : "";
  return `
    <a class="post-card" data-categoria="${escapeHTML(post.categoria || "Geral")}" href="/post.html?slug=${encodeURIComponent(post.slug)}">
      <div class="cover" ${capa}>
        <span class="chip">${escapeHTML(post.categoria || "Geral")}</span>
      </div>
      <div class="content">
        <span class="meta">${formatarData(post.data)} · ${escapeHTML(post.autoria)}</span>
        <h3>${escapeHTML(post.titulo)}</h3>
        <p>${escapeHTML(resumoSemMarkdown(post.introducao))}</p>
        <span class="read-more">Bora ver esse post →</span>
      </div>
    </a>
  `;
}

function escapeHTML(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Monta a barra de abas com todas as categorias/projetos encontrados nos posts.
// Ao clicar numa aba, filtra os cards já renderizados no grid (sem nova chamada à API).
function montarBarraCategorias(posts, containerId, gridId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const categorias = [...new Set(posts.map((p) => p.categoria || "Geral"))];

  if (categorias.length === 0) {
    container.innerHTML = "";
    return;
  }

  const pills = ["Todos", ...categorias]
    .map(
      (c, i) =>
        `<button class="categoria-pill ${i === 0 ? "ativa" : ""}" data-categoria="${escapeHTML(c)}">${escapeHTML(c)}</button>`
    )
    .join("");

  container.innerHTML = `<div class="wrap">${pills}</div>`;

  container.querySelectorAll(".categoria-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".categoria-pill").forEach((b) => b.classList.remove("ativa"));
      btn.classList.add("ativa");
      const alvo = btn.dataset.categoria;
      document.querySelectorAll(`#${gridId} .post-card`).forEach((card) => {
        const mostrar = alvo === "Todos" || card.dataset.categoria === alvo;
        card.style.display = mostrar ? "" : "none";
      });
    });
  });
}

function mostrarToast(mensagem, tipo = "ok") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.className = `toast mostrar ${tipo === "erro" ? "erro" : ""}`;
  setTimeout(() => toast.classList.remove("mostrar"), 3200);
}