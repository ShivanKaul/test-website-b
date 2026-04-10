export async function onRequestGet(context) {
  const { request } = context;

  const uaHeaderNames = new Set([
    'user-agent',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'sec-ch-ua-full-version-list',
    'sec-ch-ua-model',
    'sec-ch-ua-arch',
    'sec-ch-ua-bitness',
    'sec-ch-ua-platform-version',
    'sec-ch-ua-wow64',
  ]);

  const allHeaders = [...request.headers.entries()];
  const uaHeaders = allHeaders.filter(([name]) => uaHeaderNames.has(name)).sort((a, b) => a[0].localeCompare(b[0]));
  const otherHeaders = allHeaders.filter(([name]) => !uaHeaderNames.has(name)).sort((a, b) => a[0].localeCompare(b[0]));

  let headerRows = '';
  for (const [name, value] of [...uaHeaders, ...otherHeaders]) {
    headerRows += `<tr><td><code>${name}</code></td><td><code>${value}</code></td></tr>\n`;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Header Inspector -- Server-Side Redirect Test</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.45; margin: 0; padding: 18px; max-width: 800px; margin: 0 auto; }
    .card { border: 1px solid rgba(127,127,127,0.28); border-radius: 14px; padding: 12px; margin: 12px 0; background: rgba(127,127,127,0.06); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: rgba(127,127,127,0.14); padding: 2px 6px; border-radius: 4px; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid rgba(127,127,127,0.28); padding: 8px 12px; text-align: left; vertical-align: top; }
    th { background: rgba(127,127,127,0.1); }
    td code { word-break: break-all; }
    a { color: #0066cc; }
  </style>
</head>
<body>
  <h1>Header Inspector -- Server-Side Redirect Test</h1>
  <p>You arrived here via a server-side 302 redirect from <code>/server-redirect/go</code>.</p>

  <div class="card">
    <h2>HTTP Request Headers</h2>
    <table>
      <tr><th>Header</th><th>Value</th></tr>
      ${headerRows}
    </table>
  </div>

  <div class="card">
    <h2>JS Properties</h2>
    <table>
      <tr><th>Property</th><th>Value</th></tr>
      <tr><td><code>navigator.userAgent</code></td><td id="ua"></td></tr>
      <tr><td><code>navigator.userAgentData.brands</code></td><td id="brands"></td></tr>
      <tr><td><code>document.referrer</code></td><td id="referrer"></td></tr>
    </table>
  </div>

  <p><a href="/server-redirect/">Back to test page</a></p>

  <script>
    document.getElementById('ua').textContent = navigator.userAgent;
    document.getElementById('referrer').textContent = document.referrer || '(empty)';

    if (navigator.userAgentData) {
      const brands = navigator.userAgentData.brands
        .map(b => b.brand + ' ' + b.version)
        .join(', ');
      document.getElementById('brands').textContent = brands;
    } else {
      document.getElementById('brands').textContent = '(navigator.userAgentData not supported)';
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
