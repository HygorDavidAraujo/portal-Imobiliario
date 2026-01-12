import { z } from 'zod';

// ==================== SCHEMAS DE VALIDAÇÃO ====================

// Validadores básicos reutilizáveis
const telefoneSchema = z
  .string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, 'Telefone inválido')
  .optional()
  .or(z.literal(''));

const emailSchema = z
  .string()
  .email('E-mail inválido')
  .optional()
  .or(z.literal(''));

const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
  .optional()
  .or(z.literal(''));

const urlSchema = z.string().url('URL inválida');

// Schema para foto
export const fotoSchema = z.object({
  id: z.string(),
  url: urlSchema,
  isDestaque: z.boolean().default(false),
});

// Schema para endereço
export const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
});

// Schema para ficha técnica
export const fichaTecnicaSchema = z.object({
  areaTotal: z.number().positive('Área total deve ser maior que 0').optional(),
  areaConstruida: z.number().positive('Área construída deve ser maior que 0').optional(),
  quartos: z.number().int().nonnegative('Quartos deve ser um número não-negativo').optional(),
  suites: z.number().int().nonnegative('Suítes deve ser um número não-negativo').optional(),
  banheiros: z.number().int().nonnegative('Banheiros deve ser um número não-negativo').optional(),
  vagasGaragem: z.number().int().nonnegative('Vagas de garagem deve ser um número não-negativo').optional(),
  anoConstructao: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
  mobiliado: z.boolean().default(false),
  escritorio: z.boolean().default(false),
  lavabo: z.boolean().default(false),
  despensa: z.boolean().default(false),
  areaServico: z.boolean().default(false),
  jardim: z.boolean().default(false),
  varandaGourmet: z.boolean().default(false),
  piscinaPrivativa: z.boolean().default(false),
  churrasqueiraPrivativa: z.boolean().default(false),
  valorIptu: z.number().positive('Valor IPTU deve ser maior que 0').optional(),
  valorItu: z.number().positive('Valor ITU deve ser maior que 0').optional(),
});

// Schema para dados do apartamento
export const dadosApartamentoSchema = z.object({
  numeroApartamento: z.string().min(1, 'Número do apartamento é obrigatório'),
  andar: z.string().optional(),
  blocoTorre: z.string().optional(),
  nomeEmpreendimento: z.string().optional(),
  elevador: z.boolean().default(false),
  fachada: z.enum(['Nascente', 'Poente', 'Sul', 'Norte']).optional(),
});

// Schema para dados do condomínio
export const dadosCondominioSchema = z.object({
  valorCondominio: z.number().positive('Valor do condomínio deve ser maior que 0').optional(),
  seguranca24h: z.boolean().default(false),
  portaria: z.boolean().default(false),
  elevador: z.boolean().default(false),
  quadraEsportiva: z.boolean().default(false),
  piscina: z.boolean().default(false),
  salaoDeFestas: z.boolean().default(false),
  churrasqueira: z.boolean().default(false),
  playground: z.boolean().default(false),
  academia: z.boolean().default(false),
  vagasVisitante: z.boolean().default(false),
  salaCinema: z.boolean().default(false),
  hortaComunitaria: z.boolean().default(false),
  areaGourmetChurrasqueira: z.boolean().default(false),
  miniMercado: z.boolean().default(false),
  portariaRemota: z.boolean().default(false),
  coworking: z.boolean().default(false),
});

// Schema para dados rurais
export const dadosRuralSchema = z.object({
  rio: z.boolean().default(false),
  piscina: z.boolean().default(false),
  represa: z.boolean().default(false),
  lago: z.boolean().default(false),
  curral: z.boolean().default(false),
  estabulo: z.boolean().default(false),
  galinheiro: z.boolean().default(false),
  pocilga: z.boolean().default(false),
  silo: z.boolean().default(false),
  terraceamento: z.boolean().default(false),
  energia: z.boolean().default(false),
  agua: z.boolean().default(false),
  acessoAsfalto: z.boolean().default(false),
  casariao: z.boolean().default(false),
  areaAlqueires: z.number().positive('Área em alqueires deve ser maior que 0').optional(),
  tipoAlqueire: z.enum(['Goiano', 'Paulista', 'Baiano', 'Mineiro']).optional(),
  valorItr: z.number().positive('Valor ITR deve ser maior que 0').optional(),
});

