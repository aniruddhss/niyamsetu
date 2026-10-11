import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL_ID, QUERY_PREFIX } from "@/lib/retrieval/embedding-config";

type Extractor = (
  text: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>;

let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers").then(({ pipeline, env }) => {
      env.allowLocalModels = true;
      env.localModelPath = process.env.EMBEDDING_CACHE_DIR ?? "./models";
      return (pipeline as unknown as (task: string, model: string, opts: object) => Promise<Extractor>)(
        "feature-extraction",
        EMBEDDING_MODEL_ID,
        { dtype: "fp32" },
      );
    }).catch((error: unknown) => {
      extractorPromise = null;
      throw error;
    });
  }
  return extractorPromise;
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
