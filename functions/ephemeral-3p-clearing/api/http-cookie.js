const COOKIE_NAME = "brave_ephemeral_3p_probe_http";

function parseCookies(header) {
  const cookies = new Map();

  for (const part of (header || "").split(";")) {
    const index = part.indexOf("=");

    if (index === -1) continue;

    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    cookies.set(name, decodeURIComponent(value));
  }

  return cookies;
}

function cookieHeader(value, maxAge) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "SameSite=None",
    "Secure",
  ].join("; ");
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "read";
  const cookies = parseCookies(request.headers.get("cookie"));

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (mode === "write") {
    const token = url.searchParams.get("token") || "";

    headers["Set-Cookie"] = cookieHeader(token, 3600);

    return new Response(JSON.stringify({
      mode,
      value: token,
    }), { headers });
  }

  if (mode === "clear") {
    headers["Set-Cookie"] = cookieHeader("", 0);

    return new Response(JSON.stringify({
      mode,
      value: null,
    }), { headers });
  }

  if (mode === "read") {
    return new Response(JSON.stringify({
      mode,
      value: cookies.get(COOKIE_NAME) || null,
    }), { headers });
  }

  return new Response(JSON.stringify({
    error: `Unknown mode: ${mode}`,
  }), {
    status: 400,
    headers,
  });
}
