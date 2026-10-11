import { pipeline, env } from "@huggingface/transformers";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL_ID, QUERY_PREFIX } from "@/lib/retrieval/embedding-config";

type Extractor = (
  text: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>;

// Stored on globalThis so the instance warmed in instrumentation.ts is reused by route bundles.
const store = globalThis as typeof globalThis & { __embeddingExtractor?: Promise<Extractor> | null };

export function getExtractor(): Promise<Extractor> {
  if (!store.__embeddingExtractor) {
    env.allowLocalModels = true;
    env.localModelPath = process.env.EMBEDDING_CACHE_DIR ?? "./models";
    store.__embeddingExtractor = (pipeline as unknown as (task: string, model: string, opts: object) => Promise<Extractor>)(
      "feature-extraction",
      EMBEDDING_MODEL_ID,
      { dtype: "fp32" },
    ).catch((error: unknown) => {
      store.__embeddingExtractor = null;
      throw error;
    });
  }
  return store.__embeddingExtractor;
}

export async function embedQuery(text: string): Promise<number[] | null> {
  try {
    const extractor = await getExtractor();
    const output = await extractor(QUERY_PREFIX + text, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data);
    return vector.length === EMBEDDING_DIMENSIONS ? vector : null;
  } catch {
    return null;
  }
}
