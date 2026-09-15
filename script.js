/* ==========================================================================
   BQCS – Comércio & Serviços
   script.js — lógica da página principal (index.html)

   Responsável por:
   - Carregar produtos do localStorage (partilhado com o painel /grampo.html)
   - Semear produtos de demonstração na primeira visita
   - Desenhar o catálogo em grelha, com filtros por categoria
   - Gerir a seleção de produtos do cliente
   - Construir e enviar a encomenda via WhatsApp
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* CONFIGURAÇÃO — ajusta aqui os dados reais da loja                  */
  /* ------------------------------------------------------------------ */

  // Número de WhatsApp da loja no formato internacional, só dígitos.
  // ATENÇÃO: confirma este número antes de publicar — substitui pelo
  // número real da BQCS (formato Angola: 244 + 9 dígitos, ex: 244923456789).
  const NUMERO_WHATSAPP = "244937874164";

  // Chave partilhada com o painel administrativo (grampo.html / admin.js)
  const CHAVE_PRODUTOS = "bqcs_produtos";

  /* ------------------------------------------------------------------ */
  /* PRODUTOS DE DEMONSTRAÇÃO (usados só se ainda não houver dados)     */
  /* ------------------------------------------------------------------ */

  const PRODUTOS_DEMO = [
    {
      id: "p1",
      nome: "Conjunto Alfaiataria Bege",
      preco: 32000,
      categoria: "Roupa Feminina",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Blazer e calça a condizer, tecido estruturado.",
    },
    {
      id: "p2",
      nome: "Camisa Social Branca",
      preco: 18500,
      categoria: "Roupa Masculina",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Algodão premium, corte slim, ideal para o dia a dia.",
    },
    {
      id: "p3",
      nome: "Vestido Midi Dourado",
      preco: 27500,
      categoria: "Roupa Feminina",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Caimento fluido, ideal para eventos e festas.",
    },
    {
      id: "p4",
      nome: "Ténis Urbano Preto",
      preco: 24000,
      categoria: "Calçado",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Sola em borracha, conforto para o uso diário.",
    },
    {
      id: "p5",
      nome: "Sapato Clássico Couro",
      preco: 38000,
      categoria: "Calçado",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Couro legítimo, acabamento fosco.",
    },
    {
      id: "p6",
      nome: "Casaco Trench Bege",
      preco: 45000,
      categoria: "Roupa Feminina",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Corte clássico, impermeável leve.",
    },
    {
      id: "p7",
      nome: "Calça Jeans Slim",
      preco: 15500,
      categoria: "Roupa Masculina",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Ganga resistente, elasticidade confortável.",
    },
    {
      id: "p8",
      nome: "Cinto Couro Dourado",
      preco: 9500,
      categoria: "Acessórios",
      imagem: "https://placehold.co/500x625/14120d/d4af37?text=BQCS",
      descricao: "Fivela metálica, acabamento premium.",
    },
  ];

  /* ------------------------------------------------------------------ */
  /* ESTADO                                                              */
  /* ------------------------------------------------------------------ */

  let produtos = [];
  let categoriaActiva = "Todos";
  // Guarda os IDs dos produtos seleccionados pelo cliente
  let seleccionados = new Set();

  /* ------------------------------------------------------------------ */
  /* ARMAZENAMENTO (localStorage partilhado com o painel admin)         */
  /* ------------------------------------------------------------------ */

  function carregarProdutos() {
    const dados = localStorage.getItem(CHAVE_PRODUTOS);
    if (dados) {
      try {
        produtos = JSON.parse(dados);
        return;
      } catch (erro) {
        console.error("Erro ao ler produtos do localStorage:", erro);
      }
    }
    // Se ainda não existir nada guardado, semeia com os produtos de demo
    produtos = PRODUTOS_DEMO;
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
  }

  /* ------------------------------------------------------------------ */
  /* FORMATAÇÃO DE MOEDA — Kwanza com separador de milhares             */
  /* ------------------------------------------------------------------ */

  function formatarKz(valor) {
    const numero = Number(valor) || 0;
    const comSeparador = numero
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return comSeparador + " Kz";
  }

  /* ------------------------------------------------------------------ */
  /* ÍCONES (SVG inline, sem dependência externa)                       */
  /* ------------------------------------------------------------------ */

  const ICONES = {
    carrinho:
      '<svg class="icone" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    check:
      '<svg class="icone" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    mais: '<svg class="icone" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    lixo: '<svg class="icone" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  };

  /* ------------------------------------------------------------------ */
  /* RENDER — FILTROS DE CATEGORIA                                      */
  /* ------------------------------------------------------------------ */

  function obterCategorias() {
    const categorias = new Set(produtos.map((p) => p.categoria));
    return ["Todos", ...categorias];
  }

  function desenharFiltros() {
    const contentor = document.getElementById("filtros");
    if (!contentor) return;
    const categorias = obterCategorias();

    contentor.innerHTML = categorias
      .map((cat) => {
        const activo = cat === categoriaActiva ? "activo" : "";
        return `<button class="filtro-chip ${activo}" data-categoria="${cat}">${cat}</button>`;
      })
      .join("");

    contentor.querySelectorAll(".filtro-chip").forEach((botao) => {
      botao.addEventListener("click", () => {
        categoriaActiva = botao.dataset.categoria;
        desenharFiltros();
        desenharCatalogo();
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* RENDER — GRELHA DE PRODUTOS                                        */
  /* ------------------------------------------------------------------ */

  function desenharCatalogo() {
    const grelha = document.getElementById("grelha-produtos");
    if (!grelha) return;

    const listaFiltrada =
      categoriaActiva === "Todos"
        ? produtos
        : produtos.filter((p) => p.categoria === categoriaActiva);

    if (listaFiltrada.length === 0) {
      grelha.innerHTML =
        '<p class="aviso-vazio">Ainda não há produtos nesta categoria.</p>';
      return;
    }

    grelha.innerHTML = listaFiltrada
      .map((produto) => {
        const activo = seleccionados.has(produto.id);
        return `
        <article class="cartao-produto" data-id="${produto.id}">
          <div class="cartao-produto__imagem">
            <span class="cartao-produto__categoria">${produto.categoria}</span>
            <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
          </div>
          <div class="cartao-produto__corpo">
            <h3 class="cartao-produto__nome">${produto.nome}</h3>
            <p class="cartao-produto__descricao">${produto.descricao || ""}</p>
            <div class="cartao-produto__rodape">
              <span class="cartao-produto__preco">${formatarKz(produto.preco)}</span>
              <button class="botao-seleccionar ${activo ? "seleccionado" : ""}" data-id="${produto.id}">
                ${activo ? ICONES.check : ICONES.mais}
                ${activo ? "Seleccionado" : "Seleccionar"}
              </button>
            </div>
          </div>
        </article>`;
      })
      .join("");

    grelha.querySelectorAll(".botao-seleccionar").forEach((botao) => {
      botao.addEventListener("click", () => {
        alternarSeleccao(botao.dataset.id);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* SELEÇÃO DE PRODUTOS                                                 */
  /* ------------------------------------------------------------------ */

  function alternarSeleccao(id) {
    if (seleccionados.has(id)) {
      seleccionados.delete(id);
    } else {
      seleccionados.add(id);
    }
    desenharCatalogo();
    desenharBarraSeleccao();
    desenharResumoEncomenda();
  }

  function removerSeleccao(id) {
    seleccionados.delete(id);
    desenharCatalogo();
    desenharBarraSeleccao();
    desenharResumoEncomenda();
  }

  function produtosSeleccionados() {
    return produtos.filter((p) => seleccionados.has(p.id));
  }

  function totalSeleccionado() {
    return produtosSeleccionados().reduce((soma, p) => soma + Number(p.preco), 0);
  }

  /* ------------------------------------------------------------------ */
  /* BARRA FLUTUANTE DE SELEÇÃO                                         */
  /* ------------------------------------------------------------------ */

  function desenharBarraSeleccao() {
    const barra = document.getElementById("barra-seleccao");
    const contagem = document.getElementById("barra-seleccao-contagem");
    if (!barra || !contagem) return;

    const qtd = seleccionados.size;
    if (qtd === 0) {
      barra.classList.remove("visivel");
      return;
    }
    barra.classList.add("visivel");
    contagem.innerHTML = `${ICONES.carrinho} <strong>${qtd}</strong> ${
      qtd === 1 ? "artigo seleccionado" : "artigos seleccionados"
    } · ${formatarKz(totalSeleccionado())}`;
  }

  /* ------------------------------------------------------------------ */
  /* RESUMO NO FORMULÁRIO DE ENCOMENDA                                   */
  /* ------------------------------------------------------------------ */

  function desenharResumoEncomenda() {
    const lista = document.getElementById("lista-resumo");
    const totalEl = document.getElementById("resumo-total-valor");
    const botaoEnviar = document.getElementById("botao-enviar-encomenda");
    if (!lista || !totalEl) return;

    const itens = produtosSeleccionados();

    if (itens.length === 0) {
      lista.innerHTML =
        '<li style="border:none;color:var(--creme-suave);">Nenhum produto seleccionado ainda. Escolha artigos no catálogo acima.</li>';
    } else {
      lista.innerHTML = itens
        .map(
          (p) => `
        <li>
          <span>${p.nome} — ${formatarKz(p.preco)}</span>
          <button type="button" class="remover-item" data-id="${p.id}" aria-label="Remover ${p.nome}">${ICONES.lixo}</button>
        </li>`
        )
        .join("");
    }

    totalEl.textContent = formatarKz(totalSeleccionado());

    if (botaoEnviar) {
      botaoEnviar.disabled = itens.length === 0;
    }

    lista.querySelectorAll(".remover-item").forEach((botao) => {
      botao.addEventListener("click", () => removerSeleccao(botao.dataset.id));
    });
  }

  /* ------------------------------------------------------------------ */
  /* ENVIO DA ENCOMENDA VIA WHATSAPP                                     */
  /* ------------------------------------------------------------------ */

  function tratarEnvioFormulario(evento) {
    evento.preventDefault();

    const nome = document.getElementById("campo-nome").value.trim();
    const contacto = document.getElementById("campo-contacto").value.trim();
    const local = document.getElementById("campo-local").value.trim();
    const nota = document.getElementById("campo-nota").value.trim();
    const itens = produtosSeleccionados();

    if (!nome || !contacto || !local || itens.length === 0) {
      const estado = document.getElementById("mensagem-estado");
      if (estado) {
        estado.textContent =
          "Por favor preencha o nome, o contacto, o local de entrega e seleccione pelo menos um produto.";
        estado.classList.add("visivel");
      }
      return;
    }

    // Constrói a mensagem organizada para o WhatsApp
    const linhasProdutos = itens
      .map((p, i) => `${i + 1}. ${p.nome} — ${formatarKz(p.preco)}`)
      .join("%0A");

    const mensagem =
      `*Nova encomenda — BQCS Comércio e Serviços*%0A%0A` +
      `*Cliente:* ${nome}%0A` +
      `*Contacto:* ${contacto}%0A` +
      `*Local de entrega:* ${local}%0A` +
      (nota ? `*Nota:* ${nota}%0A` : "") +
      `%0A*Produtos seleccionados:*%0A${linhasProdutos}%0A%0A` +
      `*Total:* ${formatarKz(totalSeleccionado())}`;

    const link = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensagem}`;
    window.open(link, "_blank");
  }

  /* ------------------------------------------------------------------ */
  /* MENU MÓVEL                                                          */
  /* ------------------------------------------------------------------ */

  function configurarMenuMovel() {
    const botao = document.getElementById("menu-hamburguer");
    const nav = document.getElementById("nav-principal");
    if (!botao || !nav) return;

    botao.addEventListener("click", () => {
      nav.classList.toggle("aberto");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("aberto"));
    });
  }

  /* ------------------------------------------------------------------ */
  /* SINCRONIZAÇÃO ENTRE SEPARADORES (ex: admin aberto noutra aba)       */
  /* ------------------------------------------------------------------ */

  function configurarSincronizacao() {
    window.addEventListener("storage", (evento) => {
      if (evento.key === CHAVE_PRODUTOS) {
        carregarProdutos();
        // Remove seleções de produtos que já não existem
        const idsExistentes = new Set(produtos.map((p) => p.id));
        seleccionados.forEach((id) => {
          if (!idsExistentes.has(id)) seleccionados.delete(id);
        });
        desenharFiltros();
        desenharCatalogo();
        desenharBarraSeleccao();
        desenharResumoEncomenda();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* INICIALIZAÇÃO                                                       */
  /* ------------------------------------------------------------------ */

  function iniciar() {
    carregarProdutos();
    desenharFiltros();
    desenharCatalogo();
    desenharBarraSeleccao();
    desenharResumoEncomenda();
    configurarMenuMovel();
    configurarSincronizacao();

    const formulario = document.getElementById("formulario-encomenda");
    if (formulario) {
      formulario.addEventListener("submit", tratarEnvioFormulario);
    }

    const botaoVerEncomenda = document.getElementById("botao-ver-encomenda");
    if (botaoVerEncomenda) {
      botaoVerEncomenda.addEventListener("click", () => {
        document
          .getElementById("encomendar")
          .scrollIntoView({ behavior: "smooth" });
      });
    }

    // Define o ano corrente no rodapé
    const anoEl = document.getElementById("ano-actual");
    if (anoEl) anoEl.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
