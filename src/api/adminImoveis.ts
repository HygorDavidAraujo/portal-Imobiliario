import { apiFetch } from './http';

export const getNextImovelId = async (tipo: string): Promise<{ id: string }> => {
  const params = new URLSearchParams();
  params.set('tipo', tipo);
  return apiFetch<{ id: string }>(`/api/imoveis/next-id?${params.toString()}`, {
    auth: true,
    fallbackErrorMessage: 'Erro ao gerar ID do imóvel.',
  });
};

export type UploadImageResponse = {
  url: string;
  publicId: string;
};

export const uploadImovelImage = async (opts: { imovelId: string; file: File }): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('image', opts.file);
  formData.append('imovelId', opts.imovelId);

  return apiFetch<UploadImageResponse>('/api/upload-image', {
    method: 'POST',
    auth: true,
    body: formData,
    fallbackErrorMessage: 'Erro ao fazer upload da imagem.',
  });
};

export const deleteImovelImage = async (publicId: string): Promise<{ ok: true }> => {
  return apiFetch<{ ok: true }>('/api/delete-image', {
    method: 'DELETE',
    auth: true,
    body: { publicId },
    fallbackErrorMessage: 'Erro ao remover a imagem.',
  });
};
