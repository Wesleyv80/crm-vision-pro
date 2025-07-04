// =====================================================
// Módulo de Armazenamento de Dados
// =====================================================
// Gerencia toda a persistência de dados da extensão
// Usa chrome.storage.local e comunicação com background

window.CRMStorage = (() => {
  
  // Prefixo para todas as chaves do CRM
  const PREFIX = 'crm_';
  
  // Cache local para performance
  const cache = new Map();
  
  // =====================================================
  // SALVAR DADOS
  // =====================================================
  async function salvar(chave, dados) {
    try {
      const chaveCompleta = PREFIX + chave;
      
      // Atualiza cache local
      cache.set(chaveCompleta, dados);
      
      // Envia para o background script
      const response = await enviarParaBackground('salvarDados', {
        uid: chave,
        data: dados
      });
      
      if (response && response.success) {
        console.log(`💾 Dados salvos: ${chave}`);
        return true;
      } else {
        throw new Error(response?.error || 'Erro ao salvar');
      }
    } catch (erro) {
      console.error('❌ Erro ao salvar dados:', erro);
      
      // Fallback: tenta salvar no localStorage
      try {
        localStorage.setItem(PREFIX + chave, JSON.stringify(dados));
        console.log('💾 Dados salvos no localStorage (fallback)');
        return true;
      } catch (e) {
        console.error('❌ Fallback também falhou:', e);
        return false;
      }
    }
  }
  
  // =====================================================
  // CARREGAR DADOS
  // =====================================================
  async function carregar(chave) {
    try {
      const chaveCompleta = PREFIX + chave;
      
      // Verifica cache primeiro
      if (cache.has(chaveCompleta)) {
        console.log(`📦 Dados do cache: ${chave}`);
        return cache.get(chaveCompleta);
      }
      
      // Busca do background
      const response = await enviarParaBackground('carregarDados', {
        uid: chave
      });
      
      if (response) {
        // Atualiza cache
        cache.set(chaveCompleta, response);
        console.log(`📦 Dados carregados: ${chave}`);
        return response;
      }
      
      // Fallback: tenta localStorage
      const localData = localStorage.getItem(chaveCompleta);
      if (localData) {
        const dados = JSON.parse(localData);
        cache.set(chaveCompleta, dados);
        console.log('📦 Dados do localStorage (fallback)');
        return dados;
      }
      
      return null;
    } catch (erro) {
      console.error('❌ Erro ao carregar dados:', erro);
      return null;
    }
  }
  
  // =====================================================
  // REMOVER DADOS
  // =====================================================
  async function remover(chave) {
    try {
      const chaveCompleta = PREFIX + chave;
      
      // Remove do cache
      cache.delete(chaveCompleta);
      
      // Remove do storage
      const response = await enviarParaBackground('removerDados', {
        uid: chave
      });
      
      // Remove do localStorage também
      localStorage.removeItem(chaveCompleta);
      
      console.log(`🗑️ Dados removidos: ${chave}`);
      return true;
    } catch (erro) {
      console.error('❌ Erro ao remover dados:', erro);
      return false;
    }
  }
  
  // =====================================================
  // LISTAR CHAVES
  // =====================================================
  async function listarChaves() {
    try {
      // Busca todas as chaves do chrome.storage
      const response = await enviarParaBackground('listarChaves', {});
      
      if (response && response.keys) {
        return response.keys.filter(k => k.startsWith(PREFIX));
      }
      
      // Fallback: lista do localStorage
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          keys.push(key);
        }
      }
      
      return keys;
    } catch (erro) {
      console.error('❌ Erro ao listar chaves:', erro);
      return [];
    }
  }
  
  // =====================================================
  // LIMPAR TODOS OS DADOS
  // =====================================================
  async function limparTudo() {
    try {
      const confirmar = await CRMUI.confirmar({
        titulo: 'Limpar Dados',
        mensagem: '⚠️ Tem certeza que deseja apagar TODOS os dados do CRM?',
        tipo: 'danger'
      });
      if (!confirmar) {
        return false;
      }
      
      // Limpa cache
      cache.clear();
      
      // Limpa chrome.storage
      await enviarParaBackground('limparTudo', {});
      
      // Limpa localStorage
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach(k => localStorage.removeItem(k));
      
      console.log('🧹 Todos os dados foram limpos');
      return true;
    } catch (erro) {
      console.error('❌ Erro ao limpar dados:', erro);
      return false;
    }
  }
  
  // =====================================================
  // EXPORTAR DADOS
  // =====================================================
  async function exportarDados() {
    try {
      const todasChaves = await listarChaves();
      const dados = {};
      
      for (const chave of todasChaves) {
        const chaveSimples = chave.replace(PREFIX, '');
        dados[chaveSimples] = await carregar(chaveSimples);
      }
      
      // Cria arquivo JSON
      const json = JSON.stringify(dados, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Cria link para download
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      console.log('📤 Dados exportados com sucesso');
      
      return true;
    } catch (erro) {
      console.error('❌ Erro ao exportar dados:', erro);
      return false;
    }
  }
  
  // =====================================================
  // IMPORTAR DADOS
  // =====================================================
  async function importarDados(arquivo) {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const dados = JSON.parse(e.target.result);
            
            // Salva cada chave
            for (const [chave, valor] of Object.entries(dados)) {
              await salvar(chave, valor);
            }
            
            console.log('📥 Dados importados com sucesso');
            resolve(true);
          } catch (erro) {
            reject(erro);
          }
        };
        
        reader.onerror = reject;
        reader.readAsText(arquivo);
      });
    } catch (erro) {
      console.error('❌ Erro ao importar dados:', erro);
      return false;
    }
  }
  
  // =====================================================
  // ESTATÍSTICAS DE USO
  // =====================================================
  async function obterEstatisticas() {
    try {
      const todasChaves = await listarChaves();
      let tamanhoTotal = 0;
      
      for (const chave of todasChaves) {
        const chaveSimples = chave.replace(PREFIX, '');
        const dados = await carregar(chaveSimples);
        if (dados) {
          tamanhoTotal += JSON.stringify(dados).length;
        }
      }
      
      return {
        totalChaves: todasChaves.length,
        tamanhoBytes: tamanhoTotal,
        tamanhoMB: (tamanhoTotal / 1024 / 1024).toFixed(2),
        cacheAtivo: cache.size
      };
    } catch (erro) {
      console.error('❌ Erro ao obter estatísticas:', erro);
      return null;
    }
  }
  
  // =====================================================
  // COMUNICAÇÃO COM BACKGROUND
  // =====================================================
  function enviarParaBackground(action, data) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome?.runtime?.sendMessage) {
          console.warn('⚠️ chrome.runtime.sendMessage não disponível. Usando fallback.');
          resolve(null); // permite fallback localStorage
          return;
        }

        chrome.runtime.sendMessage(
          { action, ...data },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn('⚠️ Falha na comunicação com background:', chrome.runtime.lastError.message);
              resolve(null); // evita quebra, aciona fallback no salvar()
            } else {
              resolve(response);
            }
          }
        );
      } catch (erro) {
        console.warn('⚠️ Exceção ao usar chrome.runtime.sendMessage:', erro);
        resolve(null); // fallback
      }
    });
  }
  
  // =====================================================
  // SINCRONIZAÇÃO AUTOMÁTICA
  // =====================================================
  let syncInterval = null;
  
  function iniciarSincronizacao(intervaloMs = 30000) {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    syncInterval = setInterval(async () => {
      console.log('🔄 Sincronizando dados...');
      
      // Recarrega dados importantes do storage
      const kanbanData = await carregar('kanban_data');
      if (kanbanData) {
        cache.set(PREFIX + 'kanban_data', kanbanData);
      }
    }, intervaloMs);
    
    console.log('🔄 Sincronização automática iniciada');
  }
  
  function pararSincronizacao() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
      console.log('🛑 Sincronização automática parada');
    }
  }
  
  // =====================================================
  // API PÚBLICA DO MÓDULO
  // =====================================================
  return {
    salvar,
    carregar,
    remover,
    listarChaves,
    limparTudo,
    exportarDados,
    importarDados,
    obterEstatisticas,
    iniciarSincronizacao,
    pararSincronizacao,
    
    // Acesso ao cache (apenas leitura)
    get cache() {
      return new Map(cache);
    }
  };
})();

// =====================================================
// AUTO-INICIALIZAÇÃO
// =====================================================
console.log('✅ Módulo CRMStorage carregado com sucesso!');

// Inicia sincronização automática
CRMStorage.iniciarSincronizacao();
