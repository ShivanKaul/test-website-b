export async function onRequestGet() {
  const ampHtml = `<html amp>
<head>
  <link rel="canonical" href="https://test-website-a.pages.dev/de-amp-download/canonical.html" />
</head>
<body>
  <h1>Fake AMP page (served as attachment)</h1>
  <p>This page was served with <code>Content-Disposition: attachment</code>.</p>
  <p>If you see this in the browser, either:</p>
  <ul>
    <li>De-AMP is disabled or you are not using Brave</li>
    <li>The browser chose to render the download inline</li>
  </ul>
  <p>The expected behavior in Brave with the fix is that this page is
  <strong>downloaded</strong>, not rendered or De-AMPed to the canonical URL.</p>
</body>
</html>`;

  return new Response(ampHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="amp-page.html"',
    },
  });
}
