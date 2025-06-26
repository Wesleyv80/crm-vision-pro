// =====================================================
// Módulo Kanban - Sistema de Cards Drag & Drop
// =====================================================
// Gerencia o quadro Kanban com arrastar e soltar

window.CRMKanban = (() => {
  
  // Estado do Kanban
  const state = {
    colunas: [],
    cards: [],
    draggedCard: null,
    filtros: {
      busca: '',
      tags: [],
      origem: ''
    },
    todosClientes: [] // Para restaurar após busca
  };
  
  // =====================================================
  // CRIAR KANBAN
  // =====================================================
  
  function criarKanban(container) {
    if (!container) {
      console.error('Container não fornecido para o Kanban');
      return;
    }
    
    // Limpa container
    container.innerHTML = '';
    container.className = 'crm-kanban-board';
    
    // Header do Kanban
    const header = criarHeaderKanban();
    container.appendChild(header);
    
    // Container das colunas
    const colunasContainer = document.createElement('div');
    colunasContainer.className = 'kanban-columns';
    colunasContainer.style.cssText = 'display: flex; gap: 20px; overflow-x: auto; padding: 20px 0;';
    
    // Carrega dados e renderiza colunas
    carregarDados().then(() => {
      renderizarColunas(colunasContainer);
    });
    
    container.appendChild(colunasContainer);
    
    // Adiciona eventos globais
    configurarEventosGlobais();
    
    return container;
  }
  
  // =====================================================
  // HEADER DO KANBAN - CORRIGIDO
  // =====================================================
  
  function criarHeaderKanban() {
    const header = document.createElement('div');
    header.className = 'kanban-header';
    header.style.cssText = 'padding: 20px; border-bottom: 1px solid #e5e7eb;';
    
    header.innerHTML = `
      <div class="kanban-title">
        <h2>Pipeline de Vendas</h2>
        <span class="kanban-subtitle">Arraste os cards entre as colunas</span>
      </div>
      
      <div class="kanban-controls" style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
        <div class="kanban-search" style="position: relative; flex: 1; max-width: 400px;">
          <input type="text" 
            id="kanban-search-input"
            placeholder="Buscar cliente... (Enter para buscar, Delete para limpar)" 
            class="kanban-search-input"
            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          <button class="kanban-search-btn" style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer;">🔍</button>
        </div>
        
        <div class="kanban-filters" style="display: flex; gap: 10px;">
          <button class="filter-btn" data-filter="tags" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">
            <span>🏷️ Tags</span>
          </button>
          <button class="filter-btn" data-filter="origem" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">
            <span>📍 Origem</span>
          </button>
        </div>
        
        <button class="kanban-add-btn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
          <span>➕ Nova Coluna</span>
        </button>
      </div>
    `;
    
    // Eventos do header CORRIGIDOS
    const searchInput = header.querySelector('#kanban-search-input');
    const searchBtn = header.querySelector('.kanban-search-btn');
    
    // Busca com ENTER
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        realizarBusca(searchInput.value);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        searchInput.value = '';
        limparBusca();
      }
    });
    
    // Busca ao digitar (com debounce)
    searchInput.addEventListener('input', debounce((e) => {
      if (e.target.value === '') {
        limparBusca();
      }
    }, 300));
    
    // Botão de busca
    searchBtn.addEventListener('click', () => {
      realizarBusca(searchInput.value);
    });
    
    // Filtros de Tags e Origem
    header.querySelector('[data-filter="tags"]').addEventListener('click', () => {
      mostrarFiltroTags();
    });
    
    header.querySelector('[data-filter="origem"]').addEventListener('click', () => {
      mostrarFiltroOrigem();
    });
    
    // Nova coluna
    header.querySelector('.kanban-add-btn').addEventListener('click', adicionarColuna);
    
    return header;
  }
  
  // =====================================================
  // FUNÇÕES DE BUSCA - NOVAS
  // =====================================================
  
  function realizarBusca(termo) {
    if (!termo.trim()) {
      limparBusca();
      return;
    }
    
    state.filtros.busca = termo.toLowerCase();
    
    // Esconde todos os cards primeiro
    const todosCards = document.querySelectorAll('.kanban-card');
    todosCards.forEach(card => {
      card.style.display = 'none';
    });
    
    // Mostra apenas cards que correspondem à busca
    let encontrados = 0;
    todosCards.forEach(card => {
      const clientId = card.dataset.clientId;
      const client = obterClientePorId(clientId);
      
      if (client) {
        const nome = (client.nome || '').toLowerCase();
        const telefone = (client.telefone || '').toLowerCase();
        
        if (nome.includes(state.filtros.busca) || telefone.includes(state.filtros.busca)) {
          card.style.display = '';
          encontrados++;
        }
      }
    });
    
    // Atualiza contadores
    atualizarContadores();
    
    // Mostra mensagem se não encontrou nada
    if (encontrados === 0) {
      CRMUI.mostrarNotificacao('Nenhum cliente encontrado', 'info');
    } else {
      CRMUI.mostrarNotificacao(`${encontrados} cliente(s) encontrado(s)`, 'success');
    }
  }
  
  function limparBusca() {
    state.filtros.busca = '';
    
    // Mostra todos os cards
    const todosCards = document.querySelectorAll('.kanban-card');
    todosCards.forEach(card => {
      card.style.display = '';
    });
    
    // Atualiza contadores
    atualizarContadores();
  }
  
  // =====================================================
  // FILTROS - NOVOS
  // =====================================================
  
  function mostrarFiltroTags() {
    // Coleta todas as tags únicas
    const todasTags = new Set();
    Object.values(window.crmState.kanbanData.clients || {}).forEach(client => {
      (client.tags || []).forEach(tag => todasTags.add(tag));
    });
    
    const conteudo = `
      <div class="filtro-tags">
        <p>Selecione as tags para filtrar:</p>
        <div style="margin-top: 10px;">
          ${Array.from(todasTags).map(tag => `
            <label style="display: block; margin: 5px 0;">
              <input type="checkbox" value="${tag}" ${state.filtros.tags.includes(tag) ? 'checked' : ''}>
              ${getTagEmoji(tag)} ${tag}
            </label>
          `).join('')}
        </div>
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Filtrar por Tags',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'limpar',
          texto: 'Limpar Filtros',
          tipo: 'secondary',
          onClick: () => {
            state.filtros.tags = [];
            aplicarFiltros();
            modal.fechar();
          }
        },
        {
          id: 'aplicar',
          texto: 'Aplicar',
          tipo: 'primary',
          onClick: () => {
            const checkboxes = document.querySelectorAll('.filtro-tags input[type="checkbox"]:checked');
            state.filtros.tags = Array.from(checkboxes).map(cb => cb.value);
            aplicarFiltros();
            modal.fechar();
          }
        }
      ]
    });
  }
  
  function mostrarFiltroOrigem() {
    // Coleta todas as origens únicas
    const todasOrigens = new Set();
    Object.values(window.crmState.kanbanData.clients || {}).forEach(client => {
      if (client.origem) todasOrigens.add(client.origem);
    });
    
    const conteudo = `
      <div class="filtro-origem">
        <p>Selecione a origem para filtrar:</p>
        <div style="margin-top: 10px;">
          <label style="display: block; margin: 5px 0;">
            <input type="radio" name="origem" value="" ${!state.filtros.origem ? 'checked' : ''}>
            Todas as origens
          </label>
          ${Array.from(todasOrigens).map(origem => `
            <label style="display: block; margin: 5px 0;">
              <input type="radio" name="origem" value="${origem}" ${state.filtros.origem === origem ? 'checked' : ''}>
              ${origem}
            </label>
          `).join('')}
        </div>
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Filtrar por Origem',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'aplicar',
          texto: 'Aplicar',
          tipo: 'primary',
          onClick: () => {
            const radio = document.querySelector('.filtro-origem input[type="radio"]:checked');
            state.filtros.origem = radio ? radio.value : '';
            aplicarFiltros();
            modal.fechar();
          }
        }
      ]
    });
  }
  
  // =====================================================
  // RENDERIZAR COLUNAS
  // =====================================================
  
  function renderizarColunas(container) {
    container.innerHTML = '';
    
    state.colunas.forEach(coluna => {
      const colunaEl = criarColuna(coluna);
      container.appendChild(colunaEl);
    });
    
    // Adiciona botão para nova coluna no final
    const addColBtn = document.createElement('div');
    addColBtn.className = 'kanban-add-column';
    addColBtn.style.cssText = 'min-width: 280px; display: flex; align-items: center; justify-content: center;';
    addColBtn.innerHTML = `
      <button class="add-column-btn" style="padding: 12px 24px; border: 2px dashed #d1d5db; border-radius: 8px; background: transparent; cursor: pointer;">
        <span>➕</span>
        <span>Adicionar Coluna</span>
      </button>
    `;
    addColBtn.querySelector('button').addEventListener('click', adicionarColuna);
    container.appendChild(addColBtn);
  }
  
  // =====================================================
  // CRIAR COLUNA
  // =====================================================
  
  function criarColuna(colunaData) {
    const coluna = document.createElement('div');
    coluna.className = 'kanban-column';
    coluna.dataset.colunaId = colunaData.id;
    coluna.style.cssText = `
      min-width: 320px;
      background: #f9fafb;
      border-radius: 8px;
      border-top: 4px solid ${colunaData.color || '#6366f1'};
      padding: 16px;
    `;
    
    // Header da coluna
    const header = document.createElement('div');
    header.className = 'column-header';
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';
    header.innerHTML = `
      <div class="column-info">
        <h3 class="column-title" contenteditable="false" style="margin: 0; font-size: 16px; font-weight: 600;">${colunaData.title}</h3>
        <span class="column-count" style="font-size: 12px; color: #6b7280;">${colunaData.clients.length} cards</span>
      </div>
      
      <div class="column-actions" style="display: flex; gap: 4px;">
        <button class="column-btn edit-column" title="Editar" style="background: none; border: none; cursor: pointer; padding: 4px;">✏️</button>
        <button class="column-btn color-column" title="Cor" style="background: none; border: none; cursor: pointer; padding: 4px;">🎨</button>
        <button class="column-btn delete-column" title="Excluir" style="background: none; border: none; cursor: pointer; padding: 4px;">🗑️</button>
      </div>
    `;
    
    // Área dos cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'column-cards';
    cardsContainer.dataset.colunaId = colunaData.id;
    cardsContainer.style.cssText = 'min-height: 100px; max-height: calc(100vh - 300px); overflow-y: auto;';
    
    // Renderiza cards da coluna
    colunaData.clients.forEach(clientId => {
      const clientData = obterClientePorId(clientId);
      if (clientData) {
        const card = criarCard(clientData);
        cardsContainer.appendChild(card);
      }
    });

    // Adiciona eventos de coluna
    const titulo = header.querySelector('.column-title');
    const editBtn = header.querySelector('.edit-column');
    const colorBtn = header.querySelector('.color-column');
    const deleteBtn = header.querySelector('.delete-column');

    // Editar título
    editBtn.addEventListener('click', () => {
      titulo.contentEditable = true;
      titulo.focus();
      titulo.style.background = '#fff';
      titulo.style.padding = '4px 8px';
      titulo.style.borderRadius = '4px';

      const salvarTitulo = () => {
        titulo.contentEditable = false;
        titulo.style.background = 'transparent';
        titulo.style.padding = '0';
        const novoTitulo = titulo.textContent.trim();

        if (novoTitulo && novoTitulo !== colunaData.title) {
          colunaData.title = novoTitulo;
          salvarDados();
        } else {
          titulo.textContent = colunaData.title;
        }
      };

      titulo.addEventListener('blur', salvarTitulo, { once: true });
      titulo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titulo.blur();
        }
      });
    });

    // Mudar cor - CORRIGIDO
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mostrarSeletorCor(coluna, colunaData);
    });

    // Excluir coluna - CORRIGIDO
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (colunaData.clients.length > 0) {
        CRMUI.mostrarNotificacao('Não é possível excluir colunas com cards', 'warning');
        return;
      }

      const confirmar = await CRMUI.confirmar({
        titulo: 'Excluir Coluna',
        mensagem: `Deseja excluir a coluna "${colunaData.title}"?`,
        tipo: 'danger'
      });

      if (confirmar) {
        excluirColuna(colunaData.id);
      }
    });

    coluna.appendChild(header);
    coluna.appendChild(cardsContainer);

    // Drag & Drop
    configurarDragDrop(cardsContainer);

    // Estatísticas da coluna - ATUALIZADO
    const stat = document.createElement('div');
    stat.className = 'column-stat';
    stat.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px;';
    
    const { totalAdesao, totalGordurinha } = calcularTotaisColuna(colunaData);
    stat.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #6b7280;">Adesão:</span>
        <span style="font-weight: 600;">R$ ${totalAdesao.toLocaleString('pt-BR')}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #6b7280;">Gordurinha:</span>
        <span style="font-weight: 600;">R$ ${totalGordurinha.toLocaleString('pt-BR')}</span>
      </div>
    `;
    coluna.appendChild(stat);

    return coluna;
  }
  
  // =====================================================
  // CRIAR CARD - ATUALIZADO E MENOR
  // =====================================================
  
  function criarCard(clientData) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.clientId = clientData.id;
    card.draggable = true;
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: move;
      transition: all 0.2s;
    `;
    
    const ultimoNegocio = clientData.deals?.[clientData.deals.length - 1];
    const totalAdesao = clientData.deals?.reduce((sum, deal) => sum + (deal.valor_adesao || 0), 0) || 0;
    const totalGordurinha = clientData.deals?.reduce((sum, deal) => sum + (deal.valor_gordurinha || 0), 0) || 0;
    
    // Corrige a imagem
    const fotoUrl = clientData.photo || clientData.imagem || '/assets/avatar-placeholder.png';
    
    card.innerHTML = `
      <div class="card-header" style="display: flex; align-items: center; margin-bottom: 8px;">
        <img src="${fotoUrl}" 
             alt="${clientData.nome}" 
             class="card-avatar"
             style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 8px;"
             onerror="this.src='/assets/avatar-placeholder.png'">
        <div class="card-info" style="flex: 1; min-width: 0;">
          <h4 class="card-name" style="margin: 0; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${clientData.nome}</h4>
          <p class="card-phone" style="margin: 0; font-size: 12px; color: #6b7280;">${clientData.telefone || 'Sem telefone'}</p>
        </div>
        <button class="card-menu-btn" style="background: none; border: none; cursor: pointer; padding: 4px;">⋮</button>
      </div>
      
      <div class="card-body">
        ${clientData.tags?.length ? `
          <div class="card-tags" style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            ${clientData.tags.slice(0, 2).map(tag => `
              <span class="card-tag" style="font-size: 11px; padding: 2px 6px; background: #e5e7eb; border-radius: 4px;">${getTagEmoji(tag)}</span>
            `).join('')}
            ${clientData.tags.length > 2 ? `<span style="font-size: 11px; color: #6b7280;">+${clientData.tags.length - 2}</span>` : ''}
          </div>
        ` : ''}
        
        ${clientData.indicacao ? `
          <p style="font-size: 11px; color: #6b7280; margin: 4px 0;">
            📍 Indicação: ${clientData.indicacao.nome}
          </p>
        ` : ''}
        
        <div class="card-metrics" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div>
            <span style="color: #6b7280;">Adesão:</span>
            <strong style="display: block;">R$ ${totalAdesao.toLocaleString('pt-BR')}</strong>
          </div>
          <div>
            <span style="color: #6b7280;">Gordurinha:</span>
            <strong style="display: block;">R$ ${totalGordurinha.toLocaleString('pt-BR')}</strong>
          </div>
        </div>
      </div>
      
      <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6;">
        <div class="card-actions" style="display: flex; gap: 4px;">
          <button class="card-action" data-action="editar" title="Editar" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px;">✏️</button>
          <button class="card-action" data-action="negocio" title="Negócio" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px;">💼</button>
          <button class="card-action" data-action="tarefa" title="Tarefa" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px;">📋</button>
          <button class="card-action" data-action="excluir" title="Excluir" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px; color: #ef4444;">🗑️</button>
        </div>
        
        <div class="card-priority" style="width: 8px; height: 8px; border-radius: 50%; background: ${getPriorityColor(clientData)}"></div>
      </div>
    `;
    
    // Eventos do card
    configurarEventosCard(card, clientData);
    
    return card;
  }
  
  // =====================================================
  // CONFIGURAR EVENTOS DO CARD - CORRIGIDO
  // =====================================================
  
  function configurarEventosCard(card, clientData) {
    // Drag start
    card.addEventListener('dragstart', (e) => {
      state.draggedCard = card;
      card.classList.add('dragging');
      card.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });
    
    // Drag end
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      card.style.opacity = '1';
      state.draggedCard = null;
      
      // Remove todos os indicadores
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });
    
    // Double click para editar
    card.addEventListener('dblclick', () => {
      editarCliente(clientData.id);
    });
    
    // Menu do card
    const menuBtn = card.querySelector('.card-menu-btn');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mostrarMenuCard(card, clientData);
    });
    
    // Ações do card - CORRIGIDAS
    card.querySelectorAll('.card-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        
        switch (action) {
          case 'editar':
            editarCliente(clientData.id);
            break;
          case 'negocio':
            novoNegocio(clientData.id);
            break;
          case 'tarefa':
            novaTarefa(clientData.id);
            break;
          case 'excluir':
            excluirCliente(clientData.id);
            break;
        }
      });
    });
  }
  
  // =====================================================
  // SELETOR DE COR - CORRIGIDO
  // =====================================================
  
  function mostrarSeletorCor(coluna, colunaData) {
    const cores = [
      { cor: '#6366f1', nome: 'Violeta' },
      { cor: '#8b5cf6', nome: 'Roxo' },
      { cor: '#ec4899', nome: 'Rosa' },
      { cor: '#f59e0b', nome: 'Laranja' },
      { cor: '#10b981', nome: 'Verde' },
      { cor: '#3b82f6', nome: 'Azul' },
      { cor: '#ef4444', nome: 'Vermelho' },
      { cor: '#14b8a6', nome: 'Teal' }
    ];
    
    const conteudo = `
      <div class="color-picker-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px;">
        ${cores.map(({ cor, nome }) => `
          <button class="color-option" 
                  data-color="${cor}"
                  style="
                    width: 60px;
                    height: 60px;
                    border: 2px solid ${cor};
                    border-radius: 8px;
                    background: ${cor};
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                  "
                  title="${nome}">
            <span style="
              position: absolute;
              bottom: -20px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 11px;
              color: #6b7280;
            ">${nome}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Escolher Cor da Coluna',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        }
      ]
    });
    
    // Adiciona eventos aos botões de cor
    setTimeout(() => {
      document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const cor = btn.dataset.color;
          colunaData.color = cor;
          coluna.style.borderTopColor = cor;
          salvarDados();
          modal.fechar();
          CRMUI.mostrarNotificacao('Cor alterada com sucesso!', 'success');
        });
      });
    }, 100);
  }
  
  // =====================================================
  // EXCLUIR COLUNA - CORRIGIDO
  // =====================================================
  
  function excluirColuna(colunaId) {
    // Remove a coluna do estado
    state.colunas = state.colunas.filter(col => col.id !== colunaId);
    
    // Salva os dados
    salvarDados();
    
    // Re-renderiza apenas as colunas (não fecha o CRM)
    const container = document.querySelector('.kanban-columns');
    if (container) {
      renderizarColunas(container);
    }
    
    CRMUI.mostrarNotificacao('Coluna excluída!', 'success');
  }
  
  // =====================================================
  // CALCULAR TOTAIS - ATUALIZADO
  // =====================================================
  
  function calcularTotaisColuna(coluna) {
    let totalAdesao = 0;
    let totalGordurinha = 0;
    
    coluna.clients.forEach(clientId => {
      const client = obterClientePorId(clientId);
      if (client && client.deals) {
        client.deals.forEach(deal => {
          totalAdesao += deal.valor_adesao || 0;
          totalGordurinha += deal.valor_gordurinha || 0;
        });
      }
    });
    
    return { totalAdesao, totalGordurinha };
  }
  
  // =====================================================
  // ATUALIZAR CONTADORES - MODIFICADO
  // =====================================================
  
  function atualizarContadores() {
    document.querySelectorAll('.kanban-column').forEach(colunaEl => {
      const colunaId = colunaEl.dataset.colunaId;
      const coluna = state.colunas.find(col => col.id === colunaId);
      
      if (coluna) {
        const visibleCards = colunaEl.querySelectorAll('.kanban-card:not([style*="display: none"])');
        const countEl = colunaEl.querySelector('.column-count');
        if (countEl) {
          countEl.textContent = `${visibleCards.length} cards`;
        }
        
        // Atualiza totais
        const { totalAdesao, totalGordurinha } = calcularTotaisColuna(coluna);
        const statEl = colunaEl.querySelector('.column-stat');
        if (statEl) {
          statEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280;">Adesão:</span>
              <span style="font-weight: 600;">R$ ${totalAdesao.toLocaleString('pt-BR')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Gordurinha:</span>
              <span style="font-weight: 600;">R$ ${totalGordurinha.toLocaleString('pt-BR')}</span>
            </div>
          `;
        }
      }
    });
  }
  
  // =====================================================
  // DRAG & DROP
  // =====================================================
  
  function configurarDragDrop(container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragleave', handleDragLeave);
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const container = e.currentTarget;
    container.style.background = '#e5e7eb';
  }
  
  function handleDrop(e) {
    e.preventDefault();
    const container = e.currentTarget;
    container.style.background = '';
    
    if (state.draggedCard) {
      const oldColumnId = state.draggedCard.closest('.column-cards').dataset.colunaId;
      const newColumnId = container.dataset.colunaId;
      const clientId = state.draggedCard.dataset.clientId;
      
      if (oldColumnId !== newColumnId) {
        container.appendChild(state.draggedCard);
        moverCard(clientId, oldColumnId, newColumnId);
      }
    }
  }
  
  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.style.background = '';
    }
  }
  
  // =====================================================
  // OPERAÇÕES COM CARDS
  // =====================================================
  
  function moverCard(clientId, oldColumnId, newColumnId) {
    const oldColumn = state.colunas.find(col => col.id === oldColumnId);
    if (oldColumn) {
      oldColumn.clients = oldColumn.clients.filter(id => id !== clientId);
    }
    
    const newColumn = state.colunas.find(col => col.id === newColumnId);
    if (newColumn) {
      newColumn.clients.push(clientId);
    }
    
    atualizarContadores();
    salvarDados();
    CRMUI.mostrarNotificacao(`Card movido para ${newColumn.title}`, 'success');
  }
  
  function mostrarMenuCard(card, clientData) {
    const menuItems = [
      { texto: 'Editar Cliente', icone: '✏️', onClick: () => editarCliente(clientData.id) },
      { texto: 'Novo Negócio', icone: '💼', onClick: () => novoNegocio(clientData.id) },
      { texto: 'Nova Tarefa', icone: '📋', onClick: () => novaTarefa(clientData.id) },
      { separador: true },
      { texto: 'Ver Histórico', icone: '📊', onClick: () => verHistorico(clientData.id) },
      { texto: 'Duplicar', icone: '📑', onClick: () => duplicarCliente(clientData.id) },
      { separador: true },
      { texto: 'Arquivar', icone: '📁', onClick: () => arquivarCliente(clientData.id) },
      { texto: 'Excluir', icone: '🗑️', onClick: () => excluirCliente(clientData.id) }
    ];
    
    CRMUI.criarMenu(menuItems, {
      trigger: card.querySelector('.card-menu-btn'),
      posicao: 'bottom-right'
    });
  }
  
  // =====================================================
  // FILTROS E BUSCA
  // =====================================================
  
  function aplicarFiltros() {
    const cards = document.querySelectorAll('.kanban-card');
    
    cards.forEach(card => {
      const clientId = card.dataset.clientId;
      const client = obterClientePorId(clientId);
      
      if (!client) {
        card.style.display = 'none';
        return;
      }
      
      let visible = true;
      
      // Filtro de busca
      if (state.filtros.busca) {
        const busca = state.filtros.busca.toLowerCase();
        const nome = (client.nome || '').toLowerCase();
        const telefone = (client.telefone || '').toLowerCase();
        
        visible = nome.includes(busca) || telefone.includes(busca);
      }
      
      // Filtro de tags
      if (visible && state.filtros.tags.length > 0) {
        visible = state.filtros.tags.some(tag => 
          client.tags?.includes(tag)
        );
      }
      
      // Filtro de origem
      if (visible && state.filtros.origem) {
        visible = client.origem === state.filtros.origem;
      }
      
      card.style.display = visible ? '' : 'none';
    });
    
    atualizarContadores();
  }
  
  // =====================================================
  // UTILITÁRIOS
  // =====================================================
  
  function obterClientePorId(clientId) {
    const kanbanData = window.crmState?.kanbanData;
    return kanbanData?.clients?.[clientId];
  }
  
  function getTagEmoji(tag) {
    const emojis = {
      'potencial-alto': '🔥',
      'urgente': '⚡',
      'retorno': '🔄',
      'vip': '⭐',
      'frio': '❄️',
      'quente': '🌡️'
    };
    return emojis[tag] || '🏷️';
  }
  
  function getPriorityColor(client) {
    if (client.tags?.includes('urgente')) return '#ef4444';
    if (client.tags?.includes('potencial-alto')) return '#f59e0b';
    if (client.tags?.includes('vip')) return '#8b5cf6';
    return '#10b981';
  }
  
  function formatarDataRelativa(data) {
    const agora = new Date();
    const dataObj = new Date(data);
    const diff = agora - dataObj;
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 60) return `há ${minutos}min`;
    if (horas < 24) return `há ${horas}h`;
    if (dias < 30) return `há ${dias}d`;
    
    return dataObj.toLocaleDateString('pt-BR');
  }
  
  function criarOpçõesCores() {
    const cores = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
    ];
    
    return `
      <div class="color-options">
        ${cores.map(cor => `
          <div class="color-option" 
               data-color="${cor}" 
               style="background: ${cor}"
               onclick="this.parentElement.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected')); this.classList.add('selected');">
          </div>
        `).join('')}
      </div>
    `;
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // =====================================================
  // AÇÕES DOS CARDS
  // =====================================================
  
  function editarCliente(clientId) {
    window.postMessage({
      type: 'CRM_ACTION',
      action: 'editarCliente',
      clientId: clientId
    }, '*');
  }
  
  function novoNegocio(clientId) {
    window.postMessage({
      type: 'CRM_ACTION',
      action: 'novoNegocio',
      clientId: clientId
    }, '*');
  }
  
  function novaTarefa(clientId) {
    window.postMessage({
      type: 'CRM_ACTION',
      action: 'novaTarefa',
      clientId: clientId
    }, '*');
  }
  
  function verHistorico(clientId) {
    CRMUI.mostrarNotificacao('Histórico em desenvolvimento...', 'info');
  }
  
  function duplicarCliente(clientId) {
    const client = obterClientePorId(clientId);
    if (!client) return;
    
    const novoCliente = {
      ...client,
      id: 'client_' + Date.now(),
      nome: client.nome + ' (Cópia)',
      dataCadastro: new Date().toISOString()
    };
    
    window.crmState.kanbanData.clients[novoCliente.id] = novoCliente;
    
    if (state.colunas.length > 0) {
      state.colunas[0].clients.push(novoCliente.id);
    }
    
    salvarDados();
    renderizarColunas(document.querySelector('.kanban-columns'));
    CRMUI.mostrarNotificacao('Cliente duplicado!', 'success');
  }
  
  async function arquivarCliente(clientId) {
    const confirmar = await CRMUI.confirmar({
      titulo: 'Arquivar Cliente',
      mensagem: 'O cliente será movido para o arquivo. Deseja continuar?'
    });
    
    if (confirmar) {
      CRMUI.mostrarNotificacao('Arquivamento em desenvolvimento...', 'info');
    }
  }
  
  async function excluirCliente(clientId) {
    const confirmar = await CRMUI.confirmar({
      titulo: 'Excluir Cliente',
      mensagem: 'Esta ação não pode ser desfeita. Deseja continuar?',
      tipo: 'danger'
    });
    
    if (confirmar) {
      // Remove de todas as colunas
      state.colunas.forEach(col => {
        col.clients = col.clients.filter(id => id !== clientId);
      });
      
      // Remove do storage
      delete window.crmState.kanbanData.clients[clientId];
      
      salvarDados();
      
      // Remove o card da interface
      const card = document.querySelector(`[data-client-id="${clientId}"]`);
      if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.transform = 'scale(0)';
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
      }
      
      atualizarContadores();
      CRMUI.mostrarNotificacao('Cliente excluído!', 'success');
    }
  }
  
  // =====================================================
  // ADICIONAR COLUNA - CORRIGIDA
  // =====================================================
  
  async function adicionarColuna() {
    const cores = [
      { cor: '#6366f1', nome: 'Violeta' },
      { cor: '#8b5cf6', nome: 'Roxo' },
      { cor: '#ec4899', nome: 'Rosa' },
      { cor: '#f59e0b', nome: 'Laranja' },
      { cor: '#10b981', nome: 'Verde' },
      { cor: '#3b82f6', nome: 'Azul' },
      { cor: '#ef4444', nome: 'Vermelho' },
      { cor: '#14b8a6', nome: 'Teal' }
    ];
    
    const conteudo = `
      <form id="form-nova-coluna">
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nome da Coluna</label>
          <input type="text" name="titulo" required placeholder="Ex: Em Negociação" 
                 style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
        </div>
        
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Cor da Coluna</label>
          <div class="color-picker" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            ${cores.map(({ cor, nome }, index) => `
              <label style="position: relative; cursor: pointer;">
                <input type="radio" name="cor" value="${cor}" ${index === 0 ? 'checked' : ''} 
                       style="position: absolute; opacity: 0;">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: ${cor};
                  border-radius: 6px;
                  border: 2px solid transparent;
                  transition: all 0.2s;
                " 
                class="color-box"
                onclick="this.parentElement.querySelector('input').checked = true;
                         document.querySelectorAll('.color-box').forEach(el => el.style.borderColor = 'transparent');
                         this.style.borderColor = '#111827';">
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="form-field">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Posição</label>
          <select name="posicao" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            <option value="fim">No final</option>
            ${state.colunas.map((col, idx) => 
              `<option value="${idx}">Antes de "${col.title}"</option>`
            ).join('')}
          </select>
        </div>
      </form>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Nova Coluna',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        },
        {
          id: 'criar',
          texto: 'Criar Coluna',
          tipo: 'primary',
          onClick: () => {
            const form = document.getElementById('form-nova-coluna');
            const formData = new FormData(form);
            
            const novaColuna = {
              id: 'col_' + Date.now(),
              title: formData.get('titulo'),
              color: formData.get('cor') || '#6366f1',
              clients: []
            };
            
            const posicao = formData.get('posicao');
            if (posicao === 'fim') {
              state.colunas.push(novaColuna);
            } else {
              state.colunas.splice(parseInt(posicao), 0, novaColuna);
            }
            
            salvarDados();
            renderizarColunas(document.querySelector('.kanban-columns'));
            modal.fechar();
            CRMUI.mostrarNotificacao('Coluna criada com sucesso!', 'success');
          }
        }
      ]
    });
  }
  
  // =====================================================
  // DADOS E PERSISTÊNCIA
  // =====================================================
  
  async function carregarDados() {
    const kanbanData = window.crmState?.kanbanData;
    
    if (kanbanData && kanbanData.columns) {
      state.colunas = kanbanData.columns;
    } else {
      state.colunas = [
        { id: 'leads', title: '🎯 Leads', clients: [], color: '#6366f1' },
        { id: 'negotiation', title: '💬 Em Negociação', clients: [], color: '#8b5cf6' },
        { id: 'proposal', title: '📝 Proposta Enviada', clients: [], color: '#ec4899' },
        { id: 'closing', title: '🤝 Fechamento', clients: [], color: '#f59e0b' },
        { id: 'success', title: '✅ Sucesso', clients: [], color: '#10b981' }
      ];
    }
  }
  
  async function salvarDados() {
    if (window.crmState && window.crmState.kanbanData) {
      window.crmState.kanbanData.columns = state.colunas;
      
      if (window.CRMStorage && typeof CRMStorage.salvar === 'function') {
        await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
      } else {
        localStorage.setItem('crm_kanban_data', JSON.stringify(window.crmState.kanbanData));
      }
    }
  }
  
  // =====================================================
  // EVENTOS GLOBAIS
  // =====================================================
  
  function configurarEventosGlobais() {
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
      // Ctrl+F para buscar
      if (e.ctrlKey && e.key === 'f' && document.querySelector('.crm-kanban-board')) {
        e.preventDefault();
        document.querySelector('#kanban-search-input')?.focus();
      }
      
      // ESC para limpar busca
      if (e.key === 'Escape' && state.filtros.busca) {
        const searchInput = document.querySelector('#kanban-search-input');
        if (searchInput) {
          searchInput.value = '';
          limparBusca();
        }
      }
    });
  }
  
  // =====================================================
  // API PÚBLICA
  // =====================================================
  
  return {
    criarKanban,
    renderizarColunas,
    aplicarFiltros,
    atualizarContadores,
    
    get estado() {
      return { ...state };
    },
    
    adicionarColuna,
    excluirColuna,
    moverCard,
    
    obterClientePorId,
    calcularTotaisColuna
  };

})();

console.log('✅ Módulo CRMKanban carregado!');
