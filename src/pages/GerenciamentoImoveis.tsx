import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useImoveis } from '../contexts/ImoveisContext';
import { Imovel, CategoriaImovel, TipoComercial, TipoResidencial, TipoRural, TipoAlqueire, Foto } from '../types';
import { gerarId, validarCPF, validarEmail, validarTelefone, formatarValorBrasileiro, converterValorBrasileiroParaNumero, fileToBase64 } from '../utils/helpers';
import { Upload, X, Check, ArrowLeft, Save } from 'lucide-react';

const tiposComercial: TipoComercial[] = ['Casa', 'Sobrado', 'Sala', 'Área/Lote'];
const tiposResidencial: TipoResidencial[] = ['Casa em Condomínio', 'Casa', 'Sobrado em Condomínio', 'Sobrado', 'Apartamento', 'Lote', 'Lote em Condomínio'];
const tiposRural: TipoRural[] = ['Área/Lote', 'Chácara', 'Fazenda'];

export const GerenciamentoImoveis: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adicionarImovel, atualizarImovel, obterImovelPorId } = useImoveis();
  
  const [categoria, setCategoria] = useState<CategoriaImovel>('Residencial');
  const [tipo, setTipo] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  
  // Endereço
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  
  // Dados Apartamento
  const [numeroApartamento, setNumeroApartamento] = useState('');
  const [andar, setAndar] = useState('');
  const [blocoTorre, setBlocoTorre] = useState('');
  const [nomeEmpreendimento, setNomeEmpreendimento] = useState('');
  const [elevadorApartamento, setElevadorApartamento] = useState(false);
  const [fachada, setFachada] = useState<'Nascente' | 'Poente' | 'Sul' | 'Norte' | ''>('');
  
  // Dados Condomínio
  const [valorCondominio, setValorCondominio] = useState('');
  const [seguranca24h, setSeguranca24h] = useState(false);
  const [portaria, setPortaria] = useState(false);
  const [elevador, setElevador] = useState(false);
  const [quadraEsportiva, setQuadraEsportiva] = useState(false);
  const [piscina, setPiscina] = useState(false);
  const [salaoDeFestas, setSalaoDeFestas] = useState(false);
  const [churrasqueira, setChurrasqueira] = useState(false);
  const [playground, setPlayground] = useState(false);
  const [academia, setAcademia] = useState(false);
  const [vagasVisitante, setVagasVisitante] = useState(false);
  const [salaCinema, setSalaCinema] = useState(false);
  const [hortaComunitaria, setHortaComunitaria] = useState(false);
  const [areaGourmetChurrasqueira, setAreaGourmetChurrasqueira] = useState(false);
  const [miniMercado, setMiniMercado] = useState(false);
  const [portariaRemota, setPortariaRemota] = useState(false);
  const [coworking, setCoworking] = useState(false);
  
  // Ficha Técnica
  const [areaTotal, setAreaTotal] = useState('');
  const [areaConstruida, setAreaConstruida] = useState('');
  const [quartos, setQuartos] = useState('');
  const [suites, setSuites] = useState('');
  const [banheiros, setBanheiros] = useState('');
  const [vagasGaragem, setVagasGaragem] = useState('');
  const [anoConstructao, setAnoConstructao] = useState('');
  const [mobiliado, setMobiliado] = useState(false);
  const [escritorio, setEscritorio] = useState(false);
  const [lavabo, setLavabo] = useState(false);
  const [despensa, setDespensa] = useState(false);
  const [areaServico, setAreaServico] = useState(false);
  const [jardim, setJardim] = useState(false);
  const [varandaGourmet, setVarandaGourmet] = useState(false);
  const [piscinaPrivativa, setPiscinaPrivativa] = useState(false);
  const [churrasqueiraPrivativa, setChurrasqueiraPrivativa] = useState(false);
  const [valorIptu, setValorIptu] = useState('');
  const [valorItu, setValorItu] = useState('');
  
  // Dados Lote em Condomínio
  const [nomeEmpreendimentoLote, setNomeEmpreendimentoLote] = useState('');
  const [quadraLote, setQuadraLote] = useState('');
  const [loteLote, setLoteLote] = useState('');
  
  // Dados Rurais
  const [rio, setRio] = useState(false);
  const [piscinaRural, setPiscinaRural] = useState(false);
  const [represa, setRepresa] = useState(false);
  const [lago, setLago] = useState(false);
  const [curral, setCurral] = useState(false);
  const [estabulo, setEstabulo] = useState(false);
  const [galinheiro, setGalinheiro] = useState(false);
  const [pocilga, setPocilga] = useState(false);
  const [silo, setSilo] = useState(false);
  const [terraceamento, setTerraceamento] = useState(false);
  const [energia, setEnergia] = useState(false);
  const [agua, setAgua] = useState(false);
  const [acessoAsfalto, setAcessoAsfalto] = useState(false);
  const [casariao, setCasariao] = useState(false);
  const [tipoAlqueire, setTipoAlqueire] = useState<TipoAlqueire>('Goiano');
  const [areaAlqueires, setAreaAlqueires] = useState('0');
  const [valorItr, setValorItr] = useState('');
  
  // Tipologia
  const [tipoVenda, setTipoVenda] = useState<'Venda' | 'Aluguel' | 'Venda/Aluguel'>('Venda');
  const [aceitaPermuta, setAceitaPermuta] = useState(false);
  const [aceitaFinanciamento, setAceitaFinanciamento] = useState(false);
  
  // Fotos
  const [fotos, setFotos] = useState<Foto[]>([]);
  
  // Proprietário
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [telefoneProprietario, setTelefoneProprietario] = useState('');
  const [emailProprietario, setEmailProprietario] = useState('');
  const [cpfProprietario, setCpfProprietario] = useState('');
  
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      const imovel = obterImovelPorId(id);
      if (imovel) {
        carregarImovel(imovel);
      }
    }
  }, [id]);

  const carregarImovel = (imovel: Imovel) => {
    setCategoria(imovel.categoria);
    setTipo(imovel.tipo);
    setTitulo(imovel.titulo);
    setDescricao(imovel.descricao);
    setPreco(formatarValorBrasileiro(imovel.preco));
    
    setLogradouro(imovel.endereco.logradouro || '');
    setNumero(imovel.endereco.numero || '');
    setComplemento(imovel.endereco.complemento || '');
    setBairro(imovel.endereco.bairro || '');
    setCidade(imovel.endereco.cidade || '');
    setEstado(imovel.endereco.estado || '');
    setCep(imovel.endereco.cep || '');
    
    if (imovel.dadosApartamento) {
      setNumeroApartamento(imovel.dadosApartamento.numeroApartamento);
      setAndar(imovel.dadosApartamento.andar);
      setBlocoTorre(imovel.dadosApartamento.blocoTorre);
      setNomeEmpreendimento(imovel.dadosApartamento.nomeEmpreendimento);
      setElevadorApartamento(imovel.dadosApartamento.elevador || false);
      setFachada(imovel.dadosApartamento.fachada || '');
    }
    
    if (imovel.dadosCondominio) {
      setValorCondominio(imovel.dadosCondominio.valorCondominio ? formatarValorBrasileiro(imovel.dadosCondominio.valorCondominio) : '');
      setSeguranca24h(imovel.dadosCondominio.seguranca24h || false);
      setPortaria(imovel.dadosCondominio.portaria || false);
      setElevador(imovel.dadosCondominio.elevador || false);
      setQuadraEsportiva(imovel.dadosCondominio.quadraEsportiva || false);
      setPiscina(imovel.dadosCondominio.piscina || false);
      setSalaoDeFestas(imovel.dadosCondominio.salaoDeFestas || false);
      setChurrasqueira(imovel.dadosCondominio.churrasqueira || false);
      setPlayground(imovel.dadosCondominio.playground || false);
      setAcademia(imovel.dadosCondominio.academia || false);
      setVagasVisitante(imovel.dadosCondominio.vagasVisitante || false);
      setSalaCinema(imovel.dadosCondominio.salaCinema || false);
      setHortaComunitaria(imovel.dadosCondominio.hortaComunitaria || false);
      setAreaGourmetChurrasqueira(imovel.dadosCondominio.areaGourmetChurrasqueira || false);
      setMiniMercado(imovel.dadosCondominio.miniMercado || false);
      setPortariaRemota(imovel.dadosCondominio.portariaRemota || false);
      setCoworking(imovel.dadosCondominio.coworking || false);
    }
    
    setAreaTotal(imovel.fichaTecnica.areaTotal?.toString() || '');
    setAreaConstruida(imovel.fichaTecnica.areaConstruida?.toString() || '');
    setQuartos(imovel.fichaTecnica.quartos?.toString() || '');
    setSuites(imovel.fichaTecnica.suites?.toString() || '');
    setBanheiros(imovel.fichaTecnica.banheiros?.toString() || '');
    setVagasGaragem(imovel.fichaTecnica.vagasGaragem?.toString() || '');
    setAnoConstructao(imovel.fichaTecnica.anoConstructao?.toString() || '');
    setMobiliado(imovel.fichaTecnica.mobiliado || false);
    setEscritorio(imovel.fichaTecnica.escritorio || false);
    setLavabo(imovel.fichaTecnica.lavabo || false);
    setDespensa(imovel.fichaTecnica.despensa || false);
    setAreaServico(imovel.fichaTecnica.areaServico || false);
    setJardim(imovel.fichaTecnica.jardim || false);
    setVarandaGourmet(imovel.fichaTecnica.varandaGourmet || false);
    setPiscinaPrivativa(imovel.fichaTecnica.piscinaPrivativa || false);
    setChurrasqueiraPrivativa(imovel.fichaTecnica.churrasqueiraPrivativa || false);
    setValorIptu(imovel.fichaTecnica.valorIptu ? formatarValorBrasileiro(imovel.fichaTecnica.valorIptu) : '');
    setValorItu(imovel.fichaTecnica.valorItu ? formatarValorBrasileiro(imovel.fichaTecnica.valorItu) : '');
    
    if (imovel.dadosLoteCondominio) {
      setNomeEmpreendimentoLote(imovel.dadosLoteCondominio.nomeEmpreendimento);
      setQuadraLote(imovel.dadosLoteCondominio.quadra || '');
      setLoteLote(imovel.dadosLoteCondominio.lote || '');
    }
    
    if (imovel.dadosRural) {
      setRio(imovel.dadosRural.rio || false);
      setPiscinaRural(imovel.dadosRural.piscina || false);
      setRepresa(imovel.dadosRural.represa || false);
      setLago(imovel.dadosRural.lago || false);
      setCurral(imovel.dadosRural.curral || false);
      setEstabulo(imovel.dadosRural.estabulo || false);
      setGalinheiro(imovel.dadosRural.galinheiro || false);
      setPocilga(imovel.dadosRural.pocilga || false);
      setSilo(imovel.dadosRural.silo || false);
      setTerraceamento(imovel.dadosRural.terraceamento || false);
      setEnergia(imovel.dadosRural.energia || false);
      setAgua(imovel.dadosRural.agua || false);
      setAcessoAsfalto(imovel.dadosRural.acessoAsfalto || false);
      setCasariao(imovel.dadosRural.casariao || false);
      setTipoAlqueire(imovel.dadosRural.tipoAlqueire || 'Goiano');
      setAreaAlqueires(imovel.dadosRural.areaAlqueires?.toString() || '0');
      setValorItr(imovel.dadosRural.valorItr ? formatarValorBrasileiro(imovel.dadosRural.valorItr) : '');
    }
    
    setTipoVenda(imovel.tipologia.tipoVenda || 'Venda');
    setAceitaPermuta(imovel.tipologia.aceitaPermuta || false);
    setAceitaFinanciamento(imovel.tipologia.aceitaFinanciamento || false);
    
    setFotos(imovel.fotos);
    
    setNomeProprietario(imovel.proprietario.nome);
    setTelefoneProprietario(imovel.proprietario.telefone);
    setEmailProprietario(imovel.proprietario.email);
    setCpfProprietario(imovel.proprietario.cpf);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const novasFotos: Foto[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        novasFotos.push({
          id: gerarId(),
          url: base64,
          isDestaque: fotos.length === 0 && i === 0,
        });
      }
      
      setFotos(prev => [...prev, ...novasFotos]);
    }
  };

  const removerFoto = (id: string) => {
    setFotos(prev => prev.filter(f => f.id !== id));
  };

  const marcarComoDestaque = (id: string) => {
    setFotos(prev => prev.map(f => ({
      ...f,
      isDestaque: f.id === id,
    })));
  };

  const validarFormulario = (): boolean => {
    const novosErros: string[] = [];

    if (!titulo.trim()) novosErros.push('Título é obrigatório');
    if (!descricao.trim()) novosErros.push('Descrição é obrigatória');
    const precoNumerico = converterValorBrasileiroParaNumero(preco);
    if (!preco || precoNumerico <= 0) novosErros.push('Preço deve ser maior que zero');
    
    if (fotos.length < 4) novosErros.push('Adicione no mínimo 4 fotos');
    
    // Validar dados do proprietário apenas se preenchidos
    if (telefoneProprietario && !validarTelefone(telefoneProprietario)) novosErros.push('Telefone do proprietário inválido');
    if (emailProprietario && !validarEmail(emailProprietario)) novosErros.push('E-mail do proprietário inválido');
    if (cpfProprietario && !validarCPF(cpfProprietario)) novosErros.push('CPF do proprietário inválido');
    
    if ((tipo === 'Apartamento' || tipo.includes('Condomínio')) && !numeroApartamento && tipo === 'Apartamento') {
      novosErros.push('Número do apartamento é obrigatório');
    }

    setErros(novosErros);
    return novosErros.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Iniciando salvar imóvel...');
    console.log('Fotos carregadas:', fotos.length);
    console.log('Erros de validação:', erros);
    
    if (!validarFormulario()) {
      console.log('Formulário inválido, abortando...');
      window.scrollTo(0, 0);
      return;
    }

    const imovel: Imovel = {
      id: id || gerarId(),
      categoria,
      tipo,
      titulo,
      descricao,
      preco: converterValorBrasileiroParaNumero(preco),
      endereco: {
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
      },
      fichaTecnica: {
        areaTotal: areaTotal ? parseFloat(areaTotal) : undefined,
        areaConstruida: areaConstruida ? parseFloat(areaConstruida) : undefined,
        quartos: quartos ? parseInt(quartos) : undefined,
        suites: suites ? parseInt(suites) : undefined,
        banheiros: banheiros ? parseInt(banheiros) : undefined,
        vagasGaragem: vagasGaragem ? parseInt(vagasGaragem) : undefined,
        anoConstructao: anoConstructao ? parseInt(anoConstructao) : undefined,
        mobiliado,
        escritorio,
        lavabo,
        despensa,
        areaServico,
        jardim,
        varandaGourmet,
        piscinaPrivativa,
        churrasqueiraPrivativa,
        valorIptu: valorIptu ? converterValorBrasileiroParaNumero(valorIptu) : undefined,
        valorItu: valorItu ? converterValorBrasileiroParaNumero(valorItu) : undefined,
      },
      tipologia: {
        tipoVenda,
        aceitaPermuta,
        aceitaFinanciamento,
      },
      fotos,
      proprietario: {
        nome: nomeProprietario,
        telefone: telefoneProprietario,
        email: emailProprietario,
        cpf: cpfProprietario,
      },
      dataCadastro: new Date(),
      ativo: true,
    };

    if (tipo === 'Apartamento' && numeroApartamento) {
      imovel.dadosApartamento = {
        numeroApartamento,
        andar,
        blocoTorre,
        nomeEmpreendimento,
        elevador: elevadorApartamento,
        fachada: fachada || undefined,
      };
    }

    if (tipo === 'Lote em Condomínio' && nomeEmpreendimentoLote) {
      imovel.dadosLoteCondominio = {
        nomeEmpreendimento: nomeEmpreendimentoLote,
        quadra: quadraLote,
        lote: loteLote,
      };
    }

    if (tipo.includes('Condomínio') || tipo === 'Apartamento') {
      imovel.dadosCondominio = {
        valorCondominio: valorCondominio ? converterValorBrasileiroParaNumero(valorCondominio) : undefined,
        seguranca24h,
        portaria,
        elevador,
        quadraEsportiva,
        piscina,
        salaoDeFestas,
        churrasqueira,
        playground,
        academia,
        vagasVisitante,
        salaCinema,
        hortaComunitaria,
        areaGourmetChurrasqueira,
        miniMercado,
        portariaRemota,
        coworking,
      };
    }

    if (categoria === 'Rural') {
      imovel.dadosRural = {
        rio,
        piscina: piscinaRural,
        represa,
        lago,
        curral,
        estabulo,
        galinheiro,
        pocilga,
        silo,
        terraceamento,
        energia,
        agua,
        acessoAsfalto,
        casariao,
        areaAlqueires: parseFloat(areaAlqueires) || undefined,
        tipoAlqueire,
        valorItr: valorItr ? converterValorBrasileiroParaNumero(valorItr) : undefined,
      };
    }

    try {
      if (id) {
        console.log('Atualizando imóvel:', id);
        await atualizarImovel(id, imovel);
      } else {
        console.log('Criando novo imóvel:', imovel.id);
        await adicionarImovel(imovel);
      }

      console.log('Imóvel salvo com sucesso! Redirecionando...');
      navigate('/admin');
    } catch (error) {
      console.error('Erro ao salvar imóvel:', error);
      setErros(['Erro ao salvar imóvel. Tente novamente.']);
      window.scrollTo(0, 0);
    }
  };

  const tiposDisponiveis = categoria === 'Comercial' ? tiposComercial : 
                          categoria === 'Residencial' ? tiposResidencial : 
                          categoria === 'Rural' ? tiposRural :
                          [];

  const isCondominio = tipo.includes('Condomínio') || tipo === 'Apartamento';
  const isCasa = ['Casa', 'Casa em Condomínio', 'Sobrado', 'Sobrado em Condomínio'].includes(tipo);
  const isRural = categoria === 'Rural';
  const isLote = tipo === 'Lote' || tipo === 'Lote em Condomínio';
  const isLoteCondominio = tipo === 'Lote em Condomínio';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-800">
            {id ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
          </h1>
          <div className="w-20"></div>
        </div>

        {erros.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Corrija os seguintes erros:</h3>
            <ul className="list-disc list-inside text-red-700">
              {erros.map((erro, index) => (
                <li key={index}>{erro}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Categoria e Tipo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
              Categoria e Tipo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value as CategoriaImovel);
                    setTipo('');
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {tiposDisponiveis.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
              Informações Básicas
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título do Imóvel *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Casa moderna com 3 quartos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o imóvel em detalhes..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="text"
                  value={preco}
                  onChange={(e) => {
                    const valor = e.target.value;
                    // Permite apenas números, vírgula e ponto
                    if (/^[0-9.,]*$/.test(valor)) {
                      setPreco(valor);
                    }
                  }}
                  onBlur={(e) => {
                    // Formata ao sair do campo
                    const num = converterValorBrasileiroParaNumero(e.target.value);
                    if (num > 0) {
                      setPreco(formatarValorBrasileiro(num));
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logradouro *
                </label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número *
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado *
                </label>
                <input
                  type="text"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={2}
                  placeholder="UF"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00000-000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados do Apartamento */}
          {tipo === 'Apartamento' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
                Dados do Apartamento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número do Apartamento *
                  </label>
                  <input
                    type="text"
                    value={numeroApartamento}
                    onChange={(e) => setNumeroApartamento(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Andar
                  </label>
                  <input
                    type="text"
                    value={andar}
                    onChange={(e) => setAndar(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 5, 12, Térréo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bloco/Torre
                  </label>
                  <input
                    type="text"
                    value={blocoTorre}
                    onChange={(e) => setBlocoTorre(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome do Empreendimento
                  </label>
                  <input
                    type="text"
                    value={nomeEmpreendimento}
                    onChange={(e) => setNomeEmpreendimento(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Posição Solar / Fachada
                  </label>
                  <select
                    value={fachada}
                    onChange={(e) => setFachada(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="Nascente">Nascente (Sol da Manhã)</option>
                    <option value="Poente">Poente (Sol da Tarde)</option>
                    <option value="Sul">Fachada Sul</option>
                    <option value="Norte">Fachada Norte</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={elevadorApartamento}
                      onChange={(e) => setElevadorApartamento(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Possui Elevador</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Dados do Lote em Condomínio */}
          {isLoteCondominio && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
                Dados do Lote em Condomínio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome do Empreendimento *
                  </label>
                  <input
                    type="text"
                    value={nomeEmpreendimentoLote}
                    onChange={(e) => setNomeEmpreendimentoLote(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quadra
                  </label>
                  <input
                    type="text"
                    value={quadraLote}
                    onChange={(e) => setQuadraLote(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={loteLote}
                    onChange={(e) => setLoteLote(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dados do Condomínio */}
          {isCondominio && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
                Dados do Condomínio
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valor do Condomínio (R$)
                  </label>
                  <input
                    type="text"
                    value={valorCondominio}
                    onChange={(e) => {
                      const valor = e.target.value;
                      // Permite apenas números, vírgula e ponto
                      if (/^[0-9.,]*$/.test(valor)) {
                        setValorCondominio(valor);
                      }
                    }}
                    onBlur={(e) => {
                      // Formata ao sair do campo
                      const num = converterValorBrasileiroParaNumero(e.target.value);
                      if (num > 0) {
                        setValorCondominio(formatarValorBrasileiro(num));
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Áreas Comuns e Comodidades
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={seguranca24h}
                        onChange={(e) => setSeguranca24h(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Segurança 24h</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portaria}
                        onChange={(e) => setPortaria(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Portaria</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={elevador}
                        onChange={(e) => setElevador(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Elevador</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quadraEsportiva}
                        onChange={(e) => setQuadraEsportiva(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Quadra Esportiva</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={piscina}
                        onChange={(e) => setPiscina(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Piscina</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={salaoDeFestas}
                        onChange={(e) => setSalaoDeFestas(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Salão de Festas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={churrasqueira}
                        onChange={(e) => setChurrasqueira(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Churrasqueira</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={playground}
                        onChange={(e) => setPlayground(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Playground</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={academia}
                        onChange={(e) => setAcademia(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Academia</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vagasVisitante}
                        onChange={(e) => setVagasVisitante(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Vagas para Visitante</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={salaCinema}
                        onChange={(e) => setSalaCinema(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Sala de Cinema</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hortaComunitaria}
                        onChange={(e) => setHortaComunitaria(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Horta Comunitária</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={areaGourmetChurrasqueira}
                        onChange={(e) => setAreaGourmetChurrasqueira(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Área Gourmet c/ Churrasqueira</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={miniMercado}
                        onChange={(e) => setMiniMercado(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Mini Mercado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={portariaRemota}
                        onChange={(e) => setPortariaRemota(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Portaria Remota</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coworking}
                        onChange={(e) => setCoworking(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Co-working</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ficha Técnica */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
              Ficha Técnica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Área Total (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={areaTotal}
                  onChange={(e) => setAreaTotal(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Área Construída (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={areaConstruida}
                  onChange={(e) => setAreaConstruida(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quartos
                </label>
                <input
                  type="number"
                  value={quartos}
                  onChange={(e) => setQuartos(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Suítes
                </label>
                <input
                  type="number"
                  value={suites}
                  onChange={(e) => setSuites(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Banheiros
                </label>
                <input
                  type="number"
                  value={banheiros}
                  onChange={(e) => setBanheiros(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vagas de Garagem
                </label>
                <input
                  type="number"
                  value={vagasGaragem}
                  onChange={(e) => setVagasGaragem(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ano de Construção
                </label>
                <input
                  type="number"
                  value={anoConstructao}
                  onChange={(e) => setAnoConstructao(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mobiliado}
                    onChange={(e) => setMobiliado(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Mobiliado</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor {isLote ? 'ITU' : 'IPTU'} (R$)
                </label>
                <input
                  type="text"
                  value={isLote ? valorItu : valorIptu}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (/^[0-9.,]*$/.test(valor)) {
                      if (isLote) {
                        setValorItu(valor);
                      } else {
                        setValorIptu(valor);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const num = converterValorBrasileiroParaNumero(e.target.value);
                    if (num > 0) {
                      if (isLote) {
                        setValorItu(formatarValorBrasileiro(num));
                      } else {
                        setValorIptu(formatarValorBrasileiro(num));
                      }
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
            </div>

            {isCasa && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Diferenciais da Casa</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={escritorio}
                      onChange={(e) => setEscritorio(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Escritório</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lavabo}
                      onChange={(e) => setLavabo(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Lavabo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={despensa}
                      onChange={(e) => setDespensa(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Despensa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={areaServico}
                      onChange={(e) => setAreaServico(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Área de Serviço</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jardim}
                      onChange={(e) => setJardim(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Jardim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={varandaGourmet}
                      onChange={(e) => setVarandaGourmet(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Varanda Gourmet</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={piscinaPrivativa}
                      onChange={(e) => setPiscinaPrivativa(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Piscina Privativa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={churrasqueiraPrivativa}
                      onChange={(e) => setChurrasqueiraPrivativa(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Churrasqueira Privativa</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Tipologia */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
              Tipologia
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Transação
                </label>
                <select
                  value={tipoVenda}
                  onChange={(e) => setTipoVenda(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Venda">Venda</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Venda/Aluguel">Venda/Aluguel</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceitaPermuta}
                    onChange={(e) => setAceitaPermuta(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Aceita Permuta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceitaFinanciamento}
                    onChange={(e) => setAceitaFinanciamento(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Aceita Financiamento</span>
                </label>
              </div>
            </div>
          </div>

          {/* Dados Rurais */}
          {isRural && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
                Dados da Propriedade Rural
              </h2>
              <div className="space-y-6">
                {/* Conversão de Alqueires */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo de Alqueire
                    </label>
                    <select
                      value={tipoAlqueire}
                      onChange={(e) => setTipoAlqueire(e.target.value as TipoAlqueire)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Goiano">Goiano (48.400 m²)</option>
                      <option value="Paulista">Paulista (24.200 m²)</option>
                      <option value="Baiano">Baiano (96.800 m²)</option>
                      <option value="Mineiro">Mineiro (48.400 m²)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Área Total (m²) - Já preenchida acima
                    </label>
                    <input
                      type="text"
                      value={areaTotal}
                      disabled
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Área em Alqueires
                    </label>
                    <input
                      type="text"
                      value={areaTotal ? (parseFloat(areaTotal) / (tipoAlqueire === 'Paulista' ? 24200 : tipoAlqueire === 'Baiano' ? 96800 : 48400)).toFixed(2) : '0'}
                      disabled
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 font-semibold"
                    />
                  </div>
                </div>

                {/* Valor ITU */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valor ITU (R$)
                  </label>
                  <input
                    type="text"
                    value={valorItu}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (/^[0-9.,]*$/.test(valor)) {
                        setValorItu(valor);
                      }
                    }}
                    onBlur={(e) => {
                      const num = converterValorBrasileiroParaNumero(e.target.value);
                      if (num > 0) {
                        setValorItu(formatarValorBrasileiro(num));
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>

                {/* Recursos Rurais */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Recursos e Características da Propriedade
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rio}
                        onChange={(e) => setRio(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Rio</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={piscinaRural}
                        onChange={(e) => setPiscinaRural(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Piscina</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={represa}
                        onChange={(e) => setRepresa(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Represa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lago}
                        onChange={(e) => setLago(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Lago</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={curral}
                        onChange={(e) => setCurral(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Curral</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={estabulo}
                        onChange={(e) => setEstabulo(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Estábulo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={galinheiro}
                        onChange={(e) => setGalinheiro(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Galinheiro</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pocilga}
                        onChange={(e) => setPocilga(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Pocilga</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={silo}
                        onChange={(e) => setSilo(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Silo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={terraceamento}
                        onChange={(e) => setTerraceamento(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Terraceamento</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={energia}
                        onChange={(e) => setEnergia(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Energia Elétrica</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agua}
                        onChange={(e) => setAgua(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Água Encanada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acessoAsfalto}
                        onChange={(e) => setAcessoAsfalto(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Acesso Asfalto</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={casariao}
                        onChange={(e) => setCasariao(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Casarão Histórico</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fotos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
              Fotos (mínimo 4) *
            </h2>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="text-slate-400 mb-2" size={32} />
                <span className="text-sm text-slate-600">Clique para adicionar fotos</span>
                <span className="text-xs text-slate-500 mt-1">PNG, JPG ou GIF (max. 5MB cada)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
                            
              {fotos.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  ✅ {fotos.length} foto{fotos.length > 1 ? 's' : ''} adicionada{fotos.length > 1 ? 's' : ''}
                  {fotos.length < 4 && ` - Faltam ${4 - fotos.length} foto${4 - fotos.length > 1 ? 's' : ''}`}
                </div>
              )}
              
              {fotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fotos.map((foto) => (
                    <div key={foto.id} className="relative group">
                      <img
                        src={foto.url}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => marcarComoDestaque(foto.id)}
                          className={`p-2 rounded-full ${
                            foto.isDestaque ? 'bg-gold-500' : 'bg-white'
                          } hover:scale-110 transition-transform`}
                          title="Marcar como destaque"
                        >
                          <Check size={16} className={foto.isDestaque ? 'text-white' : 'text-slate-700'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removerFoto(foto.id)}
                          className="p-2 bg-red-500 rounded-full hover:scale-110 transition-transform"
                          title="Remover foto"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                      {foto.isDestaque && (
                        <div className="absolute top-2 left-2 bg-gold-500 text-white text-xs px-2 py-1 rounded">
                          Destaque
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Proprietário */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b border-gold-200 pb-2">
              Dados do Proprietário (Opcional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nomeProprietario}
                  onChange={(e) => setNomeProprietario(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={telefoneProprietario}
                  onChange={(e) => setTelefoneProprietario(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={emailProprietario}
                  onChange={(e) => setEmailProprietario(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpfProprietario}
                  onChange={(e) => setCpfProprietario(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Save size={20} />
              {id ? 'Atualizar Imóvel' : 'Cadastrar Imóvel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
