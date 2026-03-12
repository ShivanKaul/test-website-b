#!/usr/bin/env bash
# Generates index.html from */meta.json files.
# Used as the CF Pages build command.
set -euo pipefail

SITE_NAME="Test Website B"
SITE_DOMAIN="test-website-b.pages.dev"
OTHER_SITE_NAME="Test Website A"
OTHER_SITE_URL="https://test-website-a.pages.dev"

cards=""
count=0

for meta in */meta.json; do
  [ -f "$meta" ] || continue
  dir="$(dirname "$meta")"

  # Skip non-test directories
  case "$dir" in
    functions|.git|node_modules) continue ;;
  esac

  title="$(python3 -c "import json,sys; print(json.load(sys.stdin)['title'])" < "$meta")"
  desc="$(python3 -c "import json,sys; print(json.load(sys.stdin)['description'])" < "$meta")"

  cards="${cards}
    <a class=\"card\" href=\"${dir}/\">
      <h2>${title}</h2>
      <p>${desc}</p>
      <span class=\"dir\">${dir}/</span>
    </a>"
  count=$((count + 1))
done

cat > index.html <<HTMLEOF
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${SITE_NAME}</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.45;
      margin: 0;
      padding: 18px;
      max-width: 800px;
      margin: 0 auto;
    }
    header { margin-bottom: 18px; }
    header p { margin: 4px 0; opacity: 0.85; }
    header a { color: #0066cc; }
    a.card {
      display: block;
      border: 1px solid rgba(127,127,127,0.28);
      border-radius: 14px;
      padding: 14px 16px;
      margin: 12px 0;
      background: rgba(127,127,127,0.06);
      text-decoration: none;
      color: inherit;
      transition: background 0.15s;
    }
    a.card:hover { background: rgba(127,127,127,0.12); }
    a.card h2 { margin: 0 0 4px 0; font-size: 1.15em; }
    a.card p { margin: 0 0 6px 0; opacity: 0.85; }
    a.card .dir {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.85em;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <header>
    <h1>${SITE_NAME}</h1>
    <p><code>${SITE_DOMAIN}</code> &mdash; ${count} tests</p>
    <p>See also: <a href="${OTHER_SITE_URL}">${OTHER_SITE_NAME}</a></p>
  </header>
${cards}
</body>
</html>
HTMLEOF

echo "Generated index.html with ${count} test cards."
