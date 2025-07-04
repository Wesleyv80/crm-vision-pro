// Deep clone de objetos
  function clonarObjeto(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => clonarObjeto(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = clonarObjeto(obj[key]);
        }
      }
      return clonedObj;
    }
  }
  
  // Mescla objetos profundamente
  function mesclarObjetos(alvo, ...fontes) {
    if (!fontes.length) return alvo;
    const fonte = fontes.shift();
    
    if (isObject(alvo) && isObject(fonte)) {
      for (const key in fonte) {
        if (isObject(fonte[key])) {
          if (!alvo[key]) Object.assign(alvo, { [key]: {} });
          mesclarObjetos(alvo[key], fonte[key]);
        } else {
          Object.assign(alvo, { [key]: fonte[key] });
        }
      }
    }
    
    return mesclarObjetos(alvo, ...fontes);
  }
  
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  
  // Remove duplicatas de array
  function removerDuplicatas(array, chave) {
    if (!chave) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const valor = item[chave];
      if (seen.has(valor)) {
        return false;
      }
      seen.add(valor);
      return true;
    });
  }
  
  // Agrupa array por chave
  function agruparPor(array, chave) {
    return array.reduce((grupos, item) => {
      const valor = typeof chave === 'function' ? chave(item) : item[chave];
      (grupos[valor] = grupos[valor] || []).push(item);
      return grupos;
    }, {});
  }
  
  // Ordena array de objetos
  function ordenarPor(array, chave, ordem = 'asc') {
    return [...array].sort((a, b) => {
      const valorA = typeof chave === 'function' ? chave(a) : a[chave];
      const valorB = typeof chave === 'function' ? chave(b) : b[chave];
      
      if (valorA < valorB) return ordem === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordem === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  // =====================================================
  // STRINGS
  // =====================================================
  
  // Capitaliza primeira letra
  function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }
  
  // Capitaliza cada palavra
  function capitalizarPalavras(texto) {
    if (!texto) return '';
    return texto.split(' ')
      .map(palavra => capitalizar(palavra))
      .join(' ');
  }
  
  // Remove acentos
  function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  
  // Gera slug
  function gerarSlug(texto) {
    return removerAcentos(texto)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Trunca texto
  function truncarTexto(texto, limite, sufixo = '...') {
    if (!texto || texto.length <= limite) return texto;
    return texto.slice(0, limite).trim() + sufixo;
  }
  
  // =====================================================
  // NÚMEROS E CÁLCULOS
  // =====================================================
  
  // Gera ID único
  function gerarId(prefixo = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefixo ? `${prefixo}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }
  
  // Calcula porcentagem
  function calcularPorcentagem(valor, total) {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }
  
  // Formata bytes
  function formatarBytes(bytes, decimais = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimais < 0 ? 0 : decimais;
    const tamanhos = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + tamanhos[i];
  }
  
  // Gera cor aleatória
  function gerarCorAleatoria() {
    const cores = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
    ];
    return cores[Math.floor(Math.random() * cores.length)];
  }
  
  // Gera cor a partir de string (sempre a mesma cor para a mesma string)
  function gerarCorDeString(str) {
    const cores = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
      '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return cores[Math.abs(hash) % cores.length];
  }
  
  // =====================================================
  // DOM
  // =====================================================
  
  // Aguarda elemento aparecer
  function aguardarElemento(seletor, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const elemento = document.querySelector(seletor);
      if (elemento) {
        resolve(elemento);
        return;
      }
      
      const observer = new MutationObserver((mutations, obs) => {
        const elemento = document.querySelector(seletor);
        if (elemento) {
          obs.disconnect();
          resolve(elemento);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Elemento ${seletor} não encontrado após ${timeout}ms`));
      }, timeout);
    });
  }
  
  // Cria elemento com atributos
  function criarElemento(tag, atributos = {}, filhos = []) {
    const elemento = document.createElement(tag);
    
    Object.entries(atributos).forEach(([chave, valor]) => {
      if (chave === 'class') {
        elemento.className = valor;
      } else if (chave === 'style' && typeof valor === 'object') {
        Object.assign(elemento.style, valor);
      } else if (chave.startsWith('on')) {
        elemento.addEventListener(chave.slice(2).toLowerCase(), valor);
      } else {
        elemento.setAttribute(chave, valor);
      }
    });

    filhos.forEach(filho => {
      if (typeof filho === 'string') {
        elemento.appendChild(document.createTextNode(filho));
      } else if (filho instanceof Node) {
        elemento.appendChild(filho);
      }
    });

    return elemento;
  }
  
  // =====================================================
  // VALIDAÇÃO
  // =====================================================
  
  // Valida telefone
  function validarTelefone(telefone) {
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Telefone brasileiro deve ter 10 ou 11 dígitos (com DDD)
    // ou 13 dígitos se incluir código do país
    return apenasNumeros.length === 10 || 
           apenasNumeros.length === 11 || 
           (apenasNumeros.length === 13 && apenasNumeros.startsWith('55'));
  }
  
  // Valida email
  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  // Valida CPF
  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação do primeiro dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }
  
  // =====================================================
  // MANIPULAÇÃO DE DADOS
  // =====================================================
  
  // Deep clone de// =====================================================
