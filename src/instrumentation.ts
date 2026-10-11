export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Warm the embedding model in the background so the first query doesn't pay the load cost.
  const { getExtractor } = await import("@/lib/retrieval/embed-query");
  getExtractor().catch(() => {});
}
