function cookieValue(header, name) {
  const prefix = `${name}=`;
  for (const part of (header || "").split(";")) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) {
      return cookie.slice(prefix.length);
    }
  }
  return null;
}

export async function onRequestGet({ request }) {
  const cookies = request.headers.get("Cookie");
  return new Response(
    JSON.stringify({
      dbsc: cookieValue(cookies, "h1_dbsc_id"),
      ordinary: cookieValue(cookies, "h1_ordinary_id"),
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
