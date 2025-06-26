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
    }
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
  // HEADER DO KANBAN
  // =====================================================
  
  function criarHeaderKanban() {
    const header = document.createElement('div');
    header.className = 'kanban-header';
    
    header.innerHTML = `
      <div class="kanban-title">
        <h2>Pipeline de Vendas</h2>
        <span class="kanban-subtitle">Arraste os cards entre as colunas</span>
      </div>
      
      <div class="kanban-controls">
        <div class="kanban-search">
          <input type="text" 
            placeholder="Buscar cliente..." 
            class="kanban-search-input">
          <button class="kanban-search-btn">🔍</button>
        </div>
        
        <div class="kanban-filters">
          <button class="filter-btn" data-filter="tags">
            <span>🏷️ Tags</span>
          </button>
          <button class="filter-btn" data-filter="origem">
            <span>📍 Origem</span>
          </button>
        </div>
        
        <button class="kanban-add-btn">
          <span>➕ Nova Coluna</span>
        </button>
      </div>
    `;
    
    // Eventos do header
    const searchInput = header.querySelector('.kanban-search-input');
    searchInput.addEventListener('input', debounce((e) => {
      state.filtros.busca = e.target.value;
      aplicarFiltros();
    }, 300));
    
    header.querySelector('.kanban-add-btn').addEventListener('click', adicionarColuna);
    
    return header;
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
    addColBtn.innerHTML = `
      <button class="add-column-btn">
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
    coluna.style.borderTopColor = colunaData.color || '#6366f1';
    
    // Header da coluna
    const header = document.createElement('div');
    header.className = 'column-header';
    header.innerHTML = `
      <div class="column-info">
        <h3 class="column-title" contenteditable="false">${colunaData.title}</h3>
        <span class="column-count">${colunaData.clients.length} cards</span>
      </div>
      
      <div class="column-actions">
        <button class="column-btn edit-column" title="Editar">✏️</button>
        <button class="column-btn color-column" title="Cor">🎨</button>
        <button class="column-btn delete-column" title="Excluir">🗑️</button>
      </div>
    `;
    
    // Área dos cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'column-cards';
    cardsContainer.dataset.colunaId = colunaData.id;
    
    // Renderiza cards da coluna
    colunaData.clients.forEach(clientId => {
      const clientData = obterClientePorId(clientId);
      if (clientData) {
        const card = criarCard(clientData);
        cardsContainer.appendChild(card);
      }
    });

    // Adiciona eventos de coluna (editar, cor, excluir)
    const titulo = header.querySelector('.column-title');
    const editBtn = header.querySelector('.edit-column');
    const colorBtn = header.querySelector('.color-column');
    const deleteBtn = header.querySelector('.delete-column');

    // Editar título
    editBtn.addEventListener('click', () => {
      titulo.contentEditable = true;
      titulo.focus();
      titulo.classList.add('editing');

      const salvarTitulo = () => {
        titulo.contentEditable = false;
        titulo.classList.remove('editing');
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

    // Mudar cor
    colorBtn.addEventListener('click', () => {
      mostrarSeletorCor(coluna, colunaData);
    });

    // Excluir coluna
    deleteBtn.addEventListener('click', async () => {
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

    // Estatísticas da coluna
    const stat = document.createElement('div');
    stat.className = 'column-stat';
    stat.innerHTML = `
      <span class="stat-label">Total:</span>
      <span class="stat-value">R$ ${calcularTotalColuna(colunaData).toLocaleString('pt-BR')}</span>
    `;
    coluna.appendChild(stat);

    return coluna;
  }
  
  // =====================================================
  // CRIAR CARD
  // =====================================================
  
  function criarCard(clientData) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.clientId = clientData.id;
    card.draggable = true;
    
    const ultimoNegocio = clientData.deals?.[clientData.deals.length - 1];
    const valorTotal = clientData.deals?.reduce((sum, deal) => sum + (deal.valor || 0), 0) || 0;
    
    card.innerHTML = `
      <div class="card-header">
        <img src="${clientData.photo || '/assets/avatar-placeholder.png'}" 
             alt="${clientData.nome}" 
             class="card-avatar">
        <div class="card-info">
          <h4 class="card-name">${clientData.nome}</h4>
          <p class="card-phone">${clientData.telefone || 'Sem telefone'}</p>
        </div>
        <button class="card-menu-btn">⋮</button>
      </div>
      
      <div class="card-body">
        ${clientData.tags?.length ? `
          <div class="card-tags">
            ${clientData.tags.map(tag => `
              <span class="card-tag">${getTagEmoji(tag)} ${tag}</span>
            `).join('')}
          </div>
        ` : ''}
        
        ${clientData.observacoes ? `
          <p class="card-notes">${clientData.observacoes}</p>
        ` : ''}
        
        <div class="card-metrics">
          <div class="metric">
            <span class="metric-label">Negócios:</span>
            <span class="metric-value">${clientData.deals?.length || 0}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Valor:</span>
            <span class="metric-value">R$ ${valorTotal.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        
        ${ultimoNegocio ? `
          <div class="card-last-deal">
            <span class="deal-date">${formatarDataRelativa(ultimoNegocio.dataCriacao)}</span>
            <span class="deal-status">${ultimoNegocio.status || 'Em andamento'}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="card-footer">
        <div class="card-actions">
          <button class="card-action" title="Editar">✏️</button>
          <button class="card-action" title="Negócio">💼</button>
          <button class="card-action" title="Tarefa">📋</button>
          <button class="card-action" title="WhatsApp">💬</button>
        </div>
        
        <div class="card-priority" style="background: ${getPriorityColor(clientData)}"></div>
      </div>
    `;
    
    // Eventos do card
    configurarEventosCard(card, clientData);
    
    return card;
  }
  
  // =====================================================
  // DRAG & DROP
  // =====================================================
  
  function configurarDragDrop(container) {
    // Eventos de drag no container
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragleave', handleDragLeave);
  }
  
  function configurarEventosCard(card, clientData) {
    // Drag start
    card.addEventListener('dragstart', (e) => {
      state.draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', card.innerHTML);
    });
    
    // Drag end
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
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
    
    // Ações do card
    card.querySelectorAll('.card-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.title.toLowerCase();
        executarAcaoCard(action, clientData);
      });
    });
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const container = e.currentTarget;
    container.classList.add('drag-over');
  }
  
  function handleDrop(e) {
    e.preventDefault();
    const container = e.currentTarget;
    container.classList.remove('drag-over');
    
    if (state.draggedCard) {
      const oldColumnId = state.draggedCard.closest('.column-cards').dataset.colunaId;
      const newColumnId = container.dataset.colunaId;
      const clientId = state.draggedCard.dataset.clientId;
      
      if (oldColumnId !== newColumnId) {
        // Move o card visualmente
        container.appendChild(state.draggedCard);
        
        // Atualiza os dados
        moverCard(clientId, oldColumnId, newColumnId);
      }
    }
  }
  
  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('drag-over');
    }
  }
  
  function executarAcaoCard(action, clientData) {
    switch (action) {
      case 'editar':
        editarCliente(clientData.id);
        break;
      case 'negócio':
        novoNegocio(clientData.id);
        break;
      case 'tarefa':
        novaTarefa(clientData.id);
        break;
      case 'whatsapp':
        abrirWhatsApp(clientData.telefone);
        break;
    }
  }
  
  function abrirWhatsApp(telefone) {
    if (telefone) {
      const numero = telefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${numero}`, '_blank');
    }
  }
  
  // FUNÇÃO CORRIGIDA - Seletor de cor
  function mostrarSeletorCor(coluna, colunaData) {
    const modal = CRMUI.criarModal({
      titulo: 'Escolher Cor',
      conteudo: `
        <div class="color-picker-modal">
          ${criarOpçõesCores()}
        </div>
      `,
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        },
        {
          id: 'aplicar',
          texto: 'Aplicar',
          tipo: 'primary',
          onClick: () => {
            const corSelecionada = document.querySelector('.color-option.selected')?.dataset.color;
            if (corSelecionada) {
              colunaData.color = corSelecionada;
              coluna.style.borderTopColor = corSelecionada;
              salvarDados();
            }
            modal.fechar();
          }
        }
      ]
    });
  }
  
  // =====================================================
  // OPERAÇÕES COM COLUNAS
  // =====================================================
  
  // FUNÇÃO CORRIGIDA - Adicionar coluna
  async function adicionarColuna() {
    const modal = CRMUI.criarModal({
      titulo: 'Nova Coluna',
      conteudo: `
        <form id="form-nova-coluna">
          <div class="form-field">
            <label>Nome da Coluna</label>
            <input type="text" name="titulo" required placeholder="Ex: Em Negociação">
          </div>
          
          <div class="form-field">
            <label>Cor da Coluna</label>
            <div class="color-picker">
              ${criarOpçõesCores()}
            </div>
          </div>
          
          <div class="form-field">
            <label>Posição</label>
            <select name="posicao">
              <option value="fim">No final</option>
              ${state.colunas.map((col, idx) => 
                `<option value="${idx}">Antes de "${col.title}"</option>`
              ).join('')}
            </select>
          </div>
        </form>
      `,
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
              color: document.querySelector('.color-option.selected')?.dataset.color || '#6366f1',
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
  
  function excluirColuna(colunaId) {
    state.colunas = state.colunas.filter(col => col.id !== colunaId);
    salvarDados();
    renderizarColunas(document.querySelector('.kanban-columns'));
    CRMUI.mostrarNotificacao('Coluna excluída!', 'success');
  }
  
  // =====================================================
  // OPERAÇÕES COM CARDS
  // =====================================================
  
  function moverCard(clientId, oldColumnId, newColumnId) {
    // Remove da coluna antiga
    const oldColumn = state.colunas.find(col => col.id === oldColumnId);
    if (oldColumn) {
      oldColumn.clients = oldColumn.clients.filter(id => id !== clientId);
    }
    
    // Adiciona na nova coluna
    const newColumn = state.colunas.find(col => col.id === newColumnId);
    if (newColumn) {
      newColumn.clients.push(clientId);
    }
    
    // Atualiza contadores
    atualizarContadores();
    
    // Salva
    salvarDados();
    
    // Notifica
    CRMUI.mostrarNotificacao(`Card movido para ${newColumn.title}`, 'success');
  }
  
  function salvarOrdemCards(container) {
    const colunaId = container.dataset.colunaId;
    const coluna = state.colunas.find(col => col.id === colunaId);
    
    if (coluna) {
      const cards = container.querySelectorAll('.kanban-card');
      coluna.clients = Array.from(cards).map(card => card.dataset.clientId);
      salvarDados();
    }
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
      { texto: 'Excluir', icone: '🗑️', onClick: () => excluirCliente(clientData.id), disabled: false }
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
    
    // Atualiza contadores
    atualizarContadores();
  }
  
  // =====================================================
  // UTILITÁRIOS
  // =====================================================
  
  function obterClientePorId(clientId) {
    const kanbanData = window.crmState?.kanbanData;
    return kanbanData?.clients?.[clientId];
  }
  
  function calcularTotalColuna(coluna) {
    return coluna.clients.reduce((total, clientId) => {
      const client = obterClientePorId(clientId);
      if (!client) return total;
      
      const valorCliente = (client.deals || [])
        .reduce((sum, deal) => sum + (deal.valor || 0), 0);
      
      return total + valorCliente;
    }, 0);
  }
  
  function atualizarContadores() {
    document.querySelectorAll('.kanban-column').forEach(colunaEl => {
      const colunaId = colunaEl.dataset.colunaId;
      const coluna = state.colunas.find(col => col.id === colunaId);
      
      if (coluna) {
        const visibleCards = colunaEl.querySelectorAll('.kanban-card:not([style*="display: none"])');
        colunaEl.querySelector('.column-count').textContent = `${visibleCards.length} cards`;
        
        const total = calcularTotalColuna(coluna);
        colunaEl.querySelector('.stat-value').textContent = `R$ ${total.toLocaleString('pt-BR')}`;
      }
    });
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
  
  // Debounce helper
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
    // Envia mensagem para o content.js principal
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
    // Implementar visualização de histórico
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
    
    // Adiciona ao storage
    window.crmState.kanbanData.clients[novoCliente.id] = novoCliente;
    
    // Adiciona à primeira coluna
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
      // Implementar arquivamento
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
  // DADOS E PERSISTÊNCIA
  // =====================================================
  
  async function carregarDados() {
    const kanbanData = window.crmState?.kanbanData;
    
    if (kanbanData && kanbanData.columns) {
      state.colunas = kanbanData.columns;
    } else {
      // Colunas padrão
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
      
      // Verifica se CRMStorage existe antes de usar
      if (window.CRMStorage && typeof CRMStorage.salvar === 'function') {
        await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
      } else {
        // Fallback para localStorage se CRMStorage não estiver disponível
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
        document.querySelector('.kanban-search-input')?.focus();
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
    
    // Estado
    get estado() {
      return { ...state };
    },
    
    // Ações
    adicionarColuna,
    excluirColuna,
    moverCard,
    
    // Utilitários
    obterClientePorId,
    calcularTotalColuna
  };

})();

console.log('✅ Módulo CRMKanban carregado!');
