# Test Website B

A companion test site to [Test Website A](https://test-website-a.pages.dev), hosted on Cloudflare Pages at `test-website-b.pages.dev`.

It provides cross-origin pages, iframes, and redirect endpoints that Test Website A (and browser privacy tests in general) rely on to verify browser behaviour around tracking-protection features.

## Development

The root `index.html` is generated automatically from each test directory's `meta.json` file:

```bash
bash generate-index.sh
```

This script is also used as the Cloudflare Pages build command.