// Schema para dados do lote em condomínio
export const dadosLoteCondominioSchema = z.object({
  nomeEmpreendimento: z.string().min(1, 'Nome do empreendimento é obrigatório'),
  quadra: z.string().optional(),
  lote: z.string().optional(),
});

// Schema para tipologia
export const tipologiaSchema = z.object({
  tipoVenda: z.enum(['Venda', 'Aluguel', 'Venda/Aluguel']).default('Venda'),
  aceitaPermuta: z.boolean().default(false),
  aceitaFinanciamento: z.boolean().default(false),
});

// Schema para proprietário
export const proprietarioSchema = z.object({
  nome: z.string().min(3, 'Nome do proprietário deve ter pelo menos 3 caracteres').optional(),
  telefone: telefoneSchema,
  email: emailSchema,
  cpf: cpfSchema,
});

// Schema principal para imóvel
export const imovelSchema = z.object({
  id: z.string().optional(),
  categoria: z.enum(['Residencial', 'Comercial', 'Rural']),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título não pode ter mais de 200 caracteres'),
  descricao: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres').max(5000, 'Descrição não pode ter mais de 5000 caracteres'),
  preco: z.number().positive('Preço deve ser maior que 0'),
  endereco: enderecoSchema,
  fichaTecnica: fichaTecnicaSchema.optional(),
  dadosApartamento: dadosApartamentoSchema.optional(),
  dadosCondominio: dadosCondominioSchema.optional(),
  dadosRural: dadosRuralSchema.optional(),
  dadosLoteCondominio: dadosLoteCondominioSchema.optional(),
  tipologia: tipologiaSchema.optional(),
  proprietario: proprietarioSchema.optional(),
  fotos: z.array(fotoSchema).min(4, 'Mínimo de 4 fotos é obrigatório'),
  ativo: z.boolean().default(true),
  dataCadastro: z.date().optional(),
});

// Schema para lead
export const leadSchema = z.object({
  id: z.string().optional(),
  imovelId: z.string().min(1, 'ID do imóvel é obrigatório'),
  imovelTitulo: z.string().min(1, 'Título do imóvel é obrigatório'),
  cliente: z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome não pode ter mais de 100 caracteres'),
    telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, 'Telefone inválido'),
    email: z.string().email('E-mail inválido'),
  }),
  data: z.date().optional(),
  visualizado: z.boolean().default(false),
});

// Schema para envio de lead por e-mail
export const sendLeadEmailSchema = z.object({
  imovelId: z.string().min(1, 'ID do imóvel é obrigatório'),
  imovelTitulo: z.string().min(1, 'Título do imóvel é obrigatório'),
  preco: z.string().min(1, 'Preço é obrigatório'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  contato: z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, 'Telefone inválido'),
    email: z.string().email('E-mail inválido'),
  }),
  link: z.string().url('URL do imóvel inválida').optional(),
});

// Função helper para validar e retornar erros formatados
export const validateAndFormat = <T,>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod v3 expõe `errors`, Zod v4 expõe `issues`. Suporta ambos.
      const issues: z.ZodIssue[] = (error as any).issues ?? (error as any).errors ?? [];
      const formatted = issues.map((issue) => {
        const path = Array.isArray(issue.path) ? issue.path.join('.') : '';
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      return { success: false, errors: formatted.length ? formatted : ['Dados inválidos'] };
    }
    return { success: false, errors: ['Erro desconhecido ao validar dados'] };
  }
};
