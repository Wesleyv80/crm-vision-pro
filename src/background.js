// =====================================================
// Background Script (Service Worker)
// =====================================================
// Gerencia armazenamento e comunicação entre scripts

console.log('🎯 Background script iniciado');

// =====================================================
// LISTENER DE MENSAGENS
// =====================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Mensagem recebida:', request.action);
  
  // Processa a ação solicitada
  switch (request.action) {
    case 'salvarDados':
      salvarDados(request.uid, request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;
      
    case 'carregarDados':
      carregarDados(request.uid)
        .then(data => sendResponse(data))
        .catch(error => sendResponse(null));
      break;
      
    case 'removerDados':
      removerDados(request.uid)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;
      
    case 'listarChaves':
      listarChaves()
        .then(keys => sendResponse({ keys }))
        .catch(error => sendResponse({ keys: [] }));
      break;
      
    case 'limparTudo':
      limparTudo()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;
      
    default:
      sendResponse({ success: false, error: 'Ação desconhecida' });
  }
  
  // Importante: retorna true para respostas assíncronas
  return true;
});

// =====================================================
// FUNÇÕES DE ARMAZENAMENTO
// =====================================================
async function salvarDados(uid, data) {
  try {
    const key = `crm_${uid}`;
    const dataToStore = { [key]: data };
    
    await chrome.storage.local.set(dataToStore);
    console.log(`✅ Dados salvos: ${key}`);
    
    // Envia notificação de sucesso (opcional)
    if (uid === 'kanban_data') {
      const stats = calcularEstatisticas(data);
      await atualizarBadge(stats.totalClients);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
    throw error;
  }
}

async function carregarDados(uid) {
  try {
    const key = `crm_${uid}`;
    const result = await chrome.storage.local.get(key);
    
    console.log(`📦 Dados carregados: ${key}`);
    return result[key] || null;
  } catch (error) {
    console.error('❌ Erro ao carregar:', error);
    throw error;
  }
}

async function removerDados(uid) {
  try {
    const key = `crm_${uid}`;
    await chrome.storage.local.remove(key);
    
    console.log(`🗑️ Dados removidos: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover:', error);
    throw error;
  }
}

async function listarChaves() {
  try {
    const allData = await chrome.storage.local.get();
    const keys = Object.keys(allData);
    
    console.log(`📋 Total de chaves: ${keys.length}`);
    return keys;
  } catch (error) {
    console.error('❌ Erro ao listar chaves:', error);
    throw error;
  }
}

async function limparTudo() {
  try {
    // Lista todas as chaves CRM
    const allData = await chrome.storage.local.get();
    const crmKeys = Object.keys(allData).filter(k => k.startsWith('crm_'));
    
    // Remove apenas as chaves do CRM
    await chrome.storage.local.remove(crmKeys);
    
    console.log(`🧹 ${crmKeys.length} chaves removidas`);
    
    // Limpa o badge
    await chrome.action.setBadgeText({ text: '' });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar tudo:', error);
    throw error;
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================
function calcularEstatisticas(data) {
  if (!data) return { totalClients: 0, totalDeals: 0 };
  
  const totalClients = Object.keys(data.clients || {}).length;
  const totalDeals = Object.values(data.clients || {})
    .reduce((sum, client) => sum + (client.deals?.length || 0), 0);
  
  return { totalClients, totalDeals };
}

async function atualizarBadge(numero) {
  try {
    if (numero > 0) {
      await chrome.action.setBadgeText({ text: numero.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar badge:', error);
  }
}

// =====================================================
// INSTALAÇÃO E ATUALIZAÇÃO
// =====================================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🚀 Extensão instalada/atualizada:', details.reason);
  
  if (details.reason === 'install') {
    // Primeira instalação
    console.log('🎉 Bem-vindo ao CRM Vision Pro!');
    
    // Cria estrutura inicial
    const estruturaInicial = {
      clients: {},
      columns: [
        { id: 'leads', title: '🎯 Leads', clients: [], color: '#6366f1' },
        { id: 'negotiation', title: '💬 Em Negociação', clients: [], color: '#8b5cf6' },
        { id: 'proposal', title: '📝 Proposta Enviada', clients: [], color: '#ec4899' },
        { id: 'closing', title: '🤝 Fechamento', clients: [], color: '#f59e0b' },
        { id: 'success', title: '✅ Sucesso', clients: [], color: '#10b981' }
      ],
      tasks: [],
      settings: {
        theme: 'light',
        notifications: true,
        autoCapture: true
      }
    };
    
    await salvarDados('kanban_data', estruturaInicial);
    await salvarDados('settings', estruturaInicial.settings);
    
    // Abre aba de boas-vindas
    chrome.tabs.create({
      url: 'https://web.whatsapp.com',
      active: true
    });
    
  } else if (details.reason === 'update') {
    // Atualização da extensão
    console.log('📦 Extensão atualizada para versão mais recente');
    
    // Migração de dados se necessário
    await migrarDados();
  }
});

// =====================================================
// MIGRAÇÃO DE DADOS
// =====================================================
async function migrarDados() {
  try {
    const data = await carregarDados('kanban_data');
    if (!data) return;
    
    let precisaMigrar = false;
    
    // Verifica se precisa migrar estrutura antiga
    if (data.columns && !data.clients) {
      console.log('🔄 Migrando estrutura antiga...');
      
      // Cria objeto clients
      data.clients = {};
      
      // Extrai clients das colunas
      data.columns.forEach(col => {
        if (col.clients && Array.isArray(col.clients)) {
          col.clients.forEach(client => {
            if (typeof client === 'object' && client.id) {
              data.clients[client.id] = client;
            }
          });
          // Converte para array de IDs
          col.clients = col.clients
            .filter(c => c.id)
            .map(c => c.id);
        }
      });
      
      precisaMigrar = true;
    }
    
    // Adiciona campos novos se não existirem
    if (!data.settings) {
      data.settings = {
        theme: 'light',
        notifications: true,
        autoCapture: true
      };
      precisaMigrar = true;
    }
    
    if (precisaMigrar) {
      await salvarDados('kanban_data', data);
      console.log('✅ Migração concluída com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

// =====================================================
// ALARMES E TAREFAS AGENDADAS
// =====================================================
// Verifica se a API está disponível antes de usar
if (chrome.alarms) {
  chrome.alarms.create('syncData', { periodInMinutes: 5 });
  
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'syncData') {
      console.log('⏰ Executando sincronização agendada');
      
      const data = await carregarDados('kanban_data');
      if (data) {
        const stats = calcularEstatisticas(data);
        await atualizarBadge(stats.totalClients);
      }
    }
  });
}

// =====================================================
// CONTEXT MENUS (Menus de Contexto)
// =====================================================
chrome.runtime.onInstalled.addListener(() => {
  // Verifica se contextMenus está disponível
  if (chrome.contextMenus) {
    // Cria menu de contexto para capturar número
    chrome.contextMenus.create({
      id: 'capturarNumero',
      title: 'Capturar número para CRM',
      contexts: ['selection']
    });
    
    // Cria menu para salvar imagem
    chrome.contextMenus.create({
      id: 'salvarImagem',
      title: 'Usar como foto do contato',
      contexts: ['image']
    });
  }
});

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'capturarNumero') {
      // Envia número selecionado para o content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'numeroCapturado',
        numero: info.selectionText
      });
    } else if (info.menuItemId === 'salvarImagem') {
      // Envia URL da imagem para o content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'imagemCapturada',
        url: info.srcUrl
      });
    }
  });
}

// =====================================================
// NOTIFICAÇÕES
// =====================================================
async function enviarNotificacao(titulo, mensagem, tipo = 'basic') {
  try {
    await chrome.notifications.create({
      type: tipo,
      iconUrl: '/assets/icons/icon-128.png',
      title: titulo,
      message: mensagem,
      priority: 2
    });
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
  }
}

// =====================================================
// EXPORTAÇÃO DE FUNÇÕES (para debug)
// =====================================================
if (typeof globalThis !== 'undefined') {
  globalThis.CRMBackground = {
    salvarDados,
    carregarDados,
    removerDados,
    listarChaves,
    limparTudo,
    enviarNotificacao
  };
}
