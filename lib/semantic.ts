import { isGeminiConfigured, isSupabaseConfigured } from "./config";
import {
  buildProfileEmbeddingInput,
  buildRegulationEmbeddingInput,
  cosineSimilarity,
  EMBEDDING_MODEL,
  stableHash,
} from "./embeddingInputs";
import { getCachedEmbeddings, getCachedRegulation, upsertRegulationCache } from "./db/cache";
import { getProfile, getProfileEmbedding, updateProfileEmbedding } from "./db/profiles";
import { listStories } from "./db/stories";
import { embedText } from "./llm/client";
import type { Regulation } from "./types";

export async function refreshProfileEmbedding(
  userId: string,
): Promise<boolean> {
  if (!isGeminiConfigured || !isSupabaseConfigured) return false;
  const profile = await getProfile(userId);
  if (!profile) return false;
  const stories = await listStories(userId);
  const input = buildProfileEmbeddingInput(profile, stories);
  const hash = stableHash(input);
  const existing = await getProfileEmbedding(userId);
  if (
    existing?.embedding &&
    existing.embeddingHash === hash &&
    existing.embeddingModel === EMBEDDING_MODEL
  ) {
    return false;
  }

  const embedding = await embedText(input, "RETRIEVAL_QUERY");
  await updateProfileEmbedding(userId, {
    embedding,
    embeddingHash: hash,
    embeddingModel: EMBEDDING_MODEL,
  });
  return true;
}

export async function refreshProfileEmbeddingSafe(
  userId: string,
): Promise<void> {
  try {
    await refreshProfileEmbedding(userId);
  } catch {
    // Embeddings improve ranking but should never block profile/story saves.
  }
}

export async function ensureRegulationEmbedding(
  reg: Regulation,
): Promise<boolean> {
  if (!isGeminiConfigured || !isSupabaseConfigured) return false;
  const input = buildRegulationEmbeddingInput(reg);
  const hash = stableHash(input);
  const existing = await getCachedRegulation(reg.id);
  if (
    existing?.embedding &&
    existing.embeddingHash === hash &&
    existing.embeddingModel === EMBEDDING_MODEL
  ) {
    return false;
  }

  const embedding = await embedText(input, "RETRIEVAL_DOCUMENT");
  await upsertRegulationCache({
    documentId: reg.id,
    docketId: reg.docketId,
    embedding,
    embeddingHash: hash,
    embeddingModel: EMBEDDING_MODEL,
    embeddingGeneratedAt: new Date().toISOString(),
  });
  return true;
}

export async function enrichRegulationsWithSemanticScores(
  userId: string | null,
  regs: Regulation[],
): Promise<Regulation[]> {
  if (!userId || !isSupabaseConfigured || regs.length === 0) return regs;

  try {
    let profileEmbedding = await getProfileEmbedding(userId);
    if (
      (!profileEmbedding?.embedding ||
        profileEmbedding.embeddingModel !== EMBEDDING_MODEL) &&
      isGeminiConfigured
    ) {
      await refreshProfileEmbeddingSafe(userId);
      profileEmbedding = await getProfileEmbedding(userId);
    }

    if (!profileEmbedding?.embedding) return regs;

    const embeddings = await getCachedEmbeddings(regs.map((r) => r.id));
    if (embeddings.size === 0) return regs;

    return regs.map((reg) => {
      const cached = embeddings.get(reg.id);
      if (!cached?.embedding) return reg;
      const semanticScore = cosineSimilarity(
        profileEmbedding.embedding!,
        cached.embedding,
      );
      return semanticScore === null ? reg : { ...reg, semanticScore };
    });
  } catch {
    return regs;
  }
}
