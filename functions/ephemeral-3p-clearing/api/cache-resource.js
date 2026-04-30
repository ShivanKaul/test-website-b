export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  const body = JSON.stringify({
    token,
    nonce: crypto.randomUUID(),
    serverTime: Date.now(),
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
