async function carregarHome() {
  const grid = document.getElementById("post-grid");
  try {
    const posts = await api("/api/posts");
    if (posts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Ainda não tem nenhum post por aqui. 👀<br>Assim que a gente publicar o primeiro, ele aparece nessa página.</p>
        </div>`;
      return;
    }
    montarBarraCategorias(posts, "categorias-bar", "post-grid");
    grid.innerHTML = posts.slice(0, 6).map(cardPost).join("");
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Não deu pra carregar os posts agora. Tenta recarregar a página.</div>`;
  }
}

carregarHome();
