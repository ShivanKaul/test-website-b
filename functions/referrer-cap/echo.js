// Referer echo for the referrer cap test.
//
// GET /referrer-cap/echo?as=<json|svg|html>&id=<token>
//
//   as=json  CORS-readable JSON: { referer, id }. Used by fetch().
//   as=svg   An SVG whose intrinsic size encodes the Referer, so a
//            cross-origin <img> can report it without CORS or canvas reads
//            (canvas readback is farbled in Brave):
//              width  1 = no Referer, 2 = origin only, 3 = path or query, 4 = unparseable
//              height = Referer length + 1 (capped)
//   as=html  A page that shows the Referer header and document.referrer, and
//            posts both to the parent when framed. Used by iframes and
//            top-level navigations.

function classify(referer) {
  if (!referer) return 1;
  try {
    const u = new URL(referer);
    return u.pathname === '/' && !u.search ? 2 : 3;
  } catch {
    return 4;
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// JSON that is safe to embed inside a <script> element.
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const as = url.searchParams.get('as') || 'html';
  const id = url.searchParams.get('id') || '';
  const referer = request.headers.get('Referer') || '';

  const common = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };

  if (as === 'json') {
    return new Response(JSON.stringify({ referer, id }), {
      headers: { ...common, 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  if (as === 'svg') {
    const width = classify(referer);
    const height = Math.min(referer.length, 4000) + 1;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`;
    return new Response(svg, {
      headers: { ...common, 'Content-Type': 'image/svg+xml' },
    });
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Referer Echo</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <h1>Referer Echo</h1>
  <div class="card">
    <table>
      <tr><th>Source</th><th>Value</th></tr>
      <tr><td><code>Referer</code> header (server)</td><td><code>${escapeHtml(referer) || '(none)'}</code></td></tr>
      <tr><td><code>document.referrer</code> (JS)</td><td><code id="doc-ref"></code></td></tr>
    </table>
    <p id="verdict" class="verdict"></p>
  </div>
  <p><a href="https://test-website-a.pages.dev/referrer-cap/">Back to the test page</a></p>
  <script>
    const referer = ${scriptJson(referer)};
    const id = ${scriptJson(id)};
    document.getElementById('doc-ref').textContent = document.referrer || '(empty)';

    let cls = 'none';
    try {
      const u = new URL(referer);
      cls = u.pathname === '/' && !u.search ? 'origin' : 'full';
    } catch {}
    const verdict = document.getElementById('verdict');
    if (cls === 'full') {
      verdict.className = 'verdict leak';
      verdict.textContent = 'Full URL received. With Shields up, Brave should have capped this to the origin.';
    } else if (cls === 'origin') {
      verdict.className = 'verdict ok';
      verdict.textContent = 'Origin only. The referrer was capped.';
    } else {
      verdict.textContent = 'No Referer header received.';
    }

    if (window.parent !== window) {
      window.parent.postMessage({ id, referer, docReferrer: document.referrer }, '*');
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { ...common, 'Content-Type': 'text/html; charset=utf-8' },
  });
}
