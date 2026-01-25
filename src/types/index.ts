// Tipos e interfaces do sistema
export type CategoriaImovel = 'Comercial' | 'Residencial' | 'Rural';

export type TipoComercial = 'Casa' | 'Sobrado' | 'Sala' | 'Área/Lote';
export type TipoResidencial = 'Casa em Condomínio' | 'Casa' | 'Sobrado em Condomínio' | 'Sobrado' | 'Apartamento' | 'Lote' | 'Lote em Condomínio';
export type TipoRural = 'Área/Lote' | 'Chácara' | 'Fazenda';

export type TipoAlqueire = 'Goiano' | 'Paulista' | 'Baiano' | 'Mineiro';

export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface DadosApartamento {
  numeroApartamento: string;
  andar: string;
  blocoTorre: string;
  nomeEmpreendimento: string;
  elevador?: boolean;
  fachada?: 'Nascente' | 'Poente' | 'Sul' | 'Norte';
}

export interface DadosLoteCondominio {
  nomeEmpreendimento: string;
  quadra?: string;
  lote?: string;
}

export interface DadosCondominio {
  valorCondominio?: number;
  areaComum?: string;
  seguranca24h?: boolean;
  portaria?: boolean;
  elevador?: boolean;
  quadraEsportiva?: boolean;
  piscina?: boolean;
  salaoDeFestas?: boolean;
  churrasqueira?: boolean;
  playground?: boolean;
  academia?: boolean;
  vagasVisitante?: boolean;
  salaCinema?: boolean;
  hortaComunitaria?: boolean;
  areaGourmetChurrasqueira?: boolean;
  miniMercado?: boolean;
  portariaRemota?: boolean;
  coworking?: boolean;
}

export interface FichaTecnica {
  areaTotal?: number;
  areaConstruida?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagasGaragem?: number;
  anoConstructao?: number;
  mobiliado?: boolean;
  escritorio?: boolean;
  lavabo?: boolean;
  despensa?: boolean;
  areaServico?: boolean;
  jardim?: boolean;
  varandaGourmet?: boolean;
  piscinaPrivativa?: boolean;
  churrasqueiraPrivativa?: boolean;
  valorIptu?: number;
  valorItu?: number;
}

export interface DadosRural {
  rio?: boolean;
  piscina?: boolean;
  represa?: boolean;
  lago?: boolean;
  curral?: boolean;
  estabulo?: boolean;
  galinheiro?: boolean;
  pocilga?: boolean;
  silo?: boolean;
  terraceamento?: boolean;
  energia?: boolean;
  agua?: boolean;
  acessoAsfalto?: boolean;
  casariao?: boolean;
  areaAlqueires?: number;
  tipoAlqueire?: TipoAlqueire;
  valorItr?: number;
}

export interface Tipologia {
  tipoVenda?: 'Venda' | 'Aluguel' | 'Venda/Aluguel';
  aceitaPermuta?: boolean;
  aceitaFinanciamento?: boolean;
}

export interface Foto {
  id: string;
  url: string;
  isDestaque: boolean;
  file?: File;
}

export interface Proprietario {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
}

export interface Imovel {
  id: string;
  categoria: CategoriaImovel;
  tipo: TipoComercial | TipoResidencial | string;
  titulo: string;
  descricao: string;
  preco: number;
  endereco: Endereco;
  dadosApartamento?: DadosApartamento;
  dadosLoteCondominio?: DadosLoteCondominio;
  dadosCondominio?: DadosCondominio;
  dadosRural?: DadosRural;
  fichaTecnica: FichaTecnica;
  tipologia: Tipologia;
  fotos: Foto[];
  proprietario: Proprietario;
  dataCadastro: Date;
  ativo: boolean;
}

export interface ContatoCliente {
  nome: string;
  telefone: string;
  email: string;
}

export interface InteresseImovel {
  imovel: Imovel;
  cliente: ContatoCliente;
  data: Date;
}

export interface Lead {
  id: string;
  imovelId: string;
  imovelTitulo: string;
  cliente: ContatoCliente;
  data: Date;
  visualizado: boolean;
}

export interface FiltrosCatalogo {
  q?: string;
  categoria?: CategoriaImovel;
  tipo?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  precoMin?: number;
  precoMax?: number;
  quartos?: number;
  id?: string;
}