// Módulo de Utilitários - Funções Auxiliares
// =====================================================
// Funções reutilizáveis para toda a extensão

window.CRMUtils = (() => {
  
  // =====================================================
  // FORMATAÇÃO
  // =====================================================
  
  // Formata número de telefone brasileiro
  function formatarTelefone(numero) {
    if (!numero) return '';
    
    // Remove tudo exceto números
    const apenasNumeros = numero.replace(/\D/g, '');
    
    // Formato internacional (+55 11 98765-4321)
    if (apenasNumeros.length === 13 && apenasNumeros.startsWith('55')) {
      return `+${apenasNumeros.slice(0,2)} ${apenasNumeros.slice(2,4)} ${apenasNumeros.slice(4,9)}-${apenasNumeros.slice(9)}`;
    }
    
    // Formato nacional com DDD (11) 98765-4321
    if (apenasNumeros.length === 11) {
      return `(${apenasNumeros.slice(0,2)}) ${apenasNumeros.slice(2,7)}-${apenasNumeros.slice(7)}`;
    }
    
    // Formato sem DDD 98765-4321
    if (apenasNumeros.length === 9) {
      return `${apenasNumeros.slice(0,5)}-${apenasNumeros.slice(5)}`;
    }
    
    // Retorna o número original se não conseguir formatar
    return numero;
  }
  
  // Formata valor monetário
  function formatarDinheiro(valor, moeda = 'BRL') {
    if (typeof valor !== 'number') {
      valor = parseFloat(valor) || 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: moeda
    }).format(valor);
  }
  
  // Formata data
  function formatarData(data, formato = 'DD/MM/YYYY') {
    const d = new Date(data);
    
    if (isNaN(d.getTime())) {
      return 'Data inválida';
    }
    
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');
    const segundo = String(d.getSeconds()).padStart(2, '0');
    
    return formato
      .replace('DD', dia)
      .replace('MM', mes)
      .replace('YYYY', ano)
      .replace('HH', hora)
      .replace('mm', minuto)
      .replace('ss', segundo);
  }
  
  // Formata data relativa (há 2 dias, há 1 hora, etc)
  function formatarDataRelativa(data) {
    const agora = new Date();
    const dataObj = new Date(data);
    const diff = agora - dataObj;
    
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    const anos = Math.floor(dias / 365);
    
    if (segundos < 60) return 'agora mesmo';
    if (minutos < 60) return `há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    if (dias < 7) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    if (semanas < 4) return `há ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
    if (meses < 12) return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    return `há ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }
  
  // Abrevia nome
  function abreviarNome(nome, limite = 20) {
    if (!nome) return '';
    
    if (nome.length <= limite) return nome;
    
    const partes = nome.split(' ');
    if (partes.length === 1) {
      return nome.slice(0, limite) + '...';
    }
    
        // Pega primeiro e último nome
        return `${partes[0]} ${partes[partes.length - 1]}`;
      }
    
      // Retorne as funções utilitárias que deseja expor
      return {
        clonarObjeto,
        mesclarObjetos,
        isObject,
        removerDuplicatas,
        agruparPor,
        ordenarPor,
        capitalizar,
        capitalizarPalavras,
        removerAcentos,
        gerarSlug,
        truncarTexto,
        gerarId,
        calcularPorcentagem,
        formatarBytes,
        gerarCorAleatoria,
        gerarCorDeString,
        aguardarElemento,
        criarElemento,
        validarTelefone,
        validarEmail,
        validarCPF,
        formatarTelefone,
        formatarDinheiro,
        formatarData,
        formatarDataRelativa,
        abreviarNome
      };
    })();
