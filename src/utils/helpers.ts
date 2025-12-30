// Utilidades do sistema

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const formatarValorBrasileiro = (valor: number | string): string => {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const converterValorBrasileiroParaNumero = (valor: string): number => {
  if (!valor) return NaN;
  // Remove pontos (separador de milhar) e substitui vírgula por ponto (decimal)
  const valorLimpo = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(valorLimpo);
};

export const formatarCEP = (cep: string): string => {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const formatarCPF = (cpf: string): string => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatarTelefone = (telefone: string): string => {
  const cleaned = telefone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
};

export const validarTelefone = (telefone: string): boolean => {
  const cleaned = telefone.replace(/\D/g, '');
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return false;
  }
  
  // Verifica se não é uma sequência de números iguais
  if (/^(\d)\1+$/.test(cleaned)) {
    return false;
  }
  
  // Valida DDD
  const ddd = parseInt(cleaned.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  return true;
};

export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validarCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) {
    return false;
  }
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleaned.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
};

export const gerarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const obterFotoDestaque = (fotos: { isDestaque: boolean; url: string }[]): string => {
  const fotoDestaque = fotos.find(f => f.isDestaque);
  return fotoDestaque?.url || fotos[0]?.url || '/placeholder-imovel.jpg';
};

export const enviarWhatsApp = (telefone: string, mensagem: string): void => {
  const cleaned = telefone.replace(/\D/g, '');
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
};

export const categorizarAndar = (andar: string): string => {
  const numero = parseInt(andar);
  if (isNaN(numero)) return '';
  return numero <= 5 ? 'Andar Baixo' : 'Andar Alto';
};

export const obterDescricaoFachada = (fachada: string): string => {
  const descricoes: { [key: string]: string } = {
    'Nascente': 'Nascente (Sol da Manhã)',
    'Poente': 'Poente (Sol da Tarde)',
    'Sul': 'Fachada Sul',
    'Norte': 'Fachada Norte',
  };
  return descricoes[fachada] || fachada;
};

export const converterM2ParaAlqueires = (m2: number, tipoAlqueire: 'Goiano' | 'Paulista' | 'Baiano' | 'Mineiro'): number => {
  const conversoes = {
    'Goiano': 48400,
    'Mineiro': 48400,
    'Paulista': 24200,
    'Baiano': 96800,
  };
  const m2PorAlqueire = conversoes[tipoAlqueire];
  return m2 / m2PorAlqueire;
};

export const obterM2PorAlqueire = (tipoAlqueire: 'Goiano' | 'Paulista' | 'Baiano' | 'Mineiro'): number => {
  const conversoes = {
    'Goiano': 48400,
    'Mineiro': 48400,
    'Paulista': 24200,
    'Baiano': 96800,
  };
  return conversoes[tipoAlqueire];
};


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Comprimir a imagem usando canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao processar imagem'));
          return;
        }

        // Redimensionar mantendo proporção
        let width = img.width;
        let height = img.height;
        const maxSize = 1200; // Tamanho máximo em pixels

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para base64 com qualidade reduzida (0.7 = 70%)
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
