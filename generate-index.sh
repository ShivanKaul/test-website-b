#!/usr/bin/env bash
# Generates index.html from */meta.json files.
# Used as the CF Pages build command.
set -euo pipefail

SITE_NAME="Test Website B"
SITE_DOMAIN="test-website-b.pages.dev"
OTHER_SITE_NAME="Test Website A"
OTHER_SITE_URL="https://test-website-a.pages.dev"

# Order test directories newest first by the "added" date (YYYY-MM-DD) in each
# meta.json. Entries without an "added" field sort to the bottom. New tests
# should set "added" in their meta.json.
entries=""
for meta in */meta.json; do
  [ -f "$meta" ] || continue
  dir="$(dirname "$meta")"

  # Skip non-test directories
  case "$dir" in
    functions|.git|node_modules) continue ;;
  esac

  added="$(python3 -c "import json,sys; print(json.load(sys.stdin).get('added','0000-00-00'))" < "$meta")"
  entries="${entries}${added}	${dir}
"
done

cards=""
count=0
while IFS=$'\t' read -r added dir; do
  [ -n "$dir" ] || continue
  meta="${dir}/meta.json"

  title="$(python3 -c "import json,sys; print(json.load(sys.stdin)['title'])" < "$meta")"
  desc="$(python3 -c "import json,sys; print(json.load(sys.stdin)['description'])" < "$meta")"

  cards="${cards}
    <a class=\"card\" href=\"${dir}/\">
      <h2>${title}</h2>
      <p>${desc}</p>
      <span class=\"dir\">${dir}/</span>
    </a>"
  count=$((count + 1))
done <<EOF
$(printf '%s' "$entries" | sort -r)
EOF

cat > index.html <<HTMLEOF
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${SITE_NAME}</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <header class="site-header">
    <h1>${SITE_NAME}</h1>
    <p><code>${SITE_DOMAIN}</code> &mdash; ${count} tests</p>
    <p>See also: <a href="${OTHER_SITE_URL}">${OTHER_SITE_NAME}</a></p>
  </header>
${cards}
</body>
</html>
HTMLEOF

echo "Generated index.html with ${count} test cards."

# ---------------------------------------------------------------------------
# Generate sub-index pages for group directories that contain test sub-dirs.
# Currently: de-amp/
# ---------------------------------------------------------------------------
for group_dir in de-amp; do
  [ -d "$group_dir" ] || continue
  group_meta="${group_dir}/meta.json"
  [ -f "$group_meta" ] || continue

  group_title="$(python3 -c "import json,sys; print(json.load(sys.stdin)['title'])" < "$group_meta")"

  sub_entries=""
  for sub_meta in "${group_dir}"/*/meta.json; do
    [ -f "$sub_meta" ] || continue
    sub_dir="$(dirname "$sub_meta")"
    sub_added="$(python3 -c "import json,sys; print(json.load(sys.stdin).get('added','0000-00-00'))" < "$sub_meta")"
    sub_entries="${sub_entries}${sub_added}	${sub_dir}
"
  done

  sub_cards=""
  sub_count=0
  while IFS=$'\t' read -r sub_added sub_dir; do
    [ -n "$sub_dir" ] || continue
    sub_meta="${sub_dir}/meta.json"
    sub_title="$(python3 -c "import json,sys; print(json.load(sys.stdin)['title'])" < "$sub_meta")"
    sub_desc="$(python3 -c "import json,sys; print(json.load(sys.stdin)['description'])" < "$sub_meta")"
    # Link is relative: strip the group prefix so "de-amp/download" → "download/"
    link_dir="$(basename "$sub_dir")"

    sub_cards="${sub_cards}
    <a class=\"card\" href=\"${link_dir}/\">
      <h2>${sub_title}</h2>
      <p>${sub_desc}</p>
      <span class=\"dir\">${link_dir}/</span>
    </a>"
    sub_count=$((sub_count + 1))
  done <<SUBEOF
$(printf '%s' "$sub_entries" | sort -r)
SUBEOF

  cat > "${group_dir}/index.html" <<SUBHTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${group_title} – ${SITE_NAME}</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <header class="site-header">
    <h1>${group_title}</h1>
    <p><code>${SITE_DOMAIN}/${group_dir}/</code> &mdash; ${sub_count} tests &mdash; <a href="/">← All tests</a></p>
  </header>
${sub_cards}
</body>
</html>
SUBHTML

  echo "Generated ${group_dir}/index.html with ${sub_count} test cards."
done
