const COOKIE_ATTRIBUTES = "Path=/dbsc-partitioning; Secure; SameSite=None; HttpOnly";
const SID_PATTERN = /^[0-9a-f]{32}$/;

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

export function trackerPage(mode) {
  const label = mode === "seed" ? "Seed" : "Check";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>DBSC ${label}</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    body { max-width: 750px; }
    h1 { font-size: 1.1em; }
  </style>
  <script src="/dbsc-partitioning/frame.js" defer></script>
</head>
<body>
  <h1>DBSC ${label}</h1>
  <pre id="result" data-state="checking">Checking…</pre>
</body>
</html>`;
}

export async function onRequestGet({ request }) {
  const existing = cookieValue(request.headers.get("Cookie"), "h1_dbsc_id");
  const knownCookie = existing && SID_PATTERN.test(existing);
  const sid = knownCookie ? existing : crypto.randomUUID().replaceAll("-", "");
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
    "Set-Cookie": `h1_ordinary_id=${sid}; ${COOKIE_ATTRIBUTES}`,
  });
  if (!knownCookie) {
    headers.set(
      "Secure-Session-Registration",
      `(ES256);challenge="${crypto.randomUUID()}";path="/dbsc-partitioning/register?sid=${sid}"`,
    );
  }
  return new Response(trackerPage("seed"), { headers });
}
