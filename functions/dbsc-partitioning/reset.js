const COOKIE_ATTRIBUTES = "Path=/dbsc-partitioning; Secure; SameSite=None; HttpOnly";

export async function onRequestGet() {
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Clear-Site-Data": '"cookies"',
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
  });
  headers.append("Set-Cookie", `h1_ordinary_id=; Max-Age=0; ${COOKIE_ATTRIBUTES}`);
  headers.append("Set-Cookie", `h1_dbsc_id=; Max-Age=0; ${COOKIE_ATTRIBUTES}`);

  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Reset complete</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <p>Reset complete.</p>
  <p><a href="https://test-website-a.pages.dev/dbsc-partitioning/">Return to test</a></p>
  <script>
    if (window.parent !== window) {
      window.parent.postMessage({ type: "dbsc-reset-complete" },
        "https://test-website-a.pages.dev");
    } else {
      location.replace("https://test-website-a.pages.dev/dbsc-partitioning/");
    }
  </script>
</body>
</html>`, { headers });
}
