import { apiFetch } from './http';
import type { ContatoCliente } from '../types';

export type CreateLeadInput = {
  id?: string;
  imovelId: string;
  imovelTitulo: string;
  cliente: ContatoCliente;
};

export const createLead = async (input: CreateLeadInput): Promise<{ ok: true }> => {
  return apiFetch<{ ok: true }>('/api/leads', {
    method: 'POST',
    body: {
      id: input.id,
      imovelId: input.imovelId,
      imovelTitulo: input.imovelTitulo,
      cliente: input.cliente,
    },
    fallbackErrorMessage: 'Não foi possível registrar seu interesse agora. Tente novamente.',
  });
};

export type SendLeadInput = {
  imovelId: string;
  imovelTitulo: string;
  preco?: string;
  endereco?: string;
  contato: ContatoCliente;
  link?: string;
  mensagem?: string;
};

export const sendLeadEmail = async (input: SendLeadInput): Promise<{ ok: true; provider?: string }> => {
  return apiFetch<{ ok: true; provider?: string }>('/api/send-lead', {
    method: 'POST',
    body: input,
    fallbackErrorMessage: 'Não foi possível enviar seus dados agora. Tente novamente.',
  });
};
