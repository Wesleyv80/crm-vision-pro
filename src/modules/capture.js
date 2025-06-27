// =====================================================
// Módulo de Captura de Dados do WhatsApp
// =====================================================
// Este módulo é responsável por extrair dados do contato
// atual no WhatsApp Web de forma inteligente

(function() {
  'use strict';
  
  // Cache do último contato capturado
  let ultimoContato = null;
  let observerAtivo = null;
  
  // =====================================================
  // FUNÇÃO PRINCIPAL - Captura dados do contato
  // =====================================================
  function capturarDadosContato() {
    console.log('🔍 Iniciando captura de dados...');
    
    // Estratégia 1: Tenta capturar do header do chat
    let dados = capturarDoHeader();
    
    // Estratégia 2: Se não conseguiu, tenta do painel lateral
    if (!dados || !dados.nome) {
      dados = capturarDoPainelLateral();
    }
    
    // Estratégia 3: Tenta capturar de mensagens
    if (!dados || !dados.nome) {
      dados = capturarDeMensagens();
    }
    
    // Estratégia 4: Tenta capturar da lista de chats
    if (!dados || !dados.nome) {
      dados = capturarDaListaChats();
    }
    
    // Formata telefone se encontrou
    if (dados && dados.telefone) {
      dados.telefone = formatarTelefone(dados.telefone);
    }
    
    // Adiciona timestamp
    if (dados) {
      dados.timestamp = new Date().toISOString();
      dados.origem = 'WhatsApp Web';
    }
    
    // Atualiza cache
    if (dados && dados.nome) {
      ultimoContato = dados;
      console.log('✅ Dados capturados:', dados);
    } else {
      console.log('⚠️ Nenhum dado encontrado');
    }
    
    return dados;
  }
  
  // =====================================================
  // ESTRATÉGIA 1: Capturar do Header
  // =====================================================
  function capturarDoHeader() {
    try {
      // Busca o header do chat
      const header = document.querySelector('header[data-testid="conversation-header"]') || 
                     document.querySelector('#main header');
      
      if (!header) return null;
      
      // Nome do contato
      const nomeElement = header.querySelector('span[dir="auto"][title]') ||
                         header.querySelector('div[role="button"] span[dir="auto"]');
      const nome = nomeElement?.title || nomeElement?.textContent?.trim();
      
      // Imagem do contato
      const imgElement = header.querySelector('img[src*="ppdownload"]') ||
                        header.querySelector('div[role="button"] img');
      const imagem = imgElement?.src;
      
      // Status/Descrição
      const statusElement = header.querySelector('span[title*="último"]') ||
                           header.querySelector('div[data-testid="chat-subtitle"]');
      const status = statusElement?.textContent?.trim();
      
      // Tenta extrair telefone do atributo data-id
      const chatElement = document.querySelector('div[data-id*="@c.us"]');
      let telefone = null;
      if (chatElement) {
        const dataId = chatElement.getAttribute('data-id');
        const match = dataId?.match(/(\d+)@/);
        if (match) {
          telefone = match[1];
        }
      }
      
      return {
        nome,
        telefone,
        imagem,
        status,
        fonte: 'header'
      };
    } catch (erro) {
      console.error('Erro ao capturar do header:', erro);
      return null;
    }
  }
  
  // =====================================================
  // ESTRATÉGIA 2: Capturar do Painel Lateral
  // =====================================================
  function capturarDoPainelLateral() {
    try {
      // Verifica se o painel de perfil está aberto
      const painelPerfil = document.querySelector('div[data-testid="contact-info-drawer"]') ||
                          document.querySelector('span[data-testid="contact-info-header"]')?.closest('div');
      
      if (!painelPerfil) return null;
      
      // Nome
      const nomeElement = painelPerfil.querySelector('span[dir="auto"][role="textbox"]') ||
                         painelPerfil.querySelector('h2 span[dir="auto"]');
      const nome = nomeElement?.textContent?.trim();
      
      // Telefone
      const telefoneElement = painelPerfil.querySelector('span[dir="ltr"]') ||
                             painelPerfil.querySelector('div[role="button"] span[title*="+"]');
      const telefone = telefoneElement?.textContent?.trim();
      
      // Imagem
      const imgElement = painelPerfil.querySelector('img[src*="ppdownload"]');
      const imagem = imgElement?.src;
      
      // Informações adicionais
      const infoElements = painelPerfil.querySelectorAll('div[role="button"] span[dir="auto"]');
      const infos = Array.from(infoElements).map(el => el.textContent?.trim()).filter(Boolean);
      
      return {
        nome,
        telefone,
        imagem,
        informacoesAdicionais: infos,
        fonte: 'painel-lateral'
      };
    } catch (erro) {
      console.error('Erro ao capturar do painel lateral:', erro);
      return null;
    }
  }
  
  // =====================================================
  // ESTRATÉGIA 3: Capturar de Mensagens
  // =====================================================
  function capturarDeMensagens() {
    try {
      // Busca mensagens do contato
      const mensagens = document.querySelectorAll('div[data-testid="msg-container"]');
      if (!mensagens.length) return null;
      
      let nome = null;
      let telefone = null;
      
      // Procura por mensagens que contenham informações
      for (const msg of mensagens) {
        // Tenta encontrar nome em mensagens de grupo
        const nomeGrupo = msg.querySelector('span[data-testid="author"]');
        if (nomeGrupo && !nome) {
          nome = nomeGrupo.textContent?.trim();
        }
        
        // Procura por números de telefone no texto
        const texto = msg.textContent || '';
        const matchTelefone = texto.match(/\+?\d{1,3}[\s-]?\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/);
        if (matchTelefone && !telefone) {
          telefone = matchTelefone[0];
        }
      }
      
      if (!nome && !telefone) return null;
      
      return {
        nome,
        telefone,
        fonte: 'mensagens'
      };
    } catch (erro) {
      console.error('Erro ao capturar de mensagens:', erro);
      return null;
    }
  }
  
  // =====================================================
  // ESTRATÉGIA 4: Capturar da Lista de Chats
  // =====================================================
  function capturarDaListaChats() {
    try {
      // Busca o chat ativo na lista
      const chatAtivo = document.querySelector('div[aria-selected="true"]') ||
                       document.querySelector('div[data-testid="cell-frame-container"][class*="selected"]');
      
      if (!chatAtivo) return null;
      
      // Nome
      const nomeElement = chatAtivo.querySelector('span[dir="auto"][title]');
      const nome = nomeElement?.title || nomeElement?.textContent?.trim();
      
      // Última mensagem
      const ultimaMsg = chatAtivo.querySelector('span[data-testid="last-msg-status"] + span');
      const mensagem = ultimaMsg?.textContent?.trim();
      
      // Imagem
      const imgElement = chatAtivo.querySelector('img');
      const imagem = imgElement?.src;
      
      return {
        nome,
        ultimaMensagem: mensagem,
        imagem,
        fonte: 'lista-chats'
      };
    } catch (erro) {
      console.error('Erro ao capturar da lista de chats:', erro);
      return null;
    }
  }
  
  // =====================================================
  // DETECTAR MUDANÇA DE CONTATO
  // =====================================================
  function detectarMudancaContato() {
    const contatoAtual = capturarDadosContato();
    
    if (!contatoAtual) return null;
    
    // Verifica se mudou comparando com o cache
    const mudou = !ultimoContato || 
                  ultimoContato.nome !== contatoAtual.nome ||
                  ultimoContato.telefone !== contatoAtual.telefone;
    
    if (mudou) {
      console.log('📱 Mudança de contato detectada!');
      return contatoAtual;
    }
    
    return null;
  }
  
  // =====================================================
  // MONITORAR MUDANÇAS AUTOMÁTICAS
  // =====================================================
  function iniciarMonitoramento(callback) {
    if (observerAtivo) {
      observerAtivo.disconnect();
    }
    
    const mainElement = document.querySelector('#main');
    if (!mainElement) {
      console.warn('Elemento #main não encontrado para monitoramento');
      return;
    }
    
    observerAtivo = new MutationObserver(() => {
      const novoContato = detectarMudancaContato();
      if (novoContato && callback) {
        callback(novoContato);
      }
    });
    
    observerAtivo.observe(mainElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-id', 'aria-selected']
    });
    
    console.log('👁️ Monitoramento de contatos iniciado');
  }
  
  // =====================================================
  // PARAR MONITORAMENTO
  // =====================================================
  function pararMonitoramento() {
    if (observerAtivo) {
      observerAtivo.disconnect();
      observerAtivo = null;
      console.log('🛑 Monitoramento de contatos parado');
    }
  }
  
  // =====================================================
  // UTILIDADES
  // =====================================================
  function formatarTelefone(numero) {
    if (!numero) return '';
    
    // Remove tudo exceto números
    const apenasNumeros = numero.replace(/\D/g, '');
    
    // Formato brasileiro
    if (apenasNumeros.length === 13 && apenasNumeros.startsWith('55')) {
      // +55 11 98765-4321
      return `+${apenasNumeros.slice(0,2)} ${apenasNumeros.slice(2,4)} ${apenasNumeros.slice(4,9)}-${apenasNumeros.slice(9)}`;
    }
    
    // Formato com DDD
    if (apenasNumeros.length === 11) {
      // (11) 98765-4321
      return `(${apenasNumeros.slice(0,2)}) ${apenasNumeros.slice(2,7)}-${apenasNumeros.slice(7)}`;
    }
    
    // Retorna o número original se não conseguir formatar
    return numero;
  }
  
  // =====================================================
  // CAPTURA AVANÇADA COM IA
  // =====================================================
  function analisarContexto() {
    const dados = capturarDadosContato();
    if (!dados) return null;
    
    // Analisa o contexto da conversa
    const mensagens = document.querySelectorAll('div[data-testid="msg-container"]');
    const textoConversa = Array.from(mensagens)
      .map(m => m.textContent)
      .join(' ')
      .toLowerCase();
    
    // Detecta intenções
    const intencoes = {
      interesseAlto: /quero|preciso|quanto custa|valor|preço|comprar/i.test(textoConversa),
      duvida: /\?|dúvida|pergunta|como|quando|onde/i.test(textoConversa),
      objecao: /caro|não|depois|pensar|ver/i.test(textoConversa),
      urgente: /urgente|rápido|hoje|agora|imediato/i.test(textoConversa)
    };
    
    // Detecta produtos mencionados
    const produtosMencionados = [];
    const palavrasChave = ['seguro', 'proteção', 'veicular', 'plano', 'cobertura'];
    palavrasChave.forEach(palavra => {
      if (textoConversa.includes(palavra)) {
        produtosMencionados.push(palavra);
      }
    });
    
    return {
      ...dados,
      analise: {
        intencoes,
        produtosMencionados,
        temperatura: calcularTemperatura(intencoes),
        totalMensagens: mensagens.length
      }
    };
  }
  
  function calcularTemperatura(intencoes) {
    let score = 50; // Neutro
    
    if (intencoes.interesseAlto) score += 30;
    if (intencoes.urgente) score += 20;
    if (intencoes.duvida) score += 10;
    if (intencoes.objecao) score -= 20;
    
    // Limita entre 0 e 100
    return Math.max(0, Math.min(100, score));
  }
  
  // =====================================================
  // API PÚBLICA DO MÓDULO
  // =====================================================
  window.CRMCapture = {
    capturarDadosContato,
    detectarMudancaContato,
    iniciarMonitoramento,
    pararMonitoramento,
    analisarContexto,
    formatarTelefone,
    
    // Getters
    get ultimoContato() {
      return ultimoContato;
    },
    
    // Limpar cache
    limparCache() {
      ultimoContato = null;
      console.log('🧹 Cache de contato limpo');
    }
  };
  
  // =====================================================
  // AUTO-TESTE DO MÓDULO (apenas em desenvolvimento)
  // =====================================================
  if (window.location.hostname === 'web.whatsapp.com') {
    console.log('✅ Módulo CRMCapture carregado com sucesso!');
    console.log('📌 Funções disponíveis:', Object.keys(window.CRMCapture));
  }
})();
