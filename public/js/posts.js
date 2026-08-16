async function carregarPosts() {
  const grid = document.getElementById("post-grid");
  try {
    const posts = await api("/api/posts");
    if (posts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Ainda não tem nenhum post publicado. Volta aqui em breve! ✨</p>
        </div>`;
      return;
    }
    montarBarraCategorias(posts, "categorias-bar", "post-grid");
    grid.innerHTML = posts.map(cardPost).join("");
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Não deu pra carregar os posts agora. Tenta recarregar a página.</div>`;
  }
}

carregarPosts();
