import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

type Foto = {
  id?: string;
  url: string;
  isDestaque?: boolean;
};

type Args = {
  dryRun: boolean;
  limit?: number;
  onlyImovelId?: string;
  sleepMs: number;
};

const parseArgs = (): Args => {
  const args = process.argv.slice(2);
  const get = (prefix: string) => {
    const hit = args.find((a) => a.startsWith(prefix));
    return hit ? hit.slice(prefix.length) : undefined;
  };

  const dryRun = args.includes('--dry-run');
  const limitRaw = get('--limit=');
  const onlyImovelId = get('--imovelId=');
  const sleepRaw = get('--sleepMs=');

  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
  const sleepMs = sleepRaw ? Number.parseInt(sleepRaw, 10) : 300;

  return {
    dryRun,
    limit: Number.isFinite(limit as number) ? (limit as number) : undefined,
    onlyImovelId,
    sleepMs: Number.isFinite(sleepMs) ? Math.max(0, sleepMs) : 300,
  };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isCloudinaryUrl = (url: string) => {
  const u = String(url || '');
  return u.includes('res.cloudinary.com') && u.includes('/upload/');
};

const isDataImage = (url: string) => String(url || '').startsWith('data:image/');

const isHttpUrl = (url: string) => /^https?:\/\//i.test(String(url || ''));

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Variável de ambiente obrigatória não encontrada: ${key}`);
  return value;
};

const normalizeFotos = (raw: unknown): Foto[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((f) => ({
        id: typeof (f as any)?.id === 'string' ? (f as any).id : undefined,
        url: typeof (f as any)?.url === 'string' ? (f as any).url : '',
        isDestaque: Boolean((f as any)?.isDestaque),
      }))
      .filter((f) => f.url);
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return normalizeFotos(parsed);
    } catch {
      return [];
    }
  }

  return [];
};

const main = async () => {
  const { dryRun, limit, onlyImovelId, sleepMs } = parseArgs();

  const cloudName = requireEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = requireEnv('CLOUDINARY_API_KEY');
  const apiSecret = requireEnv('CLOUDINARY_API_SECRET');

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const prisma = new PrismaClient();

  console.log('🔎 Iniciando migração de fotos para o Cloudinary');
  console.log(`- dryRun: ${dryRun}`);
  console.log(`- limit: ${limit ?? 'sem limite'}`);
  console.log(`- imovelId: ${onlyImovelId ?? 'todos'}`);
  console.log(`- sleepMs: ${sleepMs}`);

  let processedImoveis = 0;
  let uploadedFotos = 0;
  let skippedFotos = 0;
  let failedFotos = 0;

  const where = onlyImovelId ? { id: onlyImovelId } : undefined;

  // Busca somente campos necessários
  const imoveis = await prisma.imovel.findMany({
    where,
    select: { id: true, fotos: true },
    orderBy: { criadoEm: 'asc' },
  });

  for (const imovel of imoveis) {
    if (typeof limit === 'number' && processedImoveis >= limit) break;

    const fotos = normalizeFotos(imovel.fotos);
    if (!fotos.length) continue;

    const needsAnyMigration = fotos.some((f) => !isCloudinaryUrl(f.url));
    if (!needsAnyMigration) continue;

    console.log(`\n🏠 Imóvel ${imovel.id}: ${fotos.length} foto(s)`);

    const newFotos: Foto[] = [];
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      const url = foto.url;

      if (isCloudinaryUrl(url)) {
        newFotos.push(foto);
        skippedFotos += 1;
        continue;
      }

      if (!isDataImage(url) && !isHttpUrl(url)) {
        console.warn(`⚠️  Foto ${i + 1}: URL não suportada (não é http nem data:image). Mantendo como está.`);
        newFotos.push(foto);
        failedFotos += 1;
        continue;
      }

      try {
        console.log(`⬆️  Upload foto ${i + 1}/${fotos.length}...`);

        if (dryRun) {
          // Simula mantendo placeholder para demonstrar resultado sem escrever no banco
          newFotos.push({
            id: foto.id,
            url: url,
            isDestaque: foto.isDestaque,
          });
          uploadedFotos += 1;
          continue;
        }

        const result = await cloudinary.uploader.upload(url, {
          folder: `portal-imobiliario/imoveis/${imovel.id}`,
          resource_type: 'image',
          tags: [imovel.id, 'portal-imobiliario', 'migrated'],
          transformation: [
            { width: 1600, height: 1200, crop: 'limit', quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        });

        newFotos.push({
          id: result.public_id,
          url: result.secure_url,
          isDestaque: foto.isDestaque,
        });

        uploadedFotos += 1;
        await sleep(sleepMs);
      } catch (error) {
        console.error(`❌ Falha no upload da foto ${i + 1}:`, error);
        newFotos.push(foto);
        failedFotos += 1;
      }
    }

    if (!dryRun) {
      await prisma.imovel.update({
        where: { id: imovel.id },
        data: { fotos: JSON.stringify(newFotos) },
      });
      console.log(`✅ Atualizado no banco: ${imovel.id}`);
    } else {
      console.log(`(dry-run) Não atualizou banco: ${imovel.id}`);
    }

    processedImoveis += 1;
  }

  await prisma.$disconnect();

  console.log('\n📦 Resumo');
  console.log(`- Imóveis processados: ${processedImoveis}`);
  console.log(`- Fotos enviadas: ${uploadedFotos}`);
  console.log(`- Fotos já Cloudinary (pulas): ${skippedFotos}`);
  console.log(`- Fotos com falha/não suportadas: ${failedFotos}`);
  console.log('✅ Fim');
};

main().catch((err) => {
  console.error('❌ Migração abortada:', err);
  process.exitCode = 1;
});
