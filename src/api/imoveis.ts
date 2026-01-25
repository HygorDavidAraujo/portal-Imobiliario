import { apiFetch } from './http';
import type { FiltrosCatalogo, Imovel } from '../types';

export interface PaginacaoInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type ImoveisListResponse = {
  data: Imovel[];
  pagination: PaginacaoInfo | null;
};

export type ImoveisFacetsResponse = {
  bairros: string[];
  cidades: string[];
  tipos: string[];
};

export const getImoveisPage = async (opts: {
  page: number;
  limit: number;
  sort: 'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc';
  filtros?: FiltrosCatalogo;
}): Promise<ImoveisListResponse> => {
  const params = new URLSearchParams();
  params.set('page', String(opts.page));
  params.set('limit', String(opts.limit));
  params.set('sort', opts.sort);

  const filtros = opts.filtros || {};
  if (filtros.q) params.set('q', filtros.q);
  if (filtros.id) params.set('id', filtros.id);
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.bairro) params.set('bairro', filtros.bairro);
  if (filtros.cidade) params.set('cidade', filtros.cidade);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (typeof filtros.precoMin === 'number') params.set('precoMin', String(filtros.precoMin));
  if (typeof filtros.precoMax === 'number') params.set('precoMax', String(filtros.precoMax));
  if (typeof filtros.quartos === 'number') params.set('quartos', String(filtros.quartos));

  const payload = await apiFetch<any>(`/api/imoveis?${params.toString()}`, {
    fallbackErrorMessage: 'Falha ao carregar imóveis.',
  });

  if (Array.isArray(payload)) {
    return { data: payload as Imovel[], pagination: null };
  }

  return {
    data: (payload?.data || []) as Imovel[],
    pagination: (payload?.pagination || null) as PaginacaoInfo | null,
  };
};

export const getImovelById = async (id: string): Promise<Imovel> => {
  return apiFetch<Imovel>(`/api/imoveis/${encodeURIComponent(id)}`, {
    fallbackErrorMessage: 'Falha ao carregar imóvel.',
  });
};

export const getImoveisFacets = async (): Promise<ImoveisFacetsResponse> => {
  const payload = await apiFetch<any>('/api/imoveis/facets', {
    fallbackErrorMessage: 'Falha ao carregar filtros.',
  });

  return {
    bairros: Array.isArray(payload?.bairros) ? payload.bairros : [],
    cidades: Array.isArray(payload?.cidades) ? payload.cidades : [],
    tipos: Array.isArray(payload?.tipos) ? payload.tipos : [],
  };
};
