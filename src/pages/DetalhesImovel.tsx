import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useImoveis } from '../contexts/ImoveisContext';
import { ContatoCliente, Lead } from '../types';
import { formatarMoeda, validarEmail, validarTelefone, enviarWhatsApp, categorizarAndar, obterDescricaoFachada, gerarId, otimizarUrlCloudinary } from '../utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { getImovelById } from '../api/imoveis';
import { useMutation } from '@tanstack/react-query';
import { createLead, sendLeadEmail } from '../api/leads';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Building,
  Check,
  X as XIcon,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { ApiErrorBanner } from '../components/ApiErrorBanner';

export const DetalhesImovel: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obterImovelPorId, contatoCliente, salvarContatoCliente, toggleFavorito, isFavorito, apiError, clearApiError } = useImoveis();
  const imovelId = id || '';

  const imovelQuery = useQuery({
    queryKey: ['imovel', imovelId],
    queryFn: () => getImovelById(imovelId),
    enabled: !!imovelId,
    retry: 1,
  });

  const imovel = imovelQuery.data || obterImovelPorId(imovelId);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nome, setNome] = useState(contatoCliente?.nome || '');
  const [telefone, setTelefone] = useState(contatoCliente?.telefone || '');
  const [email, setEmail] = useState(contatoCliente?.email || '');
  const [mensagemContato, setMensagemContato] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [favorito, setFavorito] = useState(isFavorito(id || ''));
  const [leadError, setLeadError] = useState<string | null>(null);

  const createLeadMutation = useMutation({
    mutationFn: createLead,
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Não foi possível registrar seu interesse agora. Tente novamente.';
      setLeadError(msg);
    },
  });

  const sendLeadEmailMutation = useMutation({
    mutationFn: sendLeadEmail,
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Não foi possível enviar seus dados agora. Tente novamente.';
      setLeadError(msg);
    },
  });

  const enviando = createLeadMutation.isPending || sendLeadEmailMutation.isPending;

  useEffect(() => {
    if (!imovelId) {
      navigate('/');
      return;
    }
    if (imovelQuery.isError) {
      navigate('/');
    }
  }, [imovelId, imovelQuery.isError, navigate]);

  if (!imovelId) return null;
  if (imovelQuery.isLoading && !imovel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-gold-400 transition-colors rounded-lg px-2 py-2"
            >
              <ArrowLeft size={20} />
              Voltar ao catálogo
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="h-8 w-2/3 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
              <div className="h-64 w-full bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!imovel) return null;

  const totalFotos = Array.isArray(imovel.fotos) ? imovel.fotos.length : 0;
  const placeholderFoto =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23e2e8f0" width="800" height="600"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="32" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ESem imagem%3C/text%3E%3C/svg%3E';

  const proximaFoto = () => {
    if (totalFotos <= 1) return;
    setFotoAtual((prev) => (prev + 1) % totalFotos);
  };

  const fotoAnterior = () => {
    if (totalFotos <= 1) return;
    setFotoAtual((prev) => (prev - 1 + totalFotos) % totalFotos);
  };

  const handleGaleriaKeyDown = (e: React.KeyboardEvent) => {
    if (totalFotos <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      fotoAnterior();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      proximaFoto();
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setFotoAtual(0);
    }
    if (e.key === 'End') {
      e.preventDefault();
      setFotoAtual(totalFotos - 1);
    }
  };

  const handleFavoritar = () => {
    if (imovel) {
      const novoEstado = toggleFavorito(imovel.id);
      setFavorito(novoEstado);
    }
  };

  const handleInteresse = () => {
    if (contatoCliente) {
      void enviarInteresse(contatoCliente);
    } else {
      setMostrarFormulario(true);
    }
  };

  const validarFormulario = (): boolean => {
    const novosErros: string[] = [];

    if (!nome.trim()) novosErros.push('Nome completo é obrigatório');
    if (!validarTelefone(telefone)) novosErros.push('Telefone inválido');
    if (!validarEmail(email)) novosErros.push('E-mail inválido');

    setErros(novosErros);
    return novosErros.length === 0;
  };

  const handleSubmitFormulario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    const contato: ContatoCliente = { nome, telefone, email };
    salvarContatoCliente(contato);
    await enviarInteresse(contato);
  };

  const enviarInteresse = async (contato: ContatoCliente) => {
    setErros([]);
    setLeadError(null);
    if (enviando) return;

    const lead: Lead = {
      id: gerarId(),
      imovelId: imovel.id,
      imovelTitulo: imovel.titulo,
      cliente: contato,
      data: new Date(),
      visualizado: false,
    };

    const mensagem = `Olá! Tenho interesse no imóvel:\n\n` +
      `*${imovel.titulo}*\n` +
      `Preço: ${formatarMoeda(imovel.preco)}\n` +
      `Localização: ${imovel.endereco.bairro}, ${imovel.endereco.cidade} - ${imovel.endereco.estado}\n\n` +
      (mensagemContato.trim() ? `*Mensagem:*\n${mensagemContato.trim()}\n\n` : '') +
      `*Meus dados:*\n` +
      `Nome: ${contato.nome}\n` +
      `Telefone: ${contato.telefone}\n` +
      `E-mail: ${contato.email}`;

    const payload = {
      imovelId: imovel.id,
      imovelTitulo: imovel.titulo,
      preco: formatarMoeda(imovel.preco),
      endereco: `${imovel.endereco.bairro}, ${imovel.endereco.cidade} - ${imovel.endereco.estado}`,
      contato,
      link: `${window.location.origin}/imovel/${imovel.id}`,
      mensagem: mensagemContato.trim() || undefined,
    };

    try {
      // Salvar lead no banco de dados
      await createLeadMutation.mutateAsync({
        id: lead.id,
        imovelId: lead.imovelId,
        imovelTitulo: lead.imovelTitulo,
        cliente: lead.cliente,
      });

      // Enviar e-mail
      await sendLeadEmailMutation.mutateAsync(payload);

      enviarWhatsApp('5562981831483', mensagem);
      setMostrarFormulario(false);
      setMensagemContato('');
    } catch (error) {
      console.error('Erro ao enviar e-mail', error);
      const msg =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar seus dados agora. Tente novamente.';
      setLeadError(msg);
      setErros([msg]);
    }
  };

  const isCondominio = imovel.tipo.includes('Condomínio') || imovel.tipo === 'Apartamento';
  const isRural = imovel.categoria === 'Rural';
  const isApartamento = imovel.tipo === 'Apartamento';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-gold-400 transition-colors rounded-lg px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <ArrowLeft size={20} />
            Voltar ao catálogo
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-28 lg:pb-8">
        {apiError && (
          <ApiErrorBanner
            message={apiError}
            onClose={clearApiError}
            className="mb-6"
          />
        )}
        {leadError && (
          <ApiErrorBanner
            message={leadError}
            onClose={() => setLeadError(null)}
            className="mb-6"
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria de Fotos */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                className="relative h-96 bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                role="region"
                aria-label="Galeria de fotos"
                tabIndex={0}
                onKeyDown={handleGaleriaKeyDown}
              >
                <img
                  src={
                    imovel.fotos?.[fotoAtual]?.url
                      ? otimizarUrlCloudinary(imovel.fotos[fotoAtual].url, { width: 1400 })
                      : placeholderFoto
                  }
                  alt={
                    totalFotos > 0
                      ? `Foto ${fotoAtual + 1} de ${totalFotos} - ${imovel.titulo}`
                      : `Sem foto - ${imovel.titulo}`
                  }
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = placeholderFoto;
                  }}
                />
                {totalFotos > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={fotoAnterior}
                      aria-label="Foto anterior"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      type="button"
                      onClick={proximaFoto}
                      aria-label="Próxima foto"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {fotoAtual + 1} / {imovel.fotos.length}
                    </div>
                  </>
                )}
              </div>
              {totalFotos > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto" aria-label="Miniaturas">
                  {imovel.fotos.map((foto, index) => (
                    <button
                      type="button"
                      key={foto.id}
                      onClick={() => setFotoAtual(index)}
                      aria-label={`Selecionar foto ${index + 1} de ${totalFotos}`}
                      aria-current={index === fotoAtual}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === fotoAtual ? 'border-blue-600' : 'border-transparent'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
                    >
                      <img
                        src={otimizarUrlCloudinary(foto.url, { width: 220 })}
                        alt={`Miniatura ${index + 1} - ${imovel.titulo}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações Principais */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mb-2">
                    {imovel.categoria} - {imovel.tipo}
                  </span>
                  <h1 className="text-3xl font-bold text-slate-800 font-display break-words">{imovel.titulo}</h1>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right">
                  <div className="text-sm text-slate-600 mb-1">{imovel.tipologia.tipoVenda}</div>
                  <div className="text-3xl font-bold text-blue-600 font-display break-words leading-tight">
                    {formatarMoeda(imovel.preco)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600 mb-6 min-w-0">
                <MapPin size={20} className="flex-shrink-0 mt-0.5" />
                <span className="break-words">
                  {imovel.endereco.bairro}, {imovel.endereco.cidade} - {imovel.endereco.estado}
                </span>
              </div>

              {/* Características Principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
                {imovel.fichaTecnica.quartos && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bed size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{imovel.fichaTecnica.quartos}</div>
                      <div className="text-sm text-slate-600">Quartos</div>
                    </div>
                  </div>
                )}
                {imovel.fichaTecnica.banheiros && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bath size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{imovel.fichaTecnica.banheiros}</div>
                      <div className="text-sm text-slate-600">Banheiros</div>
                    </div>
                  </div>
                )}
                {imovel.fichaTecnica.vagasGaragem && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Car size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{imovel.fichaTecnica.vagasGaragem}</div>
                      <div className="text-sm text-slate-600">Garagem</div>
                    </div>
                  </div>
                )}
                {imovel.fichaTecnica.areaTotal && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Maximize size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{imovel.fichaTecnica.areaTotal}</div>
                      <div className="text-sm text-slate-600">m²</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-3">Descrição</h2>
                <p className="text-slate-600 whitespace-pre-wrap">{imovel.descricao}</p>
              </div>
            </div>

            {/* Ficha Técnica Completa */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Ficha Técnica</h2>
              <div className="grid grid-cols-2 gap-4">
                {imovel.fichaTecnica.areaTotal && (
                  <div className="flex justify-between gap-3 py-2 border-b border-slate-200 min-w-0">
                    <span className="text-slate-600">Área Total:</span>
                    <span className="font-semibold text-slate-800 text-right break-words">{imovel.fichaTecnica.areaTotal} m²</span>
                  </div>
                )}
                {imovel.fichaTecnica.areaConstruida && (
                  <div className="flex justify-between gap-3 py-2 border-b border-slate-200 min-w-0">
                    <span className="text-slate-600">Área Construída:</span>
                    <span className="font-semibold text-slate-800 text-right break-words">{imovel.fichaTecnica.areaConstruida} m²</span>
                  </div>
                )}
                {imovel.fichaTecnica.suites && (
                  <div className="flex justify-between gap-3 py-2 border-b border-slate-200 min-w-0">
                    <span className="text-slate-600">Suítes:</span>
                    <span className="font-semibold text-slate-800 text-right break-words">{imovel.fichaTecnica.suites}</span>
                  </div>
                )}
                {imovel.fichaTecnica.anoConstructao && (
                  <div className="flex justify-between gap-3 py-2 border-b border-slate-200 min-w-0">
                    <span className="text-slate-600">Ano de Construção:</span>
                    <span className="font-semibold text-slate-800 text-right break-words">{imovel.fichaTecnica.anoConstructao}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 py-2 border-b border-slate-200 min-w-0">
                  <span className="text-slate-600">Mobiliado:</span>
                  <span className="font-semibold text-slate-800 text-right break-words">
                    {imovel.fichaTecnica.mobiliado ? 'Sim' : 'Não'}
                  </span>
                </div>
                {(imovel.tipo === 'Lote' || imovel.tipo === 'Lote em Condomínio') && imovel.fichaTecnica.valorItu && (
                  <div className="flex justify-between gap-3 py-2 border-b border-slate-200 min-w-0">
                    <span className="text-slate-600">ITU (Anual):</span>
                    <span className="font-semibold text-slate-800 font-display text-right break-words">{formatarMoeda(imovel.fichaTecnica.valorItu)}</span>
                  </div>
                )}
                {imovel.tipo !== 'Lote' && imovel.tipo !== 'Lote em Condomínio' && imovel.fichaTecnica.valorIptu && (
                  <div className="flex justify-between gap-3 py-2 border-b border-slate-200 min-w-0">
                    <span className="text-slate-600">IPTU (Anual):</span>
                    <span className="font-semibold text-slate-800 font-display text-right break-words">{formatarMoeda(imovel.fichaTecnica.valorIptu)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diferenciais da Casa */}
            {['Casa', 'Casa em Condomínio', 'Sobrado', 'Sobrado em Condomínio'].includes(imovel.tipo) && (() => {
              const diferenciais = [
                { label: 'Escritório', value: imovel.fichaTecnica.escritorio },
                { label: 'Lavabo', value: imovel.fichaTecnica.lavabo },
                { label: 'Despensa', value: imovel.fichaTecnica.despensa },
                { label: 'Área de Serviço', value: imovel.fichaTecnica.areaServico },
                { label: 'Jardim', value: imovel.fichaTecnica.jardim },
                { label: 'Varanda Gourmet', value: imovel.fichaTecnica.varandaGourmet },
                { label: 'Piscina Privativa', value: imovel.fichaTecnica.piscinaPrivativa },
                { label: 'Churrasqueira Privativa', value: imovel.fichaTecnica.churrasqueiraPrivativa },
              ].filter(item => item.value);

              if (!diferenciais.length) return null;

              return (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Diferenciais da Casa</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {diferenciais.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-slate-700">
                        <Check size={18} className="text-green-600" />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Dados Rurais */}
            {isRural && imovel.dadosRural && (() => {
              const recursos = [
                { label: 'Rio', value: imovel.dadosRural.rio },
                { label: 'Piscina', value: imovel.dadosRural.piscina },
                { label: 'Represa', value: imovel.dadosRural.represa },
                { label: 'Lago', value: imovel.dadosRural.lago },
                { label: 'Curral', value: imovel.dadosRural.curral },
                { label: 'Estábulo', value: imovel.dadosRural.estabulo },
                { label: 'Galinheiro', value: imovel.dadosRural.galinheiro },
                { label: 'Pocilga', value: imovel.dadosRural.pocilga },
                { label: 'Silo', value: imovel.dadosRural.silo },
                { label: 'Terraceamento', value: imovel.dadosRural.terraceamento },
                { label: 'Energia Elétrica', value: imovel.dadosRural.energia },
                { label: 'Água Encanada', value: imovel.dadosRural.agua },
                { label: 'Acesso Asfalto', value: imovel.dadosRural.acessoAsfalto },
                { label: 'Casarão Histórico', value: imovel.dadosRural.casariao },
              ].filter(item => item.value);

              const hasAnyRuralInfo = Boolean(imovel.dadosRural.areaAlqueires || imovel.dadosRural.valorItr || recursos.length > 0);
              if (!hasAnyRuralInfo) return null;

              return (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Propriedade Rural</h2>
                  <div className="space-y-4">
                    {imovel.dadosRural.areaAlqueires && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm text-slate-600 mb-1">Tamanho da Propriedade</div>
                        <div className="text-2xl font-bold text-green-600 font-display">
                          {imovel.dadosRural.areaAlqueires.toFixed(2)} alqueire{imovel.dadosRural.areaAlqueires !== 1 ? 's' : ''}
                        </div>
                        {imovel.dadosRural.tipoAlqueire && (
                          <div className="text-xs text-slate-500 mt-1">
                            ({imovel.dadosRural.tipoAlqueire})
                          </div>
                        )}
                      </div>
                    )}
                    {imovel.dadosRural.valorItr && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-slate-600 mb-1">ITR (Anual)</div>
                        <div className="text-xl font-bold text-blue-600 font-display">
                          {formatarMoeda(imovel.dadosRural.valorItr)}
                        </div>
                      </div>
                    )}
                    {recursos.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-700 mb-3">Recursos e Características</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {recursos.map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-slate-700">
                              <Check size={18} className="text-green-600" />
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Dados do Apartamento */}
            {isApartamento && imovel.dadosApartamento && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Building size={24} />
                  Informações do Apartamento
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {imovel.dadosApartamento.andar && (
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Localização:</span>
                      <span className="font-semibold text-slate-800">{categorizarAndar(imovel.dadosApartamento.andar)}</span>
                    </div>
                  )}
                  {imovel.dadosApartamento.elevador !== undefined && (
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Elevador:</span>
                      <span className="font-semibold text-slate-800">
                        {imovel.dadosApartamento.elevador ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  )}
                  {imovel.dadosApartamento.fachada && (
                    <div className="flex justify-between py-2 border-b border-slate-200 col-span-2">
                      <span className="text-slate-600">Posição Solar:</span>
                      <span className="font-semibold text-slate-800">{obterDescricaoFachada(imovel.dadosApartamento.fachada)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dados do Condomínio */}
            {isCondominio && imovel.dadosCondominio && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Condomínio</h2>
                {imovel.dadosCondominio.valorCondominio && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <span className="text-slate-600">Valor do Condomínio: </span>
                    <span className="font-bold text-blue-600 text-lg font-display">
                      {formatarMoeda(imovel.dadosCondominio.valorCondominio)}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imovel.dadosCondominio.seguranca24h && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Segurança 24h
                    </div>
                  )}
                  {imovel.dadosCondominio.portaria && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Portaria
                    </div>
                  )}
                  {imovel.dadosCondominio.elevador && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Elevador
                    </div>
                  )}
                  {imovel.dadosCondominio.quadraEsportiva && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Quadra Esportiva
                    </div>
                  )}
                  {imovel.dadosCondominio.piscina && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Piscina
                    </div>
                  )}
                  {imovel.dadosCondominio.salaoDeFestas && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Salão de Festas
                    </div>
                  )}
                  {imovel.dadosCondominio.churrasqueira && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Churrasqueira
                    </div>
                  )}
                  {imovel.dadosCondominio.playground && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Playground
                    </div>
                  )}
                  {imovel.dadosCondominio.academia && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Academia
                    </div>
                  )}
                  {imovel.dadosCondominio.vagasVisitante && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Vagas para Visitante
                    </div>
                  )}
                  {imovel.dadosCondominio.salaCinema && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Sala de Cinema
                    </div>
                  )}
                  {imovel.dadosCondominio.hortaComunitaria && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Horta Comunitária
                    </div>
                  )}
                  {imovel.dadosCondominio.areaGourmetChurrasqueira && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Área Gourmet c/ Churrasqueira
                    </div>
                  )}
                  {imovel.dadosCondominio.miniMercado && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Mini Mercado
                    </div>
                  )}
                  {imovel.dadosCondominio.portariaRemota && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Portaria Remota
                    </div>
                  )}
                  {imovel.dadosCondominio.coworking && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Check size={18} className="text-green-600" />
                      Co-working
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tipologia */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Informações Adicionais</h2>
              <div className="flex flex-wrap gap-3">
                {imovel.tipologia.aceitaPermuta && (
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <Check size={16} />
                    Aceita Permuta
                  </span>
                )}
                {imovel.tipologia.aceitaFinanciamento && (
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <Check size={16} />
                    Aceita Financiamento
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Contato */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Interessado?</h3>
              <p className="text-slate-600 mb-6">
                Entre em contato e agende uma visita!
              </p>

              <button
                onClick={handleFavoritar}
                className={`w-full py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold mb-3 ${
                  favorito
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-red-500 hover:text-red-500'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
                aria-pressed={favorito}
                aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart size={20} fill={favorito ? 'currentColor' : 'none'} />
                {favorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>

              <button
                onClick={handleInteresse}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold text-lg mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <MessageCircle size={24} />
                Me Interessei
              </button>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <a
                  href="tel:5562981831483"
                  className="flex items-center gap-3 text-slate-700 hover:text-blue-600 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <Phone size={20} />
                  <span>(62) 98183-1483</span>
                </a>
                <a
                  href="mailto:hygordavidaraujo@gmail.com"
                  className="flex items-center gap-3 text-slate-700 hover:text-blue-600 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <Mail size={20} />
                  <span className="break-all">hygordavidaraujo@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações flutuantes no mobile */}
      {!mostrarFormulario && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 lg:hidden">
          <button
            type="button"
            onClick={handleFavoritar}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full shadow-xl transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              favorito
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
            }`}
            aria-pressed={favorito}
            aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart size={20} fill={favorito ? 'currentColor' : 'none'} />
            <span className="text-sm font-semibold">
              {favorito ? 'Favorito' : 'Favoritar'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleInteresse}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full shadow-xl bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Me interessei"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-semibold">Me interessei</span>
          </button>
        </div>
      )}

      {/* Modal de Contato */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-slate-800">Seus Dados</h3>
              <button
                onClick={() => setMostrarFormulario(false)}
                disabled={enviando}
                className="text-slate-400 hover:text-slate-600 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Fechar modal"
              >
                <XIcon size={24} />
              </button>
            </div>

            {erros.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
                <ul className="list-disc list-inside text-red-700 text-sm">
                  {erros.map((erro, index) => (
                    <li key={index}>{erro}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmitFormulario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={enviando}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={enviando}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={enviando}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={mensagemContato}
                  onChange={(e) => setMensagemContato(e.target.value)}
                  disabled={enviando}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[96px]"
                  placeholder="Ex: Quero agendar uma visita no fim de semana..."
                  maxLength={1200}
                />
                <div className="mt-1 text-xs text-slate-500">
                  {mensagemContato.length}/1200
                </div>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? 'Enviando...' : 'Enviar Interesse'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
