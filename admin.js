/* ==========================================================================
   BQCS – Comércio & Serviços
   admin.js — lógica do painel administrativo (grampo.html)

   Responsável por:
   - Proteção simples por password (apenas demonstração, NÃO é segurança real)
   - Cadastrar, editar e remover produtos
   - Guardar tudo no localStorage, na mesma chave usada pela página principal
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* CONFIGURAÇÃO                                                        */
  /* ------------------------------------------------------------------ */

  // Palavra-passe simples de demonstração — muda isto antes de partilhares o link.
  // Importante: isto corre no browser do cliente, por isso NÃO protege dados
  // sensíveis a sério. Serve apenas para afastar visitantes casuais enquanto
  // não existir um backend com autenticação real.
  const PASSWORD_ADMIN = "bqcs2026";

  const CHAVE_PRODUTOS = "bqcs_produtos";
  const CHAVE_SESSAO = "bqcs_admin_sessao";

  let produtos = [];
  let modoImagem = "url"; // "url" ou "upload"
  let imagemUploadDataUrl = "";

  /* ------------------------------------------------------------------ */
  /* PROTEÇÃO POR PASSWORD                                              */
  /* ------------------------------------------------------------------ */

  function configurarEcraPassword() {
    const telaPassword = document.getElementById("tela-password");
    const painelConteudo = document.getElementById("painel-conteudo");
    const campoPassword = document.getElementById("campo-password");
    const botaoEntrar = document.getElementById("botao-entrar");
    const erro = document.getElementById("erro-password");

    // Se já houver sessão válida neste navegador, entra directamente
    if (sessionStorage.getItem(CHAVE_SESSAO) === "ok") {
      telaPassword.style.display = "none";
      painelConteudo.style.display = "block";
      iniciarPainel();
      return;
    }

    function tentarEntrar() {
      if (campoPassword.value === PASSWORD_ADMIN) {
        sessionStorage.setItem(CHAVE_SESSAO, "ok");
        telaPassword.style.display = "none";
        painelConteudo.style.display = "block";
        iniciarPainel();
      } else {
        erro.classList.add("visivel");
      }
    }

    botaoEntrar.addEventListener("click", tentarEntrar);
    campoPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tentarEntrar();
    });
  }

  /* ------------------------------------------------------------------ */
  /* ARMAZENAMENTO                                                       */
  /* ------------------------------------------------------------------ */

  function carregarProdutos() {
    const dados = localStorage.getItem(CHAVE_PRODUTOS);
    produtos = dados ? JSON.parse(dados) : [];
  }

  function guardarProdutos() {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
  }

  function formatarKz(valor) {
    const numero = Number(valor) || 0;
    return numero.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " Kz";
  }

  function gerarId() {
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ------------------------------------------------------------------ */
  /* ALTERNAR ENTRE URL DE IMAGEM E FICHEIRO CARREGADO                   */
  /* ------------------------------------------------------------------ */

  function configurarAlternadorImagem() {
    const botaoUrl = document.getElementById("modo-url");
    const botaoUpload = document.getElementById("modo-upload");
    const campoUrl = document.getElementById("produto-imagem-url");
    const campoFicheiro = document.getElementById("produto-imagem-ficheiro");
    const preVisualizacao = document.getElementById("pre-visualizacao");

    botaoUrl.addEventListener("click", () => {
      modoImagem = "url";
      botaoUrl.classList.add("activo");
      botaoUpload.classList.remove("activo");
      campoUrl.style.display = "block";
      campoFicheiro.style.display = "none";
    });

    botaoUpload.addEventListener("click", () => {
      modoImagem = "upload";
      botaoUpload.classList.add("activo");
      botaoUrl.classList.remove("activo");
      campoUrl.style.display = "none";
      campoFicheiro.style.display = "block";
    });

    campoUrl.addEventListener("input", () => {
      if (campoUrl.value) {
        preVisualizacao.src = campoUrl.value;
        preVisualizacao.style.display = "block";
      }
    });

    campoFicheiro.addEventListener("change", () => {
      const ficheiro = campoFicheiro.files[0];
      if (!ficheiro) return;
      const leitor = new FileReader();
      leitor.onload = () => {
        imagemUploadDataUrl = leitor.result;
        preVisualizacao.src = imagemUploadDataUrl;
        preVisualizacao.style.display = "block";
      };
      leitor.readAsDataURL(ficheiro);
    });
  }

  /* ------------------------------------------------------------------ */
  /* LISTA DE CATEGORIAS (sugestões no datalist)                        */
  /* ------------------------------------------------------------------ */

  function actualizarListaCategorias() {
    const datalist = document.getElementById("lista-categorias");
    const categorias = [...new Set(produtos.map((p) => p.categoria))];
    datalist.innerHTML = categorias.map((c) => `<option value="${c}">`).join("");
  }

  /* ------------------------------------------------------------------ */
  /* TABELA DE PRODUTOS CADASTRADOS                                     */
  /* ------------------------------------------------------------------ */

  function desenharTabela() {
    const corpo = document.getElementById("corpo-tabela-produtos");
    const contagem = document.getElementById("contagem-produtos");
    contagem.textContent = produtos.length;

    if (produtos.length === 0) {
      corpo.innerHTML =
        '<tr><td colspan="5" style="color:var(--creme-suave);">Ainda não há produtos cadastrados.</td></tr>';
      return;
    }

    corpo.innerHTML = produtos
      .map(
        (p) => `
      <tr>
        <td><img src="${p.imagem}" alt="${p.nome}"></td>
        <td>${p.nome}</td>
        <td>${p.categoria}</td>
        <td>${formatarKz(p.preco)}</td>
        <td>
          <div class="acoes-linha">
            <button class="botao-icone" data-accao="editar" data-id="${p.id}" aria-label="Editar ${p.nome}">
              <svg class="icone" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="botao-icone perigo" data-accao="remover" data-id="${p.id}" aria-label="Remover ${p.nome}">
              <svg class="icone" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`
      )
      .join("");

    corpo.querySelectorAll('[data-accao="editar"]').forEach((botao) => {
      botao.addEventListener("click", () => carregarProdutoParaEdicao(botao.dataset.id));
    });
    corpo.querySelectorAll('[data-accao="remover"]').forEach((botao) => {
      botao.addEventListener("click", () => removerProduto(botao.dataset.id));
    });
  }

  /* ------------------------------------------------------------------ */
  /* CADASTRAR / EDITAR / REMOVER                                       */
  /* ------------------------------------------------------------------ */

  function limparFormulario() {
    document.getElementById("formulario-produto").reset();
    document.getElementById("produto-id").value = "";
    document.getElementById("pre-visualizacao").style.display = "none";
    document.getElementById("titulo-formulario").textContent = "Cadastrar novo produto";
    document.getElementById("botao-cancelar-edicao").style.display = "none";
    imagemUploadDataUrl = "";
  }

  function carregarProdutoParaEdicao(id) {
    const produto = produtos.find((p) => p.id === id);
    if (!produto) return;

    document.getElementById("produto-id").value = produto.id;
    document.getElementById("produto-nome").value = produto.nome;
    document.getElementById("produto-preco").value = produto.preco;
    document.getElementById("produto-categoria").value = produto.categoria;
    document.getElementById("produto-descricao").value = produto.descricao || "";
    document.getElementById("produto-imagem-url").value = produto.imagem;
    document.getElementById("pre-visualizacao").src = produto.imagem;
    document.getElementById("pre-visualizacao").style.display = "block";

    modoImagem = "url";
    document.getElementById("modo-url").classList.add("activo");
    document.getElementById("modo-upload").classList.remove("activo");
    document.getElementById("produto-imagem-url").style.display = "block";
    document.getElementById("produto-imagem-ficheiro").style.display = "none";

    document.getElementById("titulo-formulario").textContent = "Editar produto";
    document.getElementById("botao-cancelar-edicao").style.display = "inline-block";

    document.getElementById("formulario-produto").scrollIntoView({ behavior: "smooth" });
  }

  function removerProduto(id) {
    const produto = produtos.find((p) => p.id === id);
    if (!produto) return;
    const confirmar = window.confirm(`Remover o produto "${produto.nome}"?`);
    if (!confirmar) return;

    produtos = produtos.filter((p) => p.id !== id);
    guardarProdutos();
    desenharTabela();
    actualizarListaCategorias();
  }

  function tratarSubmissaoFormulario(evento) {
    evento.preventDefault();

    const id = document.getElementById("produto-id").value;
    const nome = document.getElementById("produto-nome").value.trim();
    const preco = document.getElementById("produto-preco").value;
    const categoria = document.getElementById("produto-categoria").value.trim();
    const descricao = document.getElementById("produto-descricao").value.trim();
    const urlImagem = document.getElementById("produto-imagem-url").value.trim();

    let imagem;
    if (modoImagem === "upload" && imagemUploadDataUrl) {
      imagem = imagemUploadDataUrl;
    } else if (urlImagem) {
      imagem = urlImagem;
    } else {
      imagem = "https://placehold.co/500x625/14120d/d4af37?text=BQCS";
    }

    if (!nome || !preco || !categoria) return;

    if (id) {
      // Edição de produto existente
      const indice = produtos.findIndex((p) => p.id === id);
      if (indice !== -1) {
        produtos[indice] = { id, nome, preco: Number(preco), categoria, descricao, imagem };
      }
    } else {
      // Novo produto
      produtos.push({
        id: gerarId(),
        nome,
        preco: Number(preco),
        categoria,
        descricao,
        imagem,
      });
    }

    guardarProdutos();
    desenharTabela();
    actualizarListaCategorias();
    limparFormulario();
  }

  /* ------------------------------------------------------------------ */
  /* INICIALIZAÇÃO DO PAINEL (após password correcta)                   */
  /* ------------------------------------------------------------------ */

  function iniciarPainel() {
    carregarProdutos();
    desenharTabela();
    actualizarListaCategorias();
    configurarAlternadorImagem();

    document
      .getElementById("formulario-produto")
      .addEventListener("submit", tratarSubmissaoFormulario);

    document
      .getElementById("botao-cancelar-edicao")
      .addEventListener("click", limparFormulario);
  }

  document.addEventListener("DOMContentLoaded", configurarEcraPassword);
})();
