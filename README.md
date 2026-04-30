# Test Website B

A companion test site to [Test Website A](https://test-website-a.pages.dev), hosted on Cloudflare Pages at `test-website-b.pages.dev`.

It provides cross-origin pages, iframes, and redirect endpoints that Test Website A (and browser privacy tests in general) rely on to verify browser behaviour around tracking-protection features.

## Tests

| Directory | Purpose |
|---|---|
| `de-amp/` | Hosts a fake AMP page that triggers a De-AMP redirect back to Site A, used to test `Sec-Fetch-Site` header bypass behaviour. |
| `de-amp-download/` | Supporting assets for the De-AMP download test. |
| `ephemeral-3p-clearing/` | Hosts the third-party iframe, bounce page, and cache endpoint used to test ephemeral third-party storage clearing. |
| `server-redirect/` | Tests browser behaviour on a server-side 302 redirect to a header-inspector page. |
| `storage-access/` | Hosts the embedded tester and seed page for the Storage Access API test. |
| `third-party-cookies/` | Hosts the top-level cookie setter and the iframe that checks third-party cookie visibility. |
| `window-name-clearing/` | Hosts the cross-origin navigation target for the `window.name` clearing test. |

## Development

The root `index.html` is generated automatically from each test directory's `meta.json` file:

```bash
bash generate-index.sh
```

This script is also used as the Cloudflare Pages build command.
