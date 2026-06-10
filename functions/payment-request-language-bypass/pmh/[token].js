// THIRD-PARTY payment method manifest endpoint (Site B).
//
// Site A's merchant page calls PaymentRequest.show() with this cross-origin URL
// as `supportedMethods`. Brave's PaymentManifestDownloader (in the BROWSER
// process) sends a HEAD request here to look for a
// `Link: <...>; rel="payment-method-manifest"` header. That request goes through
// the browser-process URLLoaderFactory, which is NOT wrapped by
// BraveProxyingURLLoaderFactory, so the Accept-Language reduction in
// brave_reduce_language_network_delegate_helper.cc never runs and this
// unrelated third-party origin receives the user's full language list.
//
// We capture the Accept-Language header and stash it in the edge cache, keyed by
// a per-page token, so Site A's page can read it back (cross-origin via CORS)
// and compare against the reduced header a normal fetch() sends.

function storeKey(request, token) {
  return new Request(new URL('/__plb_store/' + token, request.url).toString());
}

export async function onRequest(context) {
  const { request, params } = context;

  const payload = JSON.stringify({
    acceptLanguage: request.headers.get('accept-language'),
    method: request.method,
    capturedAt: new Date().toISOString(),
  });

  await caches.default.put(
    storeKey(request, params.token),
    new Response(payload, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300',
      },
    }),
  );

  // No Link header: the downloader stops here, but Accept-Language is captured.
  return new Response('payment method manifest probe: Accept-Language captured', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
