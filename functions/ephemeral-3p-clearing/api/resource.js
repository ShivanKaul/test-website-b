function jsonResponse(value) {
  return new Response(JSON.stringify({
    value,
    serverTime: Date.now(),
  }), {
    headers: cacheHeaders("application/json; charset=utf-8"),
  });
}

function cacheHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=3600",
    "Timing-Allow-Origin": "*",
  };
}

function randomValue(type) {
  return `${type}:${crypto.randomUUID()}`;
}

function imageSvg(value) {
  const width = 1000 + Math.floor(Math.random() * 900000);

  return {
    observedValue: `${width}x1`,
    body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="1">
      <metadata>${value}</metadata>
      <rect width="${width}" height="1" />
    </svg>`,
  };
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "fetch";
  const value = randomValue(type);

  if (type === "fetch" || type === "xhr") {
    return jsonResponse(value);
  }

  if (type === "css") {
    return new Response(
      `#css-cache-target { --cache-probe-css: "${value}"; }\n`,
      { headers: cacheHeaders("text/css; charset=utf-8") }
    );
  }

  if (type === "script") {
    return new Response(
      `window.__resourceCacheProbe = window.__resourceCacheProbe || {};
window.__resourceCacheProbe.script = ${JSON.stringify(value)};
`,
      { headers: cacheHeaders("application/javascript; charset=utf-8") }
    );
  }

  if (type === "image") {
    const image = imageSvg(value);

    return new Response(image.body, {
      headers: cacheHeaders("image/svg+xml; charset=utf-8"),
    });
  }

  if (type === "iframe") {
    return new Response(
      `<!doctype html>
<meta charset="utf-8">
<body data-cache-probe-value="${escapeHtml(value)}">
  ${escapeHtml(value)}
</body>`,
      { headers: cacheHeaders("text/html; charset=utf-8") }
    );
  }

  return new Response(JSON.stringify({
    error: `Unknown resource type: ${type}`,
  }), {
    status: 400,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
