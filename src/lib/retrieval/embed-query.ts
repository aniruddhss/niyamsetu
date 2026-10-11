import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL_ID, QUERY_PREFIX } from "@/lib/retrieval/embedding-config";

type Extractor = (
  text: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>;

// Loaded lazily on first semantic query; never at server startup.
const store = globalThis as typeof globalThis & { __embeddingExtractor?: Promise<Extractor> | null };

function getExtractor(): Promise<Extractor> {
  if (!store.__embeddingExtractor) {
    store.__embeddingExtractor = import("@huggingface/transformers").then(({ pipeline, env }) => {
      env.allowLocalModels = true;
      env.localModelPath = process.env.EMBEDDING_CACHE_DIR ?? "./models";
      return (pipeline as unknown as (task: string, model: string, opts: object) => Promise<Extractor>)(
        "feature-extraction",
        EMBEDDING_MODEL_ID,
        { dtype: "fp32" },
      );
    }).catch((error: unknown) => {
      store.__embeddingExtractor = null;
      throw error;
    });
  }
  return store.__embeddingExtractor;
}

export async function embedQuery(text: string): Promise<number[] | null> {
  if (process.env.EMBEDDING_ENABLED !== "true") return null;
  try {
    const extractor = await getExtractor();
    const output = await extractor(QUERY_PREFIX + text, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data);
    return vector.length === EMBEDDING_DIMENSIONS ? vector : null;
  } catch {
    return null;
  }
}
